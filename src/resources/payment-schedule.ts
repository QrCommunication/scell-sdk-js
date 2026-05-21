/**
 * Payment Schedule Resource
 *
 * Wraps all endpoints under `/quotes/{quote}/payment-schedule/*` and
 * the `GET /payment-schedule/presets` catalog endpoint.
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { MessageWithDataResponse } from '../types/common.js';
import type { Invoice } from '../types/invoices.js';
import type {
  ConvertScheduleLineInput,
  PatchPaymentScheduleInput,
  PaymentScheduleLineInput,
  PaymentScheduleResponse,
  PaymentSummary,
  SchedulePreset,
} from '../types/payment-schedule.js';

/**
 * Payment Schedule API resource
 *
 * Manage installment plans attached to quotes. Each line represents one
 * payment milestone — either a percentage of the quote total or a fixed
 * amount — triggered by a calendar date and/or a free-text milestone label.
 *
 * Lines are editable until the quote is accepted (signed). Once locked,
 * only `invoice_id`, `status`, and reminder tracking fields can change.
 *
 * @example
 * ```typescript
 * const client = new ScellApiClient('sk_live_xxx');
 *
 * // 1. Define an installment plan: 30% upfront, 70% on delivery
 * await client.quotes.paymentSchedule.set('quote-uuid', [
 *   { amount_type: 'percent', amount_value: 30, due_date: '2026-06-01', milestone_label: 'Acompte commande', auto_generate: true },
 *   { amount_type: 'percent', amount_value: 70, milestone_label: 'Livraison MVP', auto_generate: false },
 * ]);
 *
 * // 2. Check how much has been invoiced
 * const summary = await client.quotes.paymentSchedule.summary('quote-uuid');
 * console.log('Remaining:', summary.invoiced.remaining_ttc);
 *
 * // 3. Convert a pending line into a deposit invoice
 * const { data: invoice } = await client.quotes.paymentSchedule.convertLine(
 *   'quote-uuid',
 *   'line-uuid',
 *   { send_email: true }
 * );
 * console.log('Deposit invoice:', invoice.invoice_number);
 * ```
 */
export class PaymentScheduleResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the payment schedule for a quote (all lines + metadata)
   *
   * @param quoteId - Quote UUID
   * @param requestOptions - Per-request options
   * @returns All schedule lines with meta counts
   *
   * @example
   * ```typescript
   * const { data: lines, meta } = await client.quotes.paymentSchedule.get('quote-uuid');
   * console.log(`${meta.pending_count} lines pending`);
   * ```
   */
  async get(
    quoteId: string,
    requestOptions?: RequestOptions
  ): Promise<PaymentScheduleResponse> {
    return this.http.get<PaymentScheduleResponse>(
      `/quotes/${quoteId}/payment-schedule`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create or replace the payment schedule (atomic full replacement)
   *
   * Replaces any existing schedule atomically. If the quote has pending
   * lines that have already been converted to invoices, the replacement
   * will be rejected with a 422 `SCHEDULE_HAS_INVOICED_LINES` error.
   *
   * Use `patch()` for targeted updates that preserve existing lines.
   *
   * @param quoteId - Quote UUID
   * @param lines - Full list of lines to set (replaces any existing schedule)
   * @param requestOptions - Per-request options
   * @returns Created schedule lines
   *
   * @example
   * ```typescript
   * // Apply a preset
   * const [preset] = await client.quotes.paymentSchedule.presets();
   * await client.quotes.paymentSchedule.set('quote-uuid', preset.lines);
   *
   * // Or build manually
   * await client.quotes.paymentSchedule.set('quote-uuid', [
   *   { amount_type: 'percent', amount_value: 30, due_date: '2026-06-01', auto_generate: true },
   *   { amount_type: 'percent', amount_value: 70, milestone_label: 'Livraison', auto_generate: false },
   * ]);
   * ```
   */
  async set(
    quoteId: string,
    lines: PaymentScheduleLineInput[],
    requestOptions?: RequestOptions
  ): Promise<PaymentScheduleResponse> {
    return this.http.post<PaymentScheduleResponse>(
      `/quotes/${quoteId}/payment-schedule`,
      { lines },
      requestOptions
    );
  }

  /**
   * Partially update the payment schedule (add / update / remove lines)
   *
   * All three arrays are optional — you can mix operations in a single call.
   * Existing invoiced lines are preserved; attempts to remove them return
   * a 422 `SCHEDULE_LINE_ALREADY_INVOICED` error.
   *
   * @param quoteId - Quote UUID
   * @param changes - Partial changes: `add`, `update`, `remove` arrays
   * @param requestOptions - Per-request options
   * @returns Updated full schedule
   *
   * @example
   * ```typescript
   * // Move the delivery milestone to a later date
   * await client.quotes.paymentSchedule.patch('quote-uuid', {
   *   update: [{ id: 'line-uuid', due_date: '2026-07-15' }],
   * });
   *
   * // Add a new line and remove an old one
   * await client.quotes.paymentSchedule.patch('quote-uuid', {
   *   add: [{ amount_type: 'percent', amount_value: 10, milestone_label: 'Recette' }],
   *   remove: ['old-line-uuid'],
   * });
   * ```
   */
  async patch(
    quoteId: string,
    changes: PatchPaymentScheduleInput,
    requestOptions?: RequestOptions
  ): Promise<PaymentScheduleResponse> {
    return this.http.patch<PaymentScheduleResponse>(
      `/quotes/${quoteId}/payment-schedule`,
      changes,
      requestOptions
    );
  }

  /**
   * Delete the entire payment schedule for a quote
   *
   * Only possible when the quote has not yet been accepted (signed).
   * All pending lines are deleted. Invoiced lines cause a 422
   * `SCHEDULE_HAS_INVOICED_LINES` error.
   *
   * @param quoteId - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Success message
   *
   * @example
   * ```typescript
   * await client.quotes.paymentSchedule.delete('quote-uuid');
   * ```
   */
  async delete(
    quoteId: string,
    requestOptions?: RequestOptions
  ): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/quotes/${quoteId}/payment-schedule`,
      requestOptions
    );
  }

  /**
   * Get the real-time payment summary for a quote
   *
   * Returns the planned installment total, what has been invoiced (gross and
   * net of credit notes), the remaining balance, next upcoming due date, and
   * any overdue lines. Also includes SUPER PDP transmission status for
   * each deposit invoice already issued.
   *
   * @param quoteId - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Full payment summary
   *
   * @example
   * ```typescript
   * const summary = await client.quotes.paymentSchedule.summary('quote-uuid');
   * console.log('Remaining TTC:', summary.invoiced.remaining_ttc);
   * if (summary.overdue.length > 0) {
   *   console.warn(`${summary.overdue.length} overdue lines!`);
   * }
   * ```
   */
  async summary(
    quoteId: string,
    requestOptions?: RequestOptions
  ): Promise<PaymentSummary> {
    return this.http.get<PaymentSummary>(
      `/quotes/${quoteId}/payment-summary`,
      undefined,
      requestOptions
    );
  }

  /**
   * Convert a pending schedule line into a deposit invoice
   *
   * The quote must be in `accepted` status. The target line must be
   * in `pending` status. On success, the line's `status` transitions
   * to `'invoiced'` and `invoice_id` is set.
   *
   * @param quoteId - Quote UUID
   * @param lineId - UUID of the pending schedule line
   * @param options - Optional overrides for the generated invoice
   * @param requestOptions - Per-request options
   * @returns The created deposit invoice
   *
   * @example
   * ```typescript
   * // Convert and immediately send to buyer
   * const { data: invoice } = await client.quotes.paymentSchedule.convertLine(
   *   'quote-uuid',
   *   'line-uuid',
   *   { send_email: true, label: 'Acompte livraison MVP' }
   * );
   * console.log('Created invoice:', invoice.invoice_number);
   * ```
   */
  async convertLine(
    quoteId: string,
    lineId: string,
    options: ConvertScheduleLineInput = {},
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Invoice>> {
    return this.http.post<MessageWithDataResponse<Invoice>>(
      `/quotes/${quoteId}/payment-schedule/lines/${lineId}/convert`,
      options,
      requestOptions
    );
  }

  /**
   * Get available schedule preset templates
   *
   * Returns server-defined presets for common installment patterns
   * (30/70, 50/50, 30/30/40, 3 monthly installments, etc.).
   *
   * Apply a preset via `set(quoteId, preset.lines)`.
   *
   * @param requestOptions - Per-request options
   * @returns List of available presets
   *
   * @example
   * ```typescript
   * const presets = await client.quotes.paymentSchedule.presets();
   * const halfHalf = presets.find(p => p.key === '50-50');
   * if (halfHalf) {
   *   await client.quotes.paymentSchedule.set('quote-uuid', halfHalf.lines);
   * }
   * ```
   */
  async presets(
    requestOptions?: RequestOptions
  ): Promise<SchedulePreset[]> {
    return this.http.get<SchedulePreset[]>(
      '/payment-schedule/presets',
      undefined,
      requestOptions
    );
  }
}

/**
 * Recurring Invoices Resource — subscription / retainer invoice profiles
 * (scoped tenant + sub_tenant).
 *
 * A profile bundles a buyer, line items and a recurrence schedule. The
 * platform emits invoices automatically on the cadence; each run is tracked as
 * an occurrence. Lifecycle controls (`pause` / `activate` / `cancel`) and a
 * manual `runNow` are provided.
 *
 * @since 2.33.0
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  PaginatedResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  CreateRecurringInvoiceInput,
  RecurringInvoiceListOptions,
  RecurringInvoiceOccurrence,
  RecurringInvoiceOccurrenceListOptions,
  RecurringInvoiceProfile,
  UpdateRecurringInvoiceInput,
} from '../types/recurring-invoices.js';

/**
 * Recurring invoices API resource.
 *
 * @example
 * ```typescript
 * // Create a monthly subscription profile from a registered buyer
 * const profile = await client.recurringInvoices.create({
 *   title: 'Abonnement mensuel — Acme',
 *   buyer_id: buyer.id,
 *   currency: 'EUR',
 *   output_format: 'facturx',
 *   lines: [
 *     { description: 'Licence SaaS', quantity: 1, unit_price: 49, vat_rate: 20 },
 *   ],
 *   recurrence: { interval_unit: 'month', interval_count: 1, day_of_month: 1 },
 *   start_date: '2026-07-01',
 *   end_mode: 'never',
 *   emission_mode: 'auto_send',
 *   notify_before_days: 3,
 * });
 *
 * // Inspect the generated occurrences
 * const { data: runs } = await client.recurringInvoices.occurrences(profile.id);
 *
 * // Pause, then resume later
 * await client.recurringInvoices.pause(profile.id);
 * await client.recurringInvoices.activate(profile.id);
 * ```
 */
export class RecurringInvoicesResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    options?: RecurringInvoiceListOptions,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<RecurringInvoiceProfile>> {
    return this.http.get<PaginatedResponse<RecurringInvoiceProfile>>(
      '/recurring-invoices',
      options as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<RecurringInvoiceProfile> {
    const response = await this.http.get<SingleResponse<RecurringInvoiceProfile>>(
      `/recurring-invoices/${id}`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  async create(
    input: CreateRecurringInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<RecurringInvoiceProfile> {
    const response = await this.http.post<SingleResponse<RecurringInvoiceProfile>>(
      '/recurring-invoices',
      input,
      requestOptions
    );
    return response.data;
  }

  async update(
    id: string,
    input: UpdateRecurringInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<RecurringInvoiceProfile> {
    const response = await this.http.put<SingleResponse<RecurringInvoiceProfile>>(
      `/recurring-invoices/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  /**
   * Delete a recurring invoice profile.
   *
   * Already-emitted invoices are immutable and are never removed (ISCA);
   * deleting a profile only stops future runs.
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/recurring-invoices/${id}`,
      requestOptions
    );
  }

  /**
   * List the occurrences (scheduled / emitted runs) of a profile.
   */
  async occurrences(
    id: string,
    options?: RecurringInvoiceOccurrenceListOptions,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<RecurringInvoiceOccurrence>> {
    return this.http.get<PaginatedResponse<RecurringInvoiceOccurrence>>(
      `/recurring-invoices/${id}/occurrences`,
      options as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  /**
   * Pause a profile — stops future emissions until {@link activate}d.
   */
  async pause(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<RecurringInvoiceProfile> {
    const response = await this.http.post<SingleResponse<RecurringInvoiceProfile>>(
      `/recurring-invoices/${id}/pause`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  /**
   * Resume a paused profile — re-enables the schedule and recomputes
   * `next_run_at`.
   */
  async activate(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<RecurringInvoiceProfile> {
    const response = await this.http.post<SingleResponse<RecurringInvoiceProfile>>(
      `/recurring-invoices/${id}/activate`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  /**
   * Cancel a profile permanently. Distinct from {@link pause}: a cancelled
   * profile cannot be re-activated.
   */
  async cancel(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<RecurringInvoiceProfile> {
    const response = await this.http.post<SingleResponse<RecurringInvoiceProfile>>(
      `/recurring-invoices/${id}/cancel`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  /**
   * Trigger an out-of-band emission immediately, without waiting for the next
   * scheduled run. The server enqueues the emission and returns 202 Accepted;
   * the resulting occurrence shows up via {@link occurrences} once processed.
   */
  async runNow(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/recurring-invoices/${id}/run-now`,
      undefined,
      requestOptions
    );
  }
}

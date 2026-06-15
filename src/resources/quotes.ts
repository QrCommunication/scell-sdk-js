/**
 * Quotes Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  MessageWithDataResponse,
  PaginatedResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  ConvertToBalanceInput,
  ConvertToDepositInput,
  CreateQuoteInput,
  Quote,
  QuoteAuditEntry,
  QuoteListParams,
  QuoteListResponse,
  SendQuoteInput,
  UpdateQuoteInput,
} from '../types/quotes.js';
import { PaymentScheduleResource } from './payment-schedule.js';

// Re-export for convenience
export type { QuoteListParams, QuoteListResponse };

/**
 * Response returned when a quote is sent (includes public link)
 */
export interface SendQuoteResponse {
  message: string;
  data: Quote;
  public_link: string;
}

/**
 * Response returned when a public link is regenerated
 */
export interface RegeneratePublicLinkResponse {
  message: string;
  public_link: string;
  expires_at: string;
}

/**
 * Response returned when a PDF is pre-rendered for a quote
 */
export interface QuotePdfResponse {
  /** Temporary download URL (5 minutes) */
  url: string;
  expires_at: string;
}

/**
 * Audit log response with integrity validation
 */
export interface QuoteAuditLogResponse {
  data: QuoteAuditEntry[];
  integrity_valid: boolean;
}

/**
 * Quotes API resource
 *
 * @example
 * ```typescript
 * // Create a quote
 * const { data: quote } = await client.quotes.create({
 *   issue_date: '2026-05-15',
 *   valid_until: '2026-06-15',
 *   buyer_name: 'Acme Corp',
 *   buyer_country: 'FR',
 *   buyer_address: { line1: '1 Rue Test', postal_code: '75001', city: 'Paris', country: 'FR' },
 *   total_ht: 1000,
 *   total_tax: 200,
 *   total_ttc: 1200,
 *   lines: [{
 *     description: 'Consulting services',
 *     quantity: 10,
 *     unit_price: 100,
 *     total_ht: 1000,
 *     total_tax: 200,
 *     total_ttc: 1200,
 *   }],
 * });
 *
 * // Send to buyer
 * const { public_link } = await client.quotes.send(quote.id, { send_email: true });
 *
 * // Convert to deposit invoice (30%)
 * const { data: depositInvoice } = await client.quotes.convertToDeposit(quote.id, {
 *   deposit_percent: 30,
 *   due_date: '2026-06-01',
 * });
 * ```
 */
export class QuotesResource {
  /**
   * Payment schedule sub-resource.
   *
   * Allows defining, updating, and tracking payment milestones on a quote.
   *
   * @example
   * ```typescript
   * // Define 3-step schedule: deposit + milestone + balance
   * await client.quotes.paymentSchedule.set('quote-uuid', [
   *   { amount_type: 'percent', amount_value: 30, due_date: '2026-06-01', milestone_label: 'Acompte' },
   *   { amount_type: 'percent', amount_value: 40, due_date: '2026-07-01', milestone_label: 'Mi-parcours' },
   *   { amount_type: 'percent', amount_value: 30, due_date: '2026-08-01', milestone_label: 'Solde' },
   * ]);
   *
   * // Convert first line to a deposit invoice
   * const { data: invoice } = await client.quotes.paymentSchedule.convertLine(
   *   'quote-uuid',
   *   'line-uuid',
   *   { due_date: '2026-06-01' }
   * );
   * ```
   */
  readonly paymentSchedule: PaymentScheduleResource;

  constructor(private readonly http: HttpClient) {
    this.paymentSchedule = new PaymentScheduleResource(http);
  }

  /**
   * List quotes with optional filtering and pagination
   *
   * @param params - Filter and pagination options
   * @param requestOptions - Per-request options
   * @returns Paginated list of quotes
   *
   * @example
   * ```typescript
   * const { data, meta } = await client.quotes.list({ status: 'sent', per_page: 25 });
   * console.log(`${meta.total} quotes found`);
   * ```
   */
  async list(
    params: QuoteListParams = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Quote>> {
    return this.http.get<PaginatedResponse<Quote>>(
      '/quotes',
      params as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Get a specific quote by ID (includes lines and audit log)
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Quote detail
   *
   * @example
   * ```typescript
   * const { data: quote } = await client.quotes.get('quote-uuid');
   * console.log(quote.status, quote.lines?.length);
   * ```
   */
  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Quote>> {
    return this.http.get<SingleResponse<Quote>>(
      `/quotes/${id}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create a new quote (draft)
   *
   * @param input - Quote creation data
   * @param requestOptions - Per-request options
   * @returns Created quote
   *
   * @example
   * ```typescript
   * const { data: quote } = await client.quotes.create({
   *   issue_date: '2026-05-15',
   *   valid_until: '2026-06-15',
   *   buyer_name: 'Acme Corp',
   *   buyer_country: 'FR',
   *   buyer_address: { line1: '1 Rue Test', postal_code: '75001', city: 'Paris', country: 'FR' },
   *   total_ht: 1000,
   *   total_tax: 200,
   *   total_ttc: 1200,
   *   lines: [{ description: 'Dev', quantity: 10, unit_price: 100, total_ht: 1000, total_tax: 200, total_ttc: 1200 }],
   * });
   * ```
   */
  async create(
    input: CreateQuoteInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Quote>> {
    return this.http.post<MessageWithDataResponse<Quote>>(
      '/quotes',
      input,
      requestOptions
    );
  }

  /**
   * Update a draft quote
   *
   * Only quotes in `draft` status can be updated. Use partial fields — only
   * provided fields are updated (PATCH semantics).
   *
   * @param id - Quote UUID
   * @param input - Partial update data
   * @param requestOptions - Per-request options
   * @returns Updated quote
   *
   * @example
   * ```typescript
   * const { data: updated } = await client.quotes.update('quote-uuid', {
   *   valid_until: '2026-07-01',
   *   notes: 'Updated terms',
   * });
   * ```
   */
  async update(
    id: string,
    input: UpdateQuoteInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Quote>> {
    return this.http.patch<SingleResponse<Quote>>(
      `/quotes/${id}`,
      input,
      requestOptions
    );
  }

  /**
   * Delete a draft quote (soft delete)
   *
   * Only quotes in `draft` status can be deleted. Sent or accepted quotes
   * must be cancelled first.
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Success message
   *
   * @example
   * ```typescript
   * await client.quotes.delete('quote-uuid');
   * ```
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/quotes/${id}`,
      requestOptions
    );
  }

  /**
   * Send a quote to the buyer
   *
   * Transitions the quote from `draft` to `sent`. Generates a public link for
   * the buyer to view, sign and accept the quote. Optionally sends an email.
   *
   * @param id - Quote UUID
   * @param input - Send options (email, expiry)
   * @param requestOptions - Per-request options
   * @returns Updated quote + public link
   *
   * @example
   * ```typescript
   * const { data: quote, public_link } = await client.quotes.send('quote-uuid', {
   *   send_email: true,
   *   email_message: 'Please review and sign our proposal.',
   * });
   * console.log('Public link:', public_link);
   * ```
   */
  async send(
    id: string,
    input: SendQuoteInput = {},
    requestOptions?: RequestOptions
  ): Promise<SendQuoteResponse> {
    return this.http.post<SendQuoteResponse>(
      `/quotes/${id}/send`,
      input,
      requestOptions
    );
  }

  /**
   * Cancel a quote
   *
   * Transitions the quote to `cancelled`. Cannot be undone.
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Success message
   *
   * @example
   * ```typescript
   * await client.quotes.cancel('quote-uuid');
   * ```
   */
  async cancel(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/quotes/${id}/cancel`,
      undefined,
      requestOptions
    );
  }

  /**
   * Duplicate an existing quote (creates a new draft)
   *
   * All lines and conditions are copied. Buyer snapshot, signature data and
   * audit log are NOT copied. The new quote is always in `draft` status.
   *
   * @param id - Source quote UUID
   * @param requestOptions - Per-request options
   * @returns New draft quote
   *
   * @example
   * ```typescript
   * const { data: copy } = await client.quotes.duplicate('original-uuid');
   * console.log('New draft:', copy.quote_number);
   * ```
   */
  async duplicate(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Quote>> {
    return this.http.post<MessageWithDataResponse<Quote>>(
      `/quotes/${id}/duplicate`,
      undefined,
      requestOptions
    );
  }

  /**
   * Convert a quote into a deposit invoice
   *
   * The quote must be in `accepted` status (or `sent` if
   * `auto_convert_on_accept` is false and you trigger manually).
   * Creates an invoice with `invoice_type = 'deposit'` and sets
   * `parent_quote_id` to this quote's ID.
   *
   * @param id - Quote UUID
   * @param input - Deposit amount / percentage and invoice options
   * @param requestOptions - Per-request options
   * @returns Created deposit invoice
   *
   * @example
   * ```typescript
   * // 30% deposit
   * const { data: deposit } = await client.quotes.convertToDeposit('quote-uuid', {
   *   deposit_percent: 30,
   *   due_date: '2026-06-01',
   *   output_format: 'facturx',
   * });
   * console.log('Deposit invoice:', deposit.invoice_number);
   * ```
   */
  async convertToDeposit(
    id: string,
    input: ConvertToDepositInput = {},
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<import('../types/invoices.js').Invoice>> {
    return this.http.post<MessageWithDataResponse<import('../types/invoices.js').Invoice>>(
      `/quotes/${id}/convert-to-deposit`,
      input,
      requestOptions
    );
  }

  /**
   * Convert a quote into a balance (solde) invoice
   *
   * Requires that a deposit invoice was already created for this quote.
   * Creates an invoice with `invoice_type = 'balance'`, referencing the
   * deposit invoice via `parent_invoice_ids`.
   *
   * @param id - Quote UUID
   * @param input - Due date and format options
   * @param requestOptions - Per-request options
   * @returns Created balance invoice
   *
   * @example
   * ```typescript
   * const { data: balance } = await client.quotes.convertToBalance('quote-uuid', {
   *   due_date: '2026-07-01',
   *   output_format: 'facturx',
   * });
   * console.log('Balance invoice:', balance.invoice_number);
   * ```
   */
  async convertToBalance(
    id: string,
    input: ConvertToBalanceInput = {},
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<import('../types/invoices.js').Invoice>> {
    return this.http.post<MessageWithDataResponse<import('../types/invoices.js').Invoice>>(
      `/quotes/${id}/convert-to-balance`,
      input,
      requestOptions
    );
  }

  /**
   * Get the tamper-evident audit log for a quote
   *
   * Returns all audit entries with integrity validation. The `integrity_valid`
   * flag indicates whether the chain hash is unbroken.
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Audit entries + integrity flag
   *
   * @example
   * ```typescript
   * const { data: entries, integrity_valid } = await client.quotes.auditLog('quote-uuid');
   * if (!integrity_valid) console.warn('Chain integrity violated!');
   * ```
   */
  async auditLog(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<QuoteAuditLogResponse> {
    return this.http.get<QuoteAuditLogResponse>(
      `/quotes/${id}/audit-log`,
      undefined,
      requestOptions
    );
  }

  /**
   * Regenerate the public link for a sent quote
   *
   * Generates a new token + URL. The old token is immediately invalidated.
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns New public link + expiry
   *
   * @example
   * ```typescript
   * const { public_link, expires_at } = await client.quotes.regeneratePublicLink('quote-uuid');
   * ```
   */
  async regeneratePublicLink(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<RegeneratePublicLinkResponse> {
    return this.http.post<RegeneratePublicLinkResponse>(
      `/quotes/${id}/regenerate-public-link`,
      undefined,
      requestOptions
    );
  }

  /**
   * Revoke the public link for a sent quote
   *
   * The buyer can no longer access the quote via the public link. A new link
   * can be generated via `regeneratePublicLink()`.
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Success message
   *
   * @example
   * ```typescript
   * await client.quotes.revokePublicLink('quote-uuid');
   * ```
   */
  async revokePublicLink(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/quotes/${id}/revoke-public-link`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get a temporary PDF download URL for a quote
   *
   * @param id - Quote UUID
   * @param requestOptions - Per-request options
   * @returns Temporary presigned download URL (5 minutes)
   *
   * @example
   * ```typescript
   * const { url } = await client.quotes.pdf('quote-uuid');
   * // Open or download the PDF
   * ```
   */
  async pdf(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<QuotePdfResponse> {
    return this.http.get<QuotePdfResponse>(
      `/quotes/${id}/pdf`,
      undefined,
      requestOptions
    );
  }

  /**
   * Render a non-persisted PDF preview from raw quote data
   *
   * `POST /quotes/preview` — generates a PDF preview from the supplied quote
   * payload (same shape as {@link create}) WITHOUT saving anything. Useful for
   * verifying the layout before actually creating/sending the quote.
   *
   * The endpoint returns the raw `application/pdf` body; the string is the
   * binary content. Wrap it in a `Blob`/`Buffer` to download or display.
   *
   * @param data - Quote data (same shape as `create()`)
   * @param requestOptions - Per-request options
   * @returns The raw PDF content as a (binary-as-text) string
   *
   * @example
   * ```typescript
   * const pdf = await client.quotes.preview({
   *   issue_date: '2026-06-15',
   *   valid_until: '2026-07-15',
   *   buyer_name: 'Acme Corp',
   *   buyer_country: 'FR',
   *   buyer_address: { line1: '1 Rue Test', postal_code: '75001', city: 'Paris', country: 'FR' },
   *   total_ht: 1000, total_tax: 200, total_ttc: 1200,
   *   lines: [{ description: 'Dev', quantity: 10, unit_price: 100, total_ht: 1000, total_tax: 200, total_ttc: 1200 }],
   * });
   * // Browser: const blob = new Blob([Uint8Array.from(pdf, c => c.charCodeAt(0))], { type: 'application/pdf' });
   * ```
   */
  async preview(
    data: CreateQuoteInput,
    requestOptions?: RequestOptions
  ): Promise<string> {
    return this.http.postText(
      '/quotes/preview',
      data,
      {
        ...requestOptions,
        headers: { Accept: 'application/pdf', ...requestOptions?.headers },
      }
    );
  }
}

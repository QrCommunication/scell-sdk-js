/**
 * Invoices Resource
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
  AcceptInvoiceInput,
  AuditTrailResponse,
  ConvertInvoiceInput,
  CreateInvoiceInput,
  DepositGroupDetail,
  DepositGroupListOptions,
  DepositGroupSummary,
  DisputeInvoiceInput,
  IncomingInvoiceParams,
  Invoice,
  InvoiceDownloadResponse,
  InvoiceDownloadType,
  InvoiceFileFormat,
  InvoiceListOptions,
  MarkPaidInput,
  RejectInvoiceInput,
  SendInvoiceByEmailInput,
  SendInvoiceByEmailResponse,
  UpdateInvoiceInput,
} from '../types/invoices.js';

/**
 * Invoices API resource
 *
 * @example
 * ```typescript
 * // List invoices
 * const invoices = await client.invoices.list({
 *   direction: 'outgoing',
 *   status: 'validated'
 * });
 *
 * // Create an invoice
 * const invoice = await client.invoices.create({
 *   direction: 'outgoing',
 *   output_format: 'facturx',
 *   // ...
 * });
 *
 * // Download invoice
 * const download = await client.invoices.download(invoice.id, 'pdf');
 * console.log('Download URL:', download.url);
 * ```
 */
export class InvoicesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List invoices with optional filtering
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of invoices
   *
   * @example
   * ```typescript
   * // List all outgoing invoices
   * const { data, meta } = await client.invoices.list({
   *   direction: 'outgoing',
   *   per_page: 50
   * });
   * console.log(`Found ${meta.total} invoices`);
   * ```
   */
  async list(
    options: InvoiceListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Invoice>> {
    return this.http.get<PaginatedResponse<Invoice>>(
      '/invoices',
      options as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Get a specific invoice by ID
   *
   * @param id - Invoice UUID
   * @param requestOptions - Request options
   * @returns Invoice details
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.invoices.get('uuid-here');
   * console.log('Invoice number:', invoice.invoice_number);
   * ```
   */
  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.get<SingleResponse<Invoice>>(
      `/invoices/${id}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create a new invoice
   *
   * Note: This endpoint requires API key authentication.
   * Creating an invoice in production mode will debit your balance.
   *
   * @param input - Invoice creation data
   * @param requestOptions - Request options
   * @returns Created invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.invoices.create({
   *   direction: 'outgoing',
   *   output_format: 'facturx',
   *   issue_date: '2024-01-15',
   *   total_ht: 100.00,
   *   total_tax: 20.00,
   *   total_ttc: 120.00,
   *   seller_siret: '12345678901234',
   *   seller_name: 'My Company',
   *   seller_address: {
   *     line1: '1 Rue Example',
   *     postal_code: '75001',
   *     city: 'Paris',
   *     country: 'FR'
   *   },
   *   buyer_siret: '98765432109876',
   *   buyer_name: 'Client Company',
   *   buyer_address: {
   *     line1: '2 Avenue Test',
   *     postal_code: '75002',
   *     city: 'Paris',
   *     country: 'FR'
   *   },
   *   lines: [{
   *     description: 'Service prestation',
   *     quantity: 1,
   *     unit_price: 100.00,
   *     tax_rate: 20.00,
   *     total_ht: 100.00,
   *     total_tax: 20.00,
   *     total_ttc: 120.00
   *   }]
   * });
   * ```
   */
  async create(
    input: CreateInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Invoice>> {
    return this.http.post<MessageWithDataResponse<Invoice>>(
      '/invoices',
      input,
      requestOptions
    );
  }

  /**
   * Update a draft invoice
   *
   * Only invoices in `draft` status can be updated. Once submitted or
   * validated, the invoice is immutable (ISCA compliance).
   *
   * @param id - Invoice UUID
   * @param input - Partial invoice data to update
   * @param requestOptions - Request options
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.invoices.update('invoice-uuid', {
   *   due_date: '2026-08-15',
   *   lines: [
   *     { description: 'Updated service', quantity: 2, unit_price: 200, tax_rate: 20 },
   *   ],
   * });
   * ```
   */
  async update(
    id: string,
    input: UpdateInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.put<SingleResponse<Invoice>>(
      `/invoices/${id}`,
      input,
      requestOptions
    );
  }

  /**
   * Delete a draft invoice
   *
   * Only invoices in `draft` status can be deleted. Once submitted,
   * validated, or transmitted, the invoice cannot be removed (ISCA
   * fiscal compliance — the hash chain is immutable).
   *
   * @param id - Invoice UUID
   * @param requestOptions - Request options
   *
   * @example
   * ```typescript
   * await client.invoices.delete('invoice-uuid');
   * // Invoice is permanently removed
   * ```
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/invoices/${id}`,
      requestOptions
    );
  }

  /**
   * Download invoice file
   *
   * @param id - Invoice UUID
   * @param type - File type to download
   * @param requestOptions - Request options
   * @returns Temporary download URL
   *
   * @example
   * ```typescript
   * // Download PDF version
   * const { url, expires_at } = await client.invoices.download(
   *   'invoice-uuid',
   *   'pdf'
   * );
   * console.log('Download before:', expires_at);
   * ```
   */
  async download(
    id: string,
    type: InvoiceDownloadType,
    requestOptions?: RequestOptions
  ): Promise<InvoiceDownloadResponse> {
    return this.http.get<InvoiceDownloadResponse>(
      `/invoices/${id}/download/${type}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get invoice audit trail (Piste d'Audit Fiable)
   *
   * @param id - Invoice UUID
   * @param requestOptions - Request options
   * @returns Audit trail entries with integrity validation
   *
   * @example
   * ```typescript
   * const { data: entries, integrity_valid } = await client.invoices.auditTrail(
   *   'invoice-uuid'
   * );
   *
   * if (integrity_valid) {
   *   console.log('Audit trail is valid');
   *   entries.forEach(e => console.log(e.action, e.created_at));
   * }
   * ```
   */
  async auditTrail(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<AuditTrailResponse> {
    return this.http.get<AuditTrailResponse>(
      `/invoices/${id}/audit-trail`,
      undefined,
      requestOptions
    );
  }

  /**
   * Convert invoice to another format
   *
   * @param input - Conversion parameters
   * @param requestOptions - Request options
   * @returns Conversion status
   *
   * @example
   * ```typescript
   * await client.invoices.convert({
   *   invoice_id: 'invoice-uuid',
   *   target_format: 'ubl'
   * });
   * ```
   */
  async convert(
    input: ConvertInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<{ message: string; invoice_id: string; target_format: string }> {
    return this.http.post<{
      message: string;
      invoice_id: string;
      target_format: string;
    }>('/invoices/convert', input, requestOptions);
  }

  /**
   * List incoming invoices (from suppliers)
   *
   * Returns invoices where your company is the buyer.
   *
   * @param params - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of incoming invoices
   *
   * @example
   * ```typescript
   * // List all incoming invoices
   * const { data, meta } = await client.invoices.incoming({
   *   status: 'pending',
   *   per_page: 50
   * });
   * console.log(`Found ${meta.total} incoming invoices`);
   *
   * // Filter by seller
   * const fromSupplier = await client.invoices.incoming({
   *   seller_siret: '12345678901234'
   * });
   * ```
   */
  async incoming(
    params: IncomingInvoiceParams = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Invoice>> {
    return this.http.get<PaginatedResponse<Invoice>>(
      '/invoices/incoming',
      params as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Accept an incoming invoice
   *
   * Mark an incoming invoice as accepted, optionally specifying a payment date.
   *
   * @param id - Invoice UUID
   * @param data - Optional acceptance data
   * @param requestOptions - Request options
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * // Accept with payment date
   * const { data: invoice } = await client.invoices.accept('invoice-uuid', {
   *   payment_date: '2024-02-15',
   *   note: 'Approved by accounting'
   * });
   *
   * // Simple acceptance
   * await client.invoices.accept('invoice-uuid');
   * ```
   */
  async accept(
    id: string,
    data?: AcceptInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.post<SingleResponse<Invoice>>(
      `/invoices/${id}/accept`,
      data,
      requestOptions
    );
  }

  /**
   * Reject an incoming invoice
   *
   * Mark an incoming invoice as rejected with a reason.
   *
   * @param id - Invoice UUID
   * @param data - Rejection details
   * @param requestOptions - Request options
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.invoices.reject('invoice-uuid', {
   *   reason: 'Invoice amount does not match purchase order',
   *   reason_code: 'incorrect_amount'
   * });
   * ```
   */
  async reject(
    id: string,
    data: RejectInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.post<SingleResponse<Invoice>>(
      `/invoices/${id}/reject`,
      data,
      requestOptions
    );
  }

  /**
   * Dispute an incoming invoice
   *
   * Open a dispute on an incoming invoice for resolution.
   *
   * @param id - Invoice UUID
   * @param data - Dispute details
   * @param requestOptions - Request options
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.invoices.dispute('invoice-uuid', {
   *   reason: 'Billed amount exceeds agreed price',
   *   dispute_type: 'amount_dispute',
   *   expected_amount: 950.00
   * });
   * ```
   */
  async dispute(
    id: string,
    data: DisputeInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.post<SingleResponse<Invoice>>(
      `/invoices/${id}/dispute`,
      data,
      requestOptions
    );
  }

  /**
   * Mark an invoice as paid.
   *
   * This is a mandatory step in the French e-invoicing lifecycle. Once
   * marked as paid, the invoice status changes to `'paid'`, payment
   * details are recorded, and the Factur-X document is enriched with
   * the BT-81 / BT-82 payment means metadata.
   *
   * **Breaking change in v2.25.0** : `payment_means_code` is now
   * required (matches the server `MarkPaidRequest::rules()` since
   * API 2026-05-28). Omitting it triggers HTTP 422
   * `payment_means_code.required`. Pre-fill the dropdown with a sane
   * default — `'58'` (SEPA credit transfer) for B2B France, `'30'`
   * (credit transfer) for international.
   *
   * @param invoiceId - Invoice UUID
   * @param opts - Payment details (payment_means_code is required)
   * @param requestOptions - Per-request options
   * @returns Updated invoice with payment information
   *
   * @example
   * ```typescript
   * // SEPA credit transfer (most common in B2B France)
   * const { data: invoice } = await client.invoices.markPaid('invoice-uuid', {
   *   payment_means_code: '58',
   *   payment_means_text: 'BNP Paribas',
   *   payment_reference: 'VIR-2026-0124',
   *   paid_at: '2026-01-24T10:30:00Z',
   *   note: 'Payment received via bank transfer',
   * });
   *
   * // Bank card payment via Stripe
   * await client.invoices.markPaid('invoice-uuid', {
   *   payment_means_code: '48',
   *   payment_means_text: 'Stripe',
   *   payment_reference: 'pi_3OqGZ2K...',
   * });
   *
   * // Cheque
   * await client.invoices.markPaid('invoice-uuid', {
   *   payment_means_code: '20',
   *   payment_reference: 'CHQ-001234',
   * });
   * ```
   *
   * @since 2.25.0 — `opts.payment_means_code` is now required.
   */
  async markPaid(
    invoiceId: string,
    opts: MarkPaidInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.post<SingleResponse<Invoice>>(
      `/invoices/${invoiceId}/mark-paid`,
      opts,
      requestOptions
    );
  }

  /**
   * Submit an invoice for processing
   *
   * @param id - Invoice UUID
   * @param requestOptions - Request options
   * @returns Success message
   *
   * @example
   * ```typescript
   * await client.invoices.submit('invoice-uuid');
   * ```
   */
  async submit(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/invoices/${id}/submit`,
      undefined,
      requestOptions
    );
  }

  /**
   * Download invoice source file as binary content
   *
   * Downloads the original invoice file (PDF with embedded XML for Factur-X,
   * or standalone XML for UBL/CII formats).
   *
   * @param id - Invoice UUID
   * @param format - File format to download: 'pdf' (default) or 'xml'
   * @param requestOptions - Request options
   * @returns ArrayBuffer containing the file content
   *
   * @example
   * ```typescript
   * // Download invoice as PDF (Factur-X)
   * const pdfBuffer = await client.invoices.downloadFile('invoice-uuid');
   *
   * // In Node.js, save to file:
   * import { writeFileSync } from 'fs';
   * writeFileSync('invoice.pdf', Buffer.from(pdfBuffer));
   *
   * // Download XML version (UBL/CII)
   * const xmlBuffer = await client.invoices.downloadFile('invoice-uuid', 'xml');
   * writeFileSync('invoice.xml', Buffer.from(xmlBuffer));
   *
   * // In browser, trigger download:
   * const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
   * const url = URL.createObjectURL(blob);
   * const a = document.createElement('a');
   * a.href = url;
   * a.download = 'invoice.pdf';
   * a.click();
   * ```
   */
  async downloadFile(
    id: string,
    format: InvoiceFileFormat = 'pdf',
    requestOptions?: RequestOptions
  ): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `/invoices/${id}/download/${format}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Send an invoice to the buyer by email
   *
   * The destination email is resolved in this order:
   *  1. `options.recipient_email` — explicit override
   *  2. `invoice.buyer_billing_email` — dedicated accounts-payable address
   *  3. `invoice.buyer_email` — general contact email
   *  4. `quote.buyer_email` — fallback if the invoice originates from a quote
   *  5. HTTP 422 `BUYER_HAS_NO_EMAIL` — no resolvable address
   *
   * **Draft invoices:** when the invoice is in `draft` status, it is
   * automatically transitioned to `validated` before sending. Show a
   * confirmation modal to the user to avoid accidental premature validation.
   *
   * After a successful call, `invoice.sent_to_buyer_at` and
   * `invoice.sent_to_buyer_email` are populated. A dashboard notification
   * is also dispatched (visible in the activity feed).
   *
   * @param invoiceId - Invoice UUID
   * @param options - Optional recipient override, CC addresses, and message
   * @param requestOptions - Per-request options
   * @returns Send confirmation with actual recipient and timestamp
   *
   * @example
   * ```typescript
   * // Send with default email resolution
   * const result = await client.invoices.sendByEmail('invoice-uuid');
   * console.log('Sent to:', result.sent_to, 'at', result.sent_at);
   *
   * // Override recipient and add CC
   * const result = await client.invoices.sendByEmail('invoice-uuid', {
   *   recipient_email: 'compta@client.com',
   *   cc: ['manager@client.com'],
   *   message: 'Veuillez trouver ci-joint votre facture.',
   * });
   * ```
   */
  async sendByEmail(
    invoiceId: string,
    options: SendInvoiceByEmailInput = {},
    requestOptions?: RequestOptions
  ): Promise<SendInvoiceByEmailResponse> {
    return this.http.post<SendInvoiceByEmailResponse>(
      `/invoices/${invoiceId}/send-by-email`,
      options,
      requestOptions
    );
  }

  /**
   * List deposit groups (multi-invoice commercial deals)
   *
   * Each group aggregates the deposit / balance invoices sharing the same
   * `deposit_group_id`: total deal amount, sum of deposits already issued,
   * remaining amount to invoice, invoice count, and whether a balance invoice
   * exists.
   *
   * @param filters - Optional filters (`has_no_balance` to keep only open deals)
   * @param requestOptions - Per-request options
   * @returns List of deposit group summaries
   *
   * @since 3.5.0
   *
   * @example
   * ```typescript
   * // All deals still open (no balance invoice yet)
   * const groups = await client.invoices.depositGroups({ has_no_balance: true });
   * for (const g of groups) {
   *   console.log(g.deposit_group_id, 'remaining:', g.remaining_ht);
   * }
   * ```
   */
  async depositGroups(
    filters: DepositGroupListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<DepositGroupSummary[]> {
    const query: Record<string, string> = {};
    if (filters.has_no_balance !== undefined) {
      query.has_no_balance = filters.has_no_balance ? '1' : '0';
    }
    const res = await this.http.get<{ data: DepositGroupSummary[] }>(
      '/invoices/deposit-groups',
      query,
      requestOptions
    );
    return res.data;
  }

  /**
   * Get the progress detail of a deposit group
   *
   * Returns the deal progress: total amount, deposits already issued, remaining
   * amount to invoice, and the list of invoices in the group. Strictly scoped
   * per tenant (anti-IDOR): 404 if the group does not belong to the current
   * tenant.
   *
   * @param groupId - Deposit group UUID
   * @param requestOptions - Per-request options
   * @returns Progress detail of the group
   * @throws {ScellNotFoundError} 404 when the group is unknown or out of scope
   *
   * @since 3.5.0
   *
   * @example
   * ```typescript
   * const detail = await client.invoices.depositGroup('group-uuid');
   * console.log('Invoices in deal:', detail.invoices?.length);
   * ```
   */
  async depositGroup(
    groupId: string,
    requestOptions?: RequestOptions
  ): Promise<DepositGroupDetail> {
    const res = await this.http.get<{ data: DepositGroupDetail }>(
      `/invoices/deposit-groups/${groupId}`,
      undefined,
      requestOptions
    );
    return res.data;
  }
}

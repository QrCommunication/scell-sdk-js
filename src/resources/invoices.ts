/**
 * Invoices Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageWithDataResponse,
  PaginatedResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  AcceptInvoiceInput,
  AuditTrailResponse,
  ConvertInvoiceInput,
  CreateInvoiceInput,
  DisputeInvoiceInput,
  IncomingInvoiceParams,
  Invoice,
  InvoiceDownloadResponse,
  InvoiceDownloadType,
  InvoiceFileFormat,
  InvoiceListOptions,
  MarkPaidInput,
  RejectInvoiceInput,
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
 *   invoice_number: 'FACT-2024-001',
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
   *   invoice_number: 'FACT-2024-001',
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
   * Mark an incoming invoice as paid
   *
   * This is a mandatory step in the French e-invoicing lifecycle for incoming invoices.
   * Once marked as paid, the invoice status changes to 'paid' and payment details are recorded.
   *
   * @param id - Invoice UUID
   * @param data - Optional payment details (reference, date, note)
   * @param requestOptions - Request options
   * @returns Updated invoice with payment information
   *
   * @example
   * ```typescript
   * // Mark as paid with payment details
   * const { data: invoice } = await client.invoices.markPaid('invoice-uuid', {
   *   payment_reference: 'VIR-2026-0124',
   *   paid_at: '2026-01-24T10:30:00Z',
   *   note: 'Payment received via bank transfer'
   * });
   *
   * // Simple mark as paid (uses current date/time)
   * await client.invoices.markPaid('invoice-uuid');
   * ```
   */
  async markPaid(
    id: string,
    data?: MarkPaidInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Invoice>> {
    return this.http.post<SingleResponse<Invoice>>(
      `/invoices/${id}/mark-paid`,
      data,
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
      `/invoices/${id}/download`,
      { format },
      requestOptions
    );
  }
}

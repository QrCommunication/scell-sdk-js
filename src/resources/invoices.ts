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
  AuditTrailResponse,
  ConvertInvoiceInput,
  CreateInvoiceInput,
  Invoice,
  InvoiceDownloadResponse,
  InvoiceDownloadType,
  InvoiceListOptions,
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
}

/**
 * Tenant Direct Invoices Resource
 *
 * Manage direct invoices issued by a tenant to external buyers.
 * Direct invoices are outgoing invoices that are not part of
 * sub-tenant billing but billed directly to third-party clients.
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  PaginatedResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  CreateTenantDirectInvoiceParams,
  TenantInvoice,
  TenantInvoiceFilters,
  UpdateTenantInvoiceParams,
} from '../types/tenant-invoices.js';

/**
 * Tenant Direct Invoices API resource
 *
 * Provides operations for managing direct invoices created by tenants
 * for external buyers (not sub-tenants).
 *
 * @example
 * ```typescript
 * import { ScellTenantClient } from '@scell/sdk';
 *
 * const client = new ScellTenantClient('your-tenant-key');
 *
 * // Create a direct invoice
 * const { data: invoice } = await client.directInvoices.create({
 *   company_id: 'company-uuid',
 *   buyer: {
 *     company_name: 'Client Corp',
 *     siret: '12345678901234',
 *     address: {
 *       line1: '123 Rue Client',
 *       postal_code: '75001',
 *       city: 'Paris',
 *       country: 'FR'
 *     },
 *     email: 'billing@client.com'
 *   },
 *   lines: [{
 *     description: 'Consulting services',
 *     quantity: 10,
 *     unit_price: 150,
 *     tax_rate: 20,
 *     total_ht: 1500,
 *     total_tax: 300,
 *     total_ttc: 1800
 *   }]
 * });
 *
 * // List all direct invoices
 * const { data: invoices, meta } = await client.directInvoices.list({
 *   status: 'validated',
 *   per_page: 50
 * });
 * ```
 */
export class TenantDirectInvoicesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new direct invoice
   *
   * Creates an outgoing invoice from the tenant to an external buyer.
   * The invoice will be generated in the specified format (Factur-X by default).
   *
   * @param params - Invoice creation parameters
   * @param requestOptions - Optional request configuration
   * @returns Created invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.directInvoices.create({
   *   company_id: 'company-uuid',
   *   buyer: {
   *     company_name: 'Acme Corporation',
   *     siret: '98765432109876',
   *     address: {
   *       line1: '456 Avenue Business',
   *       postal_code: '69001',
   *       city: 'Lyon',
   *       country: 'FR'
   *     },
   *     email: 'accounts@acme.com'
   *   },
   *   lines: [{
   *     description: 'Monthly subscription',
   *     quantity: 1,
   *     unit_price: 299,
   *     tax_rate: 20,
   *     total_ht: 299,
   *     total_tax: 59.80,
   *     total_ttc: 358.80
   *   }],
   *   issue_date: '2026-01-26',
   *   due_date: '2026-02-26',
   *   notes: 'Thank you for your business!'
   * });
   *
   * console.log('Invoice created:', invoice.invoice_number);
   * ```
   */
  async create(
    params: CreateTenantDirectInvoiceParams,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.post<SingleResponse<TenantInvoice>>(
      '/tenant/invoices',
      params,
      requestOptions
    );
  }

  /**
   * List all direct invoices
   *
   * Returns a paginated list of direct invoices created by the tenant.
   * Supports filtering by status, date range, buyer, and amount.
   *
   * @param filters - Filter and pagination options
   * @param requestOptions - Optional request configuration
   * @returns Paginated list of invoices
   *
   * @example
   * ```typescript
   * // List all validated invoices
   * const { data: invoices, meta } = await client.directInvoices.list({
   *   status: 'validated',
   *   per_page: 50
   * });
   *
   * console.log(`Found ${meta.total} validated invoices`);
   *
   * // Filter by date range
   * const januaryInvoices = await client.directInvoices.list({
   *   date_from: '2026-01-01',
   *   date_to: '2026-01-31'
   * });
   *
   * // Search by buyer
   * const acmeInvoices = await client.directInvoices.list({
   *   search: 'Acme'
   * });
   * ```
   */
  async list(
    filters: TenantInvoiceFilters = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<TenantInvoice>> {
    // Convert status array to comma-separated string if needed
    const query: Record<string, string | number | boolean | undefined> = {
      ...filters,
      status: Array.isArray(filters.status)
        ? filters.status.join(',')
        : filters.status,
    };

    return this.http.get<PaginatedResponse<TenantInvoice>>(
      '/tenant/invoices',
      query,
      requestOptions
    );
  }

  /**
   * Get a specific direct invoice by ID
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns Invoice details
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.directInvoices.get('invoice-uuid');
   *
   * console.log('Invoice:', invoice.invoice_number);
   * console.log('Status:', invoice.status);
   * console.log('Total:', invoice.total_ttc, invoice.currency);
   * ```
   */
  async get(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.get<SingleResponse<TenantInvoice>>(
      `/tenant/invoices/${invoiceId}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Update a direct invoice
   *
   * Only invoices in 'draft' status can be updated.
   * Once validated or sent, invoices become immutable.
   *
   * @param invoiceId - Invoice UUID
   * @param params - Update parameters
   * @param requestOptions - Optional request configuration
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.directInvoices.update(
   *   'invoice-uuid',
   *   {
   *     due_date: '2026-03-15',
   *     notes: 'Updated payment terms'
   *   }
   * );
   *
   * console.log('Invoice updated:', invoice.due_date);
   * ```
   */
  async update(
    invoiceId: string,
    params: UpdateTenantInvoiceParams,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.patch<SingleResponse<TenantInvoice>>(
      `/tenant/invoices/${invoiceId}`,
      params,
      requestOptions
    );
  }

  /**
   * Delete a direct invoice
   *
   * Only invoices in 'draft' status can be deleted.
   * Validated or sent invoices cannot be deleted for audit trail compliance.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   *
   * @example
   * ```typescript
   * await client.directInvoices.delete('draft-invoice-uuid');
   * console.log('Invoice deleted successfully');
   * ```
   */
  async delete(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/tenant/invoices/${invoiceId}`,
      requestOptions
    );
  }

  /**
   * Validate a direct invoice
   *
   * Validates the invoice, generates the electronic invoice file,
   * and changes status from 'draft' to 'validated'.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns Validated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.directInvoices.validate('invoice-uuid');
   * console.log('Invoice validated:', invoice.status); // 'validated'
   * console.log('Validated at:', invoice.validated_at);
   * ```
   */
  async validate(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.post<SingleResponse<TenantInvoice>>(
      `/tenant/invoices/${invoiceId}/validate`,
      undefined,
      requestOptions
    );
  }

  /**
   * Send a direct invoice to the buyer
   *
   * Sends the validated invoice to the buyer via email.
   * The invoice must be in 'validated' status.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.directInvoices.send('invoice-uuid');
   * console.log('Invoice sent to:', invoice.buyer.email);
   * ```
   */
  async send(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.post<SingleResponse<TenantInvoice>>(
      `/tenant/invoices/${invoiceId}/send`,
      undefined,
      requestOptions
    );
  }

  /**
   * Download invoice as PDF
   *
   * Downloads the electronic invoice file as a PDF (Factur-X).
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns ArrayBuffer containing the PDF file
   *
   * @example
   * ```typescript
   * // Download invoice PDF
   * const pdfBuffer = await client.directInvoices.download('invoice-uuid');
   *
   * // In Node.js, save to file:
   * import { writeFileSync } from 'fs';
   * writeFileSync('invoice.pdf', Buffer.from(pdfBuffer));
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
  async download(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `/tenant/invoices/${invoiceId}/download`,
      undefined,
      requestOptions
    );
  }

  /**
   * Download invoice XML
   *
   * Downloads the electronic invoice XML (UBL/CII format).
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns ArrayBuffer containing the XML file
   *
   * @example
   * ```typescript
   * const xmlBuffer = await client.directInvoices.downloadXml('invoice-uuid');
   * const xmlString = new TextDecoder().decode(xmlBuffer);
   * console.log('XML:', xmlString);
   * ```
   */
  async downloadXml(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `/tenant/invoices/${invoiceId}/download`,
      { format: 'xml' },
      requestOptions
    );
  }

  /**
   * Bulk create multiple invoices
   */
  async bulkCreate(
    invoices: CreateTenantDirectInvoiceParams[],
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      '/tenant/invoices/bulk',
      { invoices },
      requestOptions
    );
  }

  /**
   * Bulk submit multiple invoices
   */
  async bulkSubmit(
    invoiceIds: string[],
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      '/tenant/invoices/bulk-submit',
      { invoice_ids: invoiceIds },
      requestOptions
    );
  }

  /**
   * Get status of multiple invoices
   */
  async bulkStatus(
    invoiceIds: string[],
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Record<string, unknown>[]>> {
    return this.http.post<SingleResponse<Record<string, unknown>[]>>(
      '/tenant/invoices/bulk-status',
      { invoice_ids: invoiceIds },
      requestOptions
    );
  }
}

/**
 * Tenant Incoming Invoices Resource
 *
 * Manage incoming invoices (purchase invoices) for sub-tenants.
 * Incoming invoices are invoices received by a sub-tenant from external suppliers.
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
  CreateIncomingInvoiceParams,
  TenantInvoice,
  TenantInvoiceFilters,
} from '../types/tenant-invoices.js';
import type { RejectionCode } from '../types/invoices.js';

/**
 * Input for accepting an incoming invoice
 */
export interface AcceptIncomingInvoiceInput {
  /** Expected payment date (YYYY-MM-DD) */
  payment_date?: string | undefined;
  /** Optional note about acceptance */
  note?: string | undefined;
}

/**
 * Input for rejecting an incoming invoice
 */
export interface RejectIncomingInvoiceInput {
  /** Reason for rejection */
  reason: string;
  /** Standardized rejection code */
  reason_code?: RejectionCode | undefined;
}

/**
 * Input for marking an invoice as paid
 */
export interface MarkPaidIncomingInvoiceInput {
  /** Payment reference (bank transfer ID, check number, etc.) */
  payment_reference?: string | undefined;
  /** Payment date (ISO 8601) - defaults to current date/time */
  paid_at?: string | undefined;
  /** Optional note about the payment */
  note?: string | undefined;
}

/**
 * Tenant Incoming Invoices API resource
 *
 * Provides operations for managing incoming invoices (purchase invoices)
 * received by sub-tenants from external suppliers.
 *
 * In the French e-invoicing lifecycle, incoming invoices go through these states:
 * - pending: Awaiting review
 * - accepted: Approved for payment
 * - rejected: Disputed/refused
 * - paid: Payment completed
 *
 * @example
 * ```typescript
 * import { ScellTenantClient } from '@scell/sdk';
 *
 * const client = new ScellTenantClient('your-tenant-key');
 *
 * // Create an incoming invoice for a sub-tenant
 * const { data: invoice } = await client.incomingInvoices.create(
 *   'sub-tenant-uuid',
 *   {
 *     invoice_number: 'SUPP-2026-001',
 *     company_id: 'company-uuid',
 *     seller: {
 *       company_name: 'Supplier Corp',
 *       siren: '123456789',
 *       address: {
 *         line1: '789 Rue Fournisseur',
 *         postal_code: '33000',
 *         city: 'Bordeaux',
 *         country: 'FR'
 *       },
 *       email: 'invoices@supplier.com'
 *     },
 *     lines: [{
 *       description: 'Raw materials',
 *       quantity: 100,
 *       unit_price: 10,
 *       tax_rate: 20,
 *       total_ht: 1000,
 *       total_tax: 200,
 *       total_ttc: 1200
 *     }],
 *     issue_date: '2026-01-20',
 *     total_ht: 1000,
 *     total_ttc: 1200
 *   }
 * );
 *
 * // Accept the invoice
 * await client.incomingInvoices.accept(invoice.id, {
 *   payment_date: '2026-02-20',
 *   note: 'Approved by finance department'
 * });
 *
 * // Later, mark as paid
 * await client.incomingInvoices.markPaid(invoice.id, {
 *   payment_reference: 'VIR-2026-0150'
 * });
 * ```
 */
export class TenantIncomingInvoicesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new incoming invoice for a sub-tenant
   *
   * Creates a purchase invoice received by a sub-tenant from an external supplier.
   * The seller's SIREN is validated using the Luhn algorithm.
   *
   * @param subTenantId - Sub-tenant UUID
   * @param params - Invoice creation parameters
   * @param requestOptions - Optional request configuration
   * @returns Created invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.incomingInvoices.create(
   *   'sub-tenant-uuid',
   *   {
   *     invoice_number: 'SUPP-2026-001',
   *     company_id: 'company-uuid',
   *     seller: {
   *       company_name: 'Acme Supplies',
   *       siren: '123456789',
   *       siret: '12345678901234',
   *       vat_number: 'FR12123456789',
   *       address: {
   *         line1: '123 Industrial Park',
   *         postal_code: '31000',
   *         city: 'Toulouse',
   *         country: 'FR'
   *       },
   *       email: 'billing@acme-supplies.com'
   *     },
   *     lines: [
   *       {
   *         description: 'Widget A - Bulk order',
   *         quantity: 500,
   *         unit_price: 2.50,
   *         tax_rate: 20,
   *         total_ht: 1250,
   *         total_tax: 250,
   *         total_ttc: 1500
   *       }
   *     ],
   *     issue_date: '2026-01-15',
   *     due_date: '2026-02-15',
   *     total_ht: 1250,
   *     total_ttc: 1500
   *   }
   * );
   *
   * console.log('Incoming invoice created:', invoice.invoice_number);
   * ```
   */
  async create(
    subTenantId: string,
    params: CreateIncomingInvoiceParams,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.post<SingleResponse<TenantInvoice>>(
      `/tenant/sub-tenants/${subTenantId}/incoming-invoices`,
      params,
      requestOptions
    );
  }

  /**
   * List incoming invoices for a sub-tenant
   *
   * Returns a paginated list of purchase invoices received by the sub-tenant.
   *
   * @param subTenantId - Sub-tenant UUID
   * @param filters - Filter and pagination options
   * @param requestOptions - Optional request configuration
   * @returns Paginated list of invoices
   *
   * @example
   * ```typescript
   * // List all pending invoices
   * const { data: invoices, meta } = await client.incomingInvoices.listForSubTenant(
   *   'sub-tenant-uuid',
   *   { status: 'pending', per_page: 50 }
   * );
   *
   * console.log(`Found ${meta.total} pending invoices to review`);
   *
   * // Filter by supplier
   * const acmeInvoices = await client.incomingInvoices.listForSubTenant(
   *   'sub-tenant-uuid',
   *   { seller_siret: '12345678901234' }
   * );
   * ```
   */
  async listForSubTenant(
    subTenantId: string,
    filters: TenantInvoiceFilters = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<TenantInvoice>> {
    const query: Record<string, string | number | boolean | undefined> = {
      ...filters,
      status: Array.isArray(filters.status)
        ? filters.status.join(',')
        : filters.status,
    };

    return this.http.get<PaginatedResponse<TenantInvoice>>(
      `/tenant/sub-tenants/${subTenantId}/incoming-invoices`,
      query,
      requestOptions
    );
  }

  /**
   * Get a specific incoming invoice by ID
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns Invoice details
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.incomingInvoices.get('invoice-uuid');
   *
   * console.log('Invoice from:', invoice.seller.name);
   * console.log('Status:', invoice.status);
   * console.log('Amount:', invoice.total_ttc, invoice.currency);
   * ```
   */
  async get(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.get<SingleResponse<TenantInvoice>>(
      `/tenant/incoming-invoices/${invoiceId}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Accept an incoming invoice
   *
   * Marks the invoice as accepted, indicating approval for payment.
   * Optionally specify an expected payment date.
   *
   * @param invoiceId - Invoice UUID
   * @param input - Optional acceptance details
   * @param requestOptions - Optional request configuration
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * // Accept with payment date
   * const { data: invoice } = await client.incomingInvoices.accept(
   *   'invoice-uuid',
   *   {
   *     payment_date: '2026-02-15',
   *     note: 'Approved by CFO'
   *   }
   * );
   *
   * console.log('Invoice accepted:', invoice.status); // 'accepted'
   *
   * // Simple acceptance
   * await client.incomingInvoices.accept('invoice-uuid');
   * ```
   */
  async accept(
    invoiceId: string,
    input?: AcceptIncomingInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.post<SingleResponse<TenantInvoice>>(
      `/tenant/incoming-invoices/${invoiceId}/accept`,
      input,
      requestOptions
    );
  }

  /**
   * Reject an incoming invoice
   *
   * Marks the invoice as rejected with a reason and optional code.
   *
   * @param invoiceId - Invoice UUID
   * @param reason - Reason for rejection
   * @param code - Optional standardized rejection code
   * @param requestOptions - Optional request configuration
   * @returns Updated invoice
   *
   * @example
   * ```typescript
   * const { data: invoice } = await client.incomingInvoices.reject(
   *   'invoice-uuid',
   *   'Amount does not match purchase order PO-2026-042',
   *   'incorrect_amount'
   * );
   *
   * console.log('Invoice rejected:', invoice.status); // 'rejected'
   * ```
   */
  async reject(
    invoiceId: string,
    reason: string,
    code?: RejectionCode,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    const input: RejectIncomingInvoiceInput = { reason };
    if (code) {
      input.reason_code = code;
    }

    return this.http.post<SingleResponse<TenantInvoice>>(
      `/tenant/incoming-invoices/${invoiceId}/reject`,
      input,
      requestOptions
    );
  }

  /**
   * Mark an incoming invoice as paid
   *
   * Records payment information for an accepted invoice.
   * This is a mandatory step in the French e-invoicing lifecycle.
   *
   * @param invoiceId - Invoice UUID
   * @param input - Optional payment details
   * @param requestOptions - Optional request configuration
   * @returns Updated invoice with payment information
   *
   * @example
   * ```typescript
   * // Mark as paid with details
   * const { data: invoice } = await client.incomingInvoices.markPaid(
   *   'invoice-uuid',
   *   {
   *     payment_reference: 'VIR-2026-0150',
   *     paid_at: '2026-02-14T14:30:00Z',
   *     note: 'Payment via bank transfer'
   *   }
   * );
   *
   * console.log('Invoice paid:', invoice.status); // 'paid'
   * console.log('Payment ref:', invoice.payment_reference);
   *
   * // Simple mark as paid (current date)
   * await client.incomingInvoices.markPaid('invoice-uuid');
   * ```
   */
  async markPaid(
    invoiceId: string,
    input?: MarkPaidIncomingInvoiceInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantInvoice>> {
    return this.http.post<SingleResponse<TenantInvoice>>(
      `/tenant/incoming-invoices/${invoiceId}/mark-paid`,
      input,
      requestOptions
    );
  }

  /**
   * Delete an incoming invoice
   *
   * Only invoices in 'pending' status can be deleted.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   *
   * @example
   * ```typescript
   * await client.incomingInvoices.delete('pending-invoice-uuid');
   * console.log('Incoming invoice deleted');
   * ```
   */
  async delete(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/tenant/incoming-invoices/${invoiceId}`,
      requestOptions
    );
  }

  /**
   * Download incoming invoice as PDF
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns ArrayBuffer containing the PDF file
   *
   * @example
   * ```typescript
   * const pdfBuffer = await client.incomingInvoices.download('invoice-uuid');
   *
   * // Save to file (Node.js)
   * import { writeFileSync } from 'fs';
   * writeFileSync('supplier-invoice.pdf', Buffer.from(pdfBuffer));
   * ```
   */
  async download(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `/tenant/incoming-invoices/${invoiceId}/download`,
      undefined,
      requestOptions
    );
  }
}

/**
 * Tenant Direct Credit Notes Resource
 *
 * Manage credit notes for direct invoices issued by a tenant.
 * Direct credit notes are linked to direct invoices (not sub-tenant invoices)
 * and allow partial or total refunds.
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
  CreateTenantDirectCreditNoteParams,
  TenantCreditNote,
  TenantCreditNoteFilters,
  UpdateTenantCreditNoteParams,
} from '../types/tenant-invoices.js';

/**
 * Remaining creditable information for a direct invoice
 */
export interface DirectInvoiceRemainingCreditable {
  /** Invoice UUID */
  invoice_id: string;
  /** Original invoice total (TTC) */
  invoice_total: number;
  /** Total already credited */
  credited_total: number;
  /** Remaining amount that can be credited */
  remaining_total: number;
  /** Line-by-line breakdown */
  lines: DirectInvoiceRemainingLine[];
}

/**
 * Remaining creditable information for an invoice line
 */
export interface DirectInvoiceRemainingLine {
  /** Invoice line UUID */
  invoice_line_id: string;
  /** Line description */
  description: string;
  /** Original quantity */
  original_quantity: number;
  /** Quantity already credited */
  credited_quantity: number;
  /** Remaining quantity that can be credited */
  remaining_quantity: number;
  /** Unit price */
  unit_price: number;
}

/**
 * Tenant Direct Credit Notes API resource
 *
 * Provides operations for managing credit notes linked to direct invoices.
 * Use this for refunds or corrections on invoices issued to external buyers.
 *
 * @example
 * ```typescript
 * import { ScellTenantClient } from '@scell/sdk';
 *
 * const client = new ScellTenantClient('your-tenant-key');
 *
 * // Create a partial credit note
 * const { data: creditNote } = await client.directCreditNotes.create({
 *   invoice_id: 'invoice-uuid',
 *   reason: 'Product returned - damaged in transit',
 *   type: 'partial',
 *   items: [
 *     { invoice_line_id: 'line-uuid', quantity: 2 }
 *   ]
 * });
 *
 * // Create a total credit note (full refund)
 * const { data: totalCreditNote } = await client.directCreditNotes.create({
 *   invoice_id: 'invoice-uuid',
 *   reason: 'Order cancelled by customer',
 *   type: 'total'
 * });
 *
 * // List all credit notes
 * const { data: creditNotes } = await client.directCreditNotes.list({
 *   status: 'sent'
 * });
 * ```
 */
export class TenantDirectCreditNotesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new credit note for a direct invoice
   *
   * Creates a credit note (avoir) linked to a direct invoice.
   * - For partial credit notes, specify the items and quantities to credit.
   * - For total credit notes, all items are automatically credited.
   *
   * @param params - Credit note creation parameters
   * @param requestOptions - Optional request configuration
   * @returns Created credit note
   *
   * @example
   * ```typescript
   * // Partial credit note
   * const { data: creditNote } = await client.directCreditNotes.create({
   *   invoice_id: 'invoice-uuid',
   *   reason: 'Returned items',
   *   type: 'partial',
   *   items: [
   *     { invoice_line_id: 'line-1-uuid', quantity: 2 },
   *     { invoice_line_id: 'line-2-uuid', quantity: 1 }
   *   ]
   * });
   *
   * // Total credit note (cancels entire invoice)
   * const { data: totalCreditNote } = await client.directCreditNotes.create({
   *   invoice_id: 'invoice-uuid',
   *   reason: 'Invoice issued in error',
   *   type: 'total'
   * });
   *
   * console.log('Credit note number:', creditNote.credit_note_number);
   * console.log('Amount:', creditNote.total, creditNote.currency);
   * ```
   */
  async create(
    params: CreateTenantDirectCreditNoteParams,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantCreditNote>> {
    return this.http.post<SingleResponse<TenantCreditNote>>(
      '/tenant/credit-notes',
      params,
      requestOptions
    );
  }

  /**
   * List all direct credit notes
   *
   * Returns a paginated list of credit notes for direct invoices.
   *
   * @param filters - Filter and pagination options
   * @param requestOptions - Optional request configuration
   * @returns Paginated list of credit notes
   *
   * @example
   * ```typescript
   * // List all sent credit notes
   * const { data: creditNotes, meta } = await client.directCreditNotes.list({
   *   status: 'sent',
   *   per_page: 50
   * });
   *
   * console.log(`Found ${meta.total} sent credit notes`);
   *
   * // Filter by date range
   * const januaryCreditNotes = await client.directCreditNotes.list({
   *   date_from: '2026-01-01',
   *   date_to: '2026-01-31'
   * });
   * ```
   */
  async list(
    filters: TenantCreditNoteFilters = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<TenantCreditNote>> {
    return this.http.get<PaginatedResponse<TenantCreditNote>>(
      '/tenant/credit-notes',
      filters as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Get a specific credit note by ID
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Optional request configuration
   * @returns Credit note details
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.directCreditNotes.get('credit-note-uuid');
   *
   * console.log('Credit note:', creditNote.credit_note_number);
   * console.log('Status:', creditNote.status);
   * console.log('Reason:', creditNote.reason);
   * console.log('Total:', creditNote.total, creditNote.currency);
   * ```
   */
  async get(
    creditNoteId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantCreditNote>> {
    return this.http.get<SingleResponse<TenantCreditNote>>(
      `/tenant/credit-notes/${creditNoteId}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Update a credit note
   *
   * Only credit notes in 'draft' status can be updated.
   *
   * @param creditNoteId - Credit note UUID
   * @param params - Update parameters
   * @param requestOptions - Optional request configuration
   * @returns Updated credit note
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.directCreditNotes.update(
   *   'credit-note-uuid',
   *   {
   *     reason: 'Updated reason: Customer complaint resolved',
   *     items: [
   *       { invoice_line_id: 'line-uuid', quantity: 3 }
   *     ]
   *   }
   * );
   * ```
   */
  async update(
    creditNoteId: string,
    params: UpdateTenantCreditNoteParams,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantCreditNote>> {
    return this.http.patch<SingleResponse<TenantCreditNote>>(
      `/tenant/credit-notes/${creditNoteId}`,
      params,
      requestOptions
    );
  }

  /**
   * Delete a credit note
   *
   * Only credit notes in 'draft' status can be deleted.
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Optional request configuration
   *
   * @example
   * ```typescript
   * await client.directCreditNotes.delete('draft-credit-note-uuid');
   * console.log('Credit note deleted');
   * ```
   */
  async delete(
    creditNoteId: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/tenant/credit-notes/${creditNoteId}`,
      requestOptions
    );
  }

  /**
   * Send a credit note
   *
   * Validates and sends the credit note, changing status from 'draft' to 'sent'.
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Optional request configuration
   * @returns Sent credit note
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.directCreditNotes.send('credit-note-uuid');
   * console.log('Credit note sent:', creditNote.status); // 'sent'
   * ```
   */
  async send(
    creditNoteId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantCreditNote>> {
    return this.http.post<SingleResponse<TenantCreditNote>>(
      `/tenant/credit-notes/${creditNoteId}/send`,
      undefined,
      requestOptions
    );
  }

  /**
   * Download credit note as PDF
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Optional request configuration
   * @returns ArrayBuffer containing the PDF file
   *
   * @example
   * ```typescript
   * const pdfBuffer = await client.directCreditNotes.download('credit-note-uuid');
   *
   * // In Node.js:
   * import { writeFileSync } from 'fs';
   * writeFileSync('credit-note.pdf', Buffer.from(pdfBuffer));
   *
   * // In browser:
   * const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
   * const url = URL.createObjectURL(blob);
   * window.open(url);
   * ```
   */
  async download(
    creditNoteId: string,
    requestOptions?: RequestOptions
  ): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `/tenant/credit-notes/${creditNoteId}/download`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get remaining creditable amount for a direct invoice
   *
   * Returns information about how much can still be credited,
   * including line-by-line breakdown.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Optional request configuration
   * @returns Remaining creditable information
   *
   * @example
   * ```typescript
   * const remaining = await client.directCreditNotes.remainingCreditable('invoice-uuid');
   *
   * console.log('Invoice total:', remaining.invoice_total);
   * console.log('Already credited:', remaining.credited_total);
   * console.log('Can still credit:', remaining.remaining_total);
   *
   * // Check per-line
   * remaining.lines.forEach(line => {
   *   if (line.remaining_quantity > 0) {
   *     console.log(`${line.description}: ${line.remaining_quantity} units remaining`);
   *   }
   * });
   * ```
   */
  async remainingCreditable(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<DirectInvoiceRemainingCreditable> {
    return this.http.get<DirectInvoiceRemainingCreditable>(
      `/tenant/invoices/${invoiceId}/remaining-creditable`,
      undefined,
      requestOptions
    );
  }
}

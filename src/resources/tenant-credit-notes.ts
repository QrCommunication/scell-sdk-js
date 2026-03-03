/**
 * Tenant Credit Notes Resource
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
  CreateTenantCreditNoteInput,
  RemainingCreditable,
  TenantCreditNote,
  TenantCreditNoteListOptions,
  UpdateTenantCreditNoteInput,
} from '../types/tenant-credit-notes.js';

/**
 * Tenant Credit Notes API resource
 *
 * Manage credit notes for sub-tenant invoices.
 *
 * @example
 * ```typescript
 * // List credit notes for a sub-tenant
 * const { data, meta } = await client.tenantCreditNotes.list('sub-tenant-uuid', {
 *   status: 'sent'
 * });
 *
 * // Create a credit note
 * const creditNote = await client.tenantCreditNotes.create('sub-tenant-uuid', {
 *   invoice_id: 'invoice-uuid',
 *   reason: 'Product returned',
 *   type: 'partial',
 *   items: [{ invoice_line_id: 'line-uuid', quantity: 1 }]
 * });
 * ```
 */
export class TenantCreditNotesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List credit notes for a sub-tenant
   *
   * @param subTenantId - Sub-tenant UUID
   * @param options - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of credit notes
   *
   * @example
   * ```typescript
   * const { data, meta } = await client.tenantCreditNotes.list('sub-tenant-uuid', {
   *   status: 'sent',
   *   date_from: '2024-01-01',
   *   per_page: 50
   * });
   * console.log(`Found ${meta.total} credit notes`);
   * ```
   */
  async list(
    subTenantId: string,
    options: TenantCreditNoteListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<TenantCreditNote>> {
    return this.http.get<PaginatedResponse<TenantCreditNote>>(
      `/tenant/sub-tenants/${subTenantId}/credit-notes`,
      options as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Create a new credit note for a sub-tenant invoice
   *
   * @param subTenantId - Sub-tenant UUID
   * @param input - Credit note creation data
   * @param requestOptions - Request options
   * @returns Created credit note
   *
   * @example
   * ```typescript
   * // Create a partial credit note
   * const { data: creditNote } = await client.tenantCreditNotes.create(
   *   'sub-tenant-uuid',
   *   {
   *     invoice_id: 'invoice-uuid',
   *     reason: 'Product returned - damaged item',
   *     type: 'partial',
   *     items: [
   *       { invoice_line_id: 'line-uuid-1', quantity: 2 }
   *     ]
   *   }
   * );
   *
   * // Create a total credit note
   * const { data: totalCreditNote } = await client.tenantCreditNotes.create(
   *   'sub-tenant-uuid',
   *   {
   *     invoice_id: 'invoice-uuid',
   *     reason: 'Order cancelled',
   *     type: 'total'
   *   }
   * );
   * ```
   */
  async create(
    subTenantId: string,
    input: CreateTenantCreditNoteInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantCreditNote>> {
    return this.http.post<SingleResponse<TenantCreditNote>>(
      `/tenant/sub-tenants/${subTenantId}/credit-notes`,
      input,
      requestOptions
    );
  }

  /**
   * Get a specific credit note by ID
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Request options
   * @returns Credit note details
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.tenantCreditNotes.get('credit-note-uuid');
   * console.log('Credit note number:', creditNote.credit_note_number);
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
   * @param input - Update data
   * @param requestOptions - Request options
   * @returns Updated credit note
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.tenantCreditNotes.update(
   *   'credit-note-uuid',
   *   {
   *     reason: 'Updated reason: Customer complaint resolved',
   *     items: [
   *       { invoice_line_id: 'line-uuid', quantity: 3 }
   *     ]
   *   }
   * );
   * console.log('Credit note updated:', creditNote.reason);
   * ```
   */
  async update(
    creditNoteId: string,
    input: UpdateTenantCreditNoteInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<TenantCreditNote>> {
    return this.http.patch<SingleResponse<TenantCreditNote>>(
      `/tenant/credit-notes/${creditNoteId}`,
      input,
      requestOptions
    );
  }

  /**
   * Send a credit note
   *
   * Changes the status from 'draft' to 'sent'.
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Request options
   * @returns Updated credit note
   *
   * @example
   * ```typescript
   * const { data: sentCreditNote } = await client.tenantCreditNotes.send('credit-note-uuid');
   * console.log('Status:', sentCreditNote.status); // 'sent'
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
   * Delete a credit note (draft only)
   *
   * Only credit notes with status 'draft' can be deleted.
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Request options
   *
   * @example
   * ```typescript
   * await client.tenantCreditNotes.delete('credit-note-uuid');
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
   * Download credit note as PDF
   *
   * @param creditNoteId - Credit note UUID
   * @param requestOptions - Request options
   * @returns ArrayBuffer containing the PDF file
   *
   * @example
   * ```typescript
   * // Download credit note PDF
   * const pdfBuffer = await client.tenantCreditNotes.download('credit-note-uuid');
   *
   * // In Node.js, save to file:
   * import { writeFileSync } from 'fs';
   * writeFileSync('credit-note.pdf', Buffer.from(pdfBuffer));
   *
   * // In browser, trigger download:
   * const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
   * const url = URL.createObjectURL(blob);
   * const a = document.createElement('a');
   * a.href = url;
   * a.download = 'credit-note.pdf';
   * a.click();
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
   * Get remaining creditable amount for an invoice
   *
   * Returns information about how much can still be credited for an invoice,
   * including per-line breakdown.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Request options
   * @returns Remaining creditable information
   *
   * @example
   * ```typescript
   * const remaining = await client.tenantCreditNotes.remainingCreditable('invoice-uuid');
   *
   * console.log('Invoice total:', remaining.invoice_total);
   * console.log('Already credited:', remaining.credited_total);
   * console.log('Remaining to credit:', remaining.remaining_total);
   *
   * // Check remaining quantity per line
   * remaining.lines.forEach(line => {
   *   console.log(`${line.description}: ${line.remaining_quantity} remaining`);
   * });
   * ```
   */
  async remainingCreditable(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<RemainingCreditable> {
    return this.http.get<RemainingCreditable>(
      `/tenant/invoices/${invoiceId}/remaining-creditable`,
      undefined,
      requestOptions
    );
  }
}

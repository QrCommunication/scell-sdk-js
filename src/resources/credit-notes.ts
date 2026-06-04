/**
 * Credit Notes Resource (direct user / dashboard)
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
  CreditNote,
  CreateCreditNoteInput,
  CreditNoteListOptions,
  RemainingCreditable,
} from '../types/credit-notes.js';

/**
 * Credit Notes API resource
 *
 * Manage credit notes for the authenticated dashboard user.
 *
 * @example
 * ```typescript
 * // List credit notes
 * const { data, meta } = await client.creditNotes.list({ per_page: 50 });
 *
 * // Create a credit note
 * const creditNote = await client.creditNotes.create({
 *   invoice_id: 'invoice-uuid',
 *   reason: 'Product returned',
 *   items: [{ description: 'Item', quantity: 1, unit_price: 100, tax_rate: 20, total: 120 }]
 * });
 * ```
 */
export class CreditNotesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List credit notes with optional filtering
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of credit notes
   *
   * @example
   * ```typescript
   * const { data, meta } = await client.creditNotes.list({ per_page: 50 });
   * console.log(`Found ${meta.total} credit notes`);
   * ```
   */
  async list(
    options: CreditNoteListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<CreditNote>> {
    return this.http.get<PaginatedResponse<CreditNote>>(
      '/credit-notes',
      options as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Get a specific credit note by ID
   *
   * @param id - Credit note UUID
   * @param requestOptions - Request options
   * @returns Credit note details
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.creditNotes.get('credit-note-uuid');
   * console.log('Credit note number:', creditNote.number);
   * ```
   */
  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<CreditNote>> {
    return this.http.get<SingleResponse<CreditNote>>(
      `/credit-notes/${id}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create a credit note (avoir).
   *
   * A credit note ALWAYS targets an existing invoice and can never invent
   * amounts. For a **partial** credit note you MUST select lines of the source
   * invoice via `invoice_line_id` — the unit price and the EXACT per-line VAT
   * rate are inherited from each line (so an invoice mixing 20 % / 5.5 % /
   * VAT-exempt 0 % is credited correctly, line by line).
   *
   * Recommended flow: call {@link CreditNotesResource.remainingCreditable}
   * first to know which lines (and quantities) can still be credited, then
   * select among them.
   *
   * @param input - Credit note creation data
   * @param requestOptions - Request options
   * @returns Created credit note (draft — call {@link CreditNotesResource.send} to validate)
   *
   * @example Total credit note (all lines)
   * ```typescript
   * const { data } = await client.creditNotes.create({
   *   invoice_id: 'invoice-uuid',
   *   reason: 'Order fully cancelled',
   *   type: 'total',
   * });
   * ```
   *
   * @example Partial credit note (select invoice lines)
   * ```typescript
   * // 1. Discover the creditable lines of the invoice
   * const { data: creditable } = await client.creditNotes.remainingCreditable('invoice-uuid');
   * // 2. Select the line(s) to credit — amounts + VAT are inherited per line
   * const { data } = await client.creditNotes.create({
   *   invoice_id: 'invoice-uuid',
   *   reason: 'One item returned',
   *   type: 'partial',
   *   items: [
   *     { invoice_line_id: creditable.items[0].invoice_line_id, quantity: 1 },
   *   ],
   * });
   * ```
   */
  async create(
    input: CreateCreditNoteInput,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<CreditNote>> {
    return this.http.post<SingleResponse<CreditNote>>(
      '/credit-notes',
      input,
      requestOptions
    );
  }

  /**
   * Update a draft credit note
   *
   * Only credit notes in `draft` status can be updated.
   *
   * @param id - Credit note UUID
   * @param input - Partial credit note data to update
   * @param requestOptions - Request options
   * @returns Updated credit note
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.creditNotes.update('cn-uuid', {
   *   reason: 'Updated refund reason',
   * });
   * ```
   */
  async update(
    id: string,
    input: Partial<CreateCreditNoteInput>,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<CreditNote>> {
    return this.http.put<SingleResponse<CreditNote>>(
      `/credit-notes/${id}`,
      input,
      requestOptions
    );
  }

  /**
   * Delete a draft credit note
   *
   * Only credit notes in `draft` status can be deleted. Once sent,
   * the credit note is part of the ISCA fiscal chain and cannot be removed.
   *
   * @param id - Credit note UUID
   * @param requestOptions - Request options
   *
   * @example
   * ```typescript
   * await client.creditNotes.delete('cn-uuid');
   * ```
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/credit-notes/${id}`,
      requestOptions
    );
  }

  /**
   * Send a credit note
   *
   * @param id - Credit note UUID
   * @param requestOptions - Request options
   * @returns Success message
   *
   * @example
   * ```typescript
   * await client.creditNotes.send('credit-note-uuid');
   * ```
   */
  async send(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/credit-notes/${id}/send`,
      undefined,
      requestOptions
    );
  }

  /**
   * Download credit note as PDF
   *
   * @param id - Credit note UUID
   * @param requestOptions - Request options
   * @returns ArrayBuffer containing the PDF file
   *
   * @example
   * ```typescript
   * const pdfBuffer = await client.creditNotes.download('credit-note-uuid');
   *
   * // In Node.js, save to file:
   * import { writeFileSync } from 'fs';
   * writeFileSync('credit-note.pdf', Buffer.from(pdfBuffer));
   * ```
   */
  async download(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<ArrayBuffer> {
    return this.http.getRaw(
      `/credit-notes/${id}/download`,
      undefined,
      requestOptions
    );
  }

  /**
   * List the lines of an invoice that can STILL be credited (after previous
   * credit notes), with the remaining quantity and exact VAT rate per line.
   *
   * This is the discovery step before creating a **partial** credit note:
   * pick `invoice_line_id`(s) from `data.items[]` and pass them to
   * {@link CreditNotesResource.create}.
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Request options
   * @returns Per-line remaining creditable amounts + `can_be_credited`
   *
   * @example
   * ```typescript
   * const { data } = await client.creditNotes.remainingCreditable('invoice-uuid');
   * if (!data.can_be_credited) throw new Error('Invoice fully credited');
   * for (const line of data.items) {
   *   console.log(`${line.description}: ${line.remaining_quantity} @ ${line.tax_rate}%`);
   * }
   * ```
   *
   * @since 2.32.0 — typed response ({@link RemainingCreditable}).
   */
  async remainingCreditable(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<RemainingCreditable>> {
    return this.http.get<SingleResponse<RemainingCreditable>>(
      `/invoices/${invoiceId}/remaining-creditable`,
      undefined,
      requestOptions
    );
  }
}

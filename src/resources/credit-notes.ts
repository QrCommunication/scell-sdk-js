/**
 * Credit Notes Resource (direct user / dashboard)
 *
 * Note: Deletion is forbidden by NF525 fiscal compliance.
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
   * Create a new credit note
   *
   * @param input - Credit note creation data
   * @param requestOptions - Request options
   * @returns Created credit note
   *
   * @example
   * ```typescript
   * const { data: creditNote } = await client.creditNotes.create({
   *   invoice_id: 'invoice-uuid',
   *   reason: 'Product returned',
   *   items: [
   *     { description: 'Item A', quantity: 1, unit_price: 100, tax_rate: 20, total: 120 }
   *   ]
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
   * Get remaining creditable amount for an invoice
   *
   * @param invoiceId - Invoice UUID
   * @param requestOptions - Request options
   * @returns Remaining creditable information
   *
   * @example
   * ```typescript
   * const { data } = await client.creditNotes.remainingCreditable('invoice-uuid');
   * console.log('Remaining:', data);
   * ```
   */
  async remainingCreditable(
    invoiceId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Record<string, unknown>>> {
    return this.http.get<SingleResponse<Record<string, unknown>>>(
      `/invoices/${invoiceId}/remaining-creditable`,
      undefined,
      requestOptions
    );
  }
}

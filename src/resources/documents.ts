/**
 * Documents Resource
 *
 * Wraps the document live-preview endpoint:
 *
 *   POST /api/v1/documents/preview
 *
 * @since 3.2.0
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { DocumentPreviewInput } from '../types/documents.js';

/**
 * Documents API resource
 *
 * Renders a NON-PERSISTED HTML preview of a document being drafted
 * (invoice, credit note or quote). The render uses the real pipeline:
 * invoice template + branding + legal mentions of the issuing Company —
 * what you see is what the recipient will get.
 *
 * @example
 * ```typescript
 * const client = new ScellApiClient('sk_live_xxx');
 *
 * const html = await client.documents.preview({
 *   type: 'invoice',
 *   buyer: { name: 'ACME SAS', siret: '12345678900012' },
 *   lines: [{ description: 'Consulting', quantity: 2, unit_price: 800, tax_rate: 20 }],
 *   issue_date: '2026-06-11',
 *   currency: 'EUR',
 * });
 * // e.g. render `html` in an <iframe srcDoc={html} /> for a live preview
 * ```
 */
export class DocumentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Render a live HTML preview of a document being drafted.
   *
   * Nothing is persisted server-side — no number is consumed, no record is
   * created. Only `input.type` is required; every other field is optional
   * and rendered as-is, making the endpoint suitable for live keystroke
   * previews in a creation form.
   *
   * @param input - Snapshot of the document creation form (`type` required)
   * @param requestOptions - Per-request options
   * @returns Rendered document preview as HTML (string)
   * @throws {ScellValidationError} 422 when the payload is invalid (e.g. more than 200 lines)
   *
   * @example
   * ```typescript
   * const html = await client.documents.preview({
   *   type: 'quote',
   *   document_number: 'DEV-2026-0001',
   *   lines: [{ description: 'Audit', quantity: 1, unit_price: 1500, tax_rate: 20 }],
   * });
   * ```
   */
  preview(
    input: DocumentPreviewInput,
    requestOptions?: RequestOptions
  ): Promise<string> {
    return this.http.postText('/documents/preview', input, requestOptions);
  }
}

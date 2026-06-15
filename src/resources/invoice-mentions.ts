/**
 * Invoice Mentions Resource
 *
 * Wraps the legal-mentions assistant endpoints:
 *
 *   POST /api/v1/invoice-mentions/assistant
 *   POST /api/v1/invoice-mentions/preview
 *
 * @since 3.5.0
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  InvoiceMentionsAssistantInput,
  InvoiceMentionsAssistantResult,
  InvoiceMentionsPreviewInput,
  InvoiceMentionsPreviewResult,
} from '../types/invoice-mentions.js';

/**
 * Invoice Mentions API resource (scope: tenant)
 *
 * Two stateless endpoints that persist nothing. The legal logic lives
 * server-side (single resolver) — no client-side duplication nor drift.
 *
 * @example
 * ```typescript
 * const client = new ScellApiClient('sk_live_xxx');
 *
 * // Suggest per-field mentions from a profile
 * const suggestion = await client.invoiceMentions.assistant({
 *   vat_profile: 'vat_liable',
 *   clientele: 'mixed',
 *   payment_due_days: 30,
 *   penalty_mode: 'legal',
 * });
 *
 * // Live-preview the automatic mentions during profile editing
 * const preview = await client.invoiceMentions.preview({
 *   payment_due_days: 30,
 *   name: 'Ma Société',
 *   vat_regime: 'franchise',
 * });
 * console.log(preview.invoice_footer);
 * ```
 */
export class InvoiceMentionsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Suggest per-field invoice mention texts.
   *
   * Each value may be `null` (« leave empty, automatic legal default »). The
   * response also includes translatable warning/info codes for the frontend.
   *
   * @param params - Profile of mentions to suggest
   * @param requestOptions - Per-request options
   * @returns Suggested data (per-field texts + warnings/infos)
   * @throws {ScellValidationError} 422 on validation error or when the tenant
   *         has no issuing company (`NO_ISSUER_COMPANY`)
   */
  async assistant(
    params: InvoiceMentionsAssistantInput,
    requestOptions?: RequestOptions
  ): Promise<InvoiceMentionsAssistantResult> {
    const res = await this.http.post<{ data: InvoiceMentionsAssistantResult }>(
      '/invoice-mentions/assistant',
      params,
      requestOptions
    );
    return res.data;
  }

  /**
   * Live-preview the automatic mentions while editing the profile.
   *
   * The provided fields override (without persisting) the tenant's default
   * issuing Company. The composition stays the one of the server resolver
   * (footer, B2B/B2C payment terms, VAT franchise mention).
   *
   * @param params - Non-persisted overrides of the issuing Company
   * @param requestOptions - Per-request options
   * @returns Mentions composed by the server resolver
   * @throws {ScellValidationError} 422 when the tenant has no issuing company
   *         (`NO_ISSUER_COMPANY`)
   */
  async preview(
    params: InvoiceMentionsPreviewInput,
    requestOptions?: RequestOptions
  ): Promise<InvoiceMentionsPreviewResult> {
    const res = await this.http.post<{ data: InvoiceMentionsPreviewResult }>(
      '/invoice-mentions/preview',
      params,
      requestOptions
    );
    return res.data;
  }
}

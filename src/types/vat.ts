/**
 * VAT (TVA) resolution types.
 *
 * These types model the response of the `POST /tenant/buyers/vat-context`
 * endpoint, which resolves the applicable VAT rate and regime for a buyer +
 * invoice line combination according to French CGI rules (EN16931 / B2B EU).
 *
 * @packageDocumentation
 */

/**
 * VAT category codes aligned with Factur-X / EN16931 duty/tax/fee category
 * identifiers (BT-151).
 *
 * | Category         | Rate (default) | Regime                                      |
 * |------------------|---------------|---------------------------------------------|
 * | STANDARD         | 20 %          | Normal French TVA                           |
 * | INTERMEDIATE     | 10 %          | Restauration, rénovation logement…          |
 * | REDUCED          | 5.5 %         | Alimentation, livres, transport…            |
 * | SUPER_REDUCED    | 2.1 %         | Médicaments remboursables, presse…          |
 * | ZERO_RATED       | 0 %           | Exportations hors-UE (EN16931 code Z)        |
 * | EXEMPT           | 0 %           | Activités exonérées art. 261 CGI             |
 * | REVERSE_CHARGE   | 0 %           | Auto-liquidation intracommunautaire (AE)    |
 * | OUT_OF_SCOPE     | 0 %           | Hors champ (art. 259-A CGI ou non-EU)       |
 *
 * @example
 * ```typescript
 * import { VatCategory } from '@scell/sdk';
 *
 * const rate = VAT_DEFAULT_RATES['REVERSE_CHARGE']; // 0
 * ```
 */
export type VatCategory =
  | 'STANDARD'
  | 'INTERMEDIATE'
  | 'REDUCED'
  | 'SUPER_REDUCED'
  | 'ZERO_RATED'
  | 'EXEMPT'
  | 'REVERSE_CHARGE'
  | 'OUT_OF_SCOPE';

/**
 * Default TVA rates (%) associated with each {@link VatCategory}.
 *
 * These are the **server-side defaults**. The actual `rate` returned by the
 * API may differ when a custom rate has been configured or the line uses an
 * intermediate regime.
 *
 * @example
 * ```typescript
 * import { VAT_DEFAULT_RATES } from '@scell/sdk';
 *
 * function defaultRate(cat: VatCategory): number {
 *   return VAT_DEFAULT_RATES[cat];
 * }
 * ```
 */
export const VAT_DEFAULT_RATES: Record<VatCategory, number> = {
  STANDARD: 20,
  INTERMEDIATE: 10,
  REDUCED: 5.5,
  SUPER_REDUCED: 2.1,
  ZERO_RATED: 0,
  EXEMPT: 0,
  REVERSE_CHARGE: 0,
  OUT_OF_SCOPE: 0,
} as const;

/**
 * EN16931 / Factur-X duty category codes for the resolved category (BT-151).
 *
 * | Code | Meaning |
 * |------|---------|
 * | `S`  | Standard rate |
 * | `AE` | VAT Reverse Charge (auto-liquidation) |
 * | `O`  | Services Outside Scope of Tax |
 * | `Z`  | Zero-rated (exports) |
 * | `E`  | Exempt from tax |
 */
export type VatEn16931Code = 'S' | 'AE' | 'O' | 'Z' | 'E';

/**
 * Why the resolved rate differs from the standard rate.
 *
 * | Reason           | When applied                                                 |
 * |------------------|--------------------------------------------------------------|
 * | `reverse_charge` | B2B buyer in an EU country with a valid intra-EU VAT number  |
 * | `out_of_scope`   | Buyer outside the EU or a non-taxable territory              |
 * | `null`           | Standard French regime — no exemption                        |
 */
export type VatExemptionReason = 'reverse_charge' | 'out_of_scope' | null;

/**
 * Fully resolved VAT context for an invoice line.
 *
 * Returned as `resolution` in {@link VatContextResponse}.
 */
export interface VatResolution {
  /**
   * Applicable rate in percent (e.g. `20`, `0`).
   * Use this value for `tax_rate` on the invoice line.
   */
  rate: number;
  /**
   * Human-friendly category identifier (e.g. `'REVERSE_CHARGE'`).
   */
  category: VatCategory;
  /**
   * Factur-X / EN16931 BT-151 code to embed in the XML.
   * Map directly to `InvoiceLineInput.tax_category_code` (when the backend
   * exposes that field) or the Factur-X generator.
   */
  en16931_code: VatEn16931Code;
  /**
   * Why the rate is 0 % when it otherwise would not be.
   * `null` when the full rate applies.
   */
  exemption_reason: VatExemptionReason;
  /**
   * Human-readable French justification for the resolved rule, suitable for
   * display in a tooltip or help text.
   *
   * @example "Auto-liquidation intracommunautaire (art. 283-2 CGI) — TVA due par l'acheteur assujetti."
   */
  justification: string | null;
  /**
   * `true` when the resolution was fully automatic (no manual override
   * was required). `false` when a `place_of_supply` override triggered
   * a non-default rule (e.g. art. 259-A CGI).
   */
  is_auto_resolved: boolean;
  /**
   * Internal rule identifier that produced this resolution (useful for
   * debugging and audit logs).
   *
   * @example "FR_TO_EU_B2B_VALID_VAT"
   */
  rule: string;
}

/**
 * Per-line context hints that refine the VAT resolution.
 *
 * All fields are optional. When absent, the server applies the default rule
 * for the buyer's country and business-type (B2B vs B2C).
 *
 * @example
 * ```typescript
 * // Override place of supply for art. 259-A CGI digital services
 * const line: LineVatContext = {
 *   category: 'STANDARD',
 *   place_of_supply: 'FR',
 *   service_nature: 'digital_service',
 * };
 * ```
 */
export interface LineVatContext {
  /**
   * Desired starting category before the server applies territorial rules.
   * When omitted, the server defaults to `'STANDARD'`.
   */
  category?: VatCategory | undefined;
  /**
   * ISO 3166-1 alpha-2 country code where the service is effectively
   * delivered / consumed (BT-157 Factur-X). Required for "B2C digital
   * services" to trigger art. 259-A CGI override.
   *
   * @example 'FR' | 'DE' | 'ES'
   */
  place_of_supply?: string | undefined;
  /**
   * Nature of the service to help the engine distinguish between art. 259
   * and art. 259-A CGI regimes.
   *
   * Accepted values: `'digital_service'` | `'transport'` | `'immovable'` | `'general'`
   */
  service_nature?: string | undefined;
}

/**
 * Inline buyer context for the Mode-2 (no `buyer_id`) overload of
 * {@link BuyersResource.vatContext}.
 *
 * Use this when the buyer has not yet been registered in the buyers registry
 * (e.g. during a quote preview or a one-off invoice).
 *
 * @example
 * ```typescript
 * const buyer: VatBuyerContext = {
 *   country: 'DE',
 *   is_individual: false,
 *   vat_number: 'DE123456789',
 *   vat_number_valid: true,
 * };
 * ```
 */
export interface VatBuyerContext {
  /**
   * ISO 3166-1 alpha-2 country code of the buyer.
   * @example 'FR' | 'DE' | 'US'
   */
  country: string;
  /**
   * `true` for B2C (private individual), `false` for B2B.
   */
  is_individual: boolean;
  /**
   * Intra-EU VAT number of the buyer (e.g. `'DE123456789'`).
   * Required for reverse-charge resolution on EU B2B buyers.
   */
  vat_number?: string | null | undefined;
  /**
   * Whether the provided `vat_number` has been validated via VIES.
   * When `true` and the buyer is in an EU country, the server applies
   * reverse-charge rules (auto-liquidation, EN16931 code `AE`).
   * When `false` or absent, the server cannot apply reverse-charge.
   */
  vat_number_valid?: boolean | undefined;
}

/**
 * A non-blocking warning emitted alongside the VAT resolution.
 *
 * Warnings do not prevent using the resolved rate but may signal data-quality
 * issues that should be surfaced in the UI.
 *
 * @example
 * ```typescript
 * for (const w of response.warnings) {
 *   if (w.severity === 'high') console.warn('[VAT]', w.message);
 * }
 * ```
 */
export interface VatWarning {
  /**
   * Severity level for UI prioritisation.
   *
   * - `high`   — likely incorrect setup (e.g. missing VAT number for B2B EU)
   * - `medium` — potentially wrong but recoverable (e.g. unknown place_of_supply)
   * - `low`    — informational hint (e.g. SUPER_REDUCED only for specific goods)
   */
  severity: 'high' | 'medium' | 'low';
  /** Human-readable message in French. */
  message: string;
  /** Internal rule identifier that triggered this warning. */
  rule: string;
}

/**
 * Full response from `POST /tenant/buyers/vat-context`.
 *
 * @example
 * ```typescript
 * const r = await client.buyers.vatContext('uuid', { category: 'STANDARD' });
 * // Apply the resolved rate to the line
 * const line = {
 *   tax_rate: r.resolution.rate,
 *   // ...
 * };
 * if (r.warnings.length) console.warn('VAT warnings:', r.warnings);
 * ```
 */
export interface VatContextResponse {
  /** Resolved VAT parameters — use `resolution.rate` as the line tax rate. */
  resolution: VatResolution;
  /**
   * Non-blocking warnings about the resolution. An empty array means the
   * resolution is unambiguous.
   */
  warnings: VatWarning[];
}

// ─── Request payload types (internal, mirroring the API contract) ──────────

/**
 * Payload sent to `POST /tenant/buyers/vat-context` when using Mode 1
 * (buyer from registry).
 *
 * @internal
 */
export interface VatContextByIdPayload {
  buyer_id: string;
  line?: LineVatContext;
}

/**
 * Payload sent to `POST /tenant/buyers/vat-context` when using Mode 2
 * (inline buyer, no registry lookup).
 *
 * @internal
 */
export interface VatContextByBuyerPayload {
  buyer: VatBuyerContext;
  line?: LineVatContext;
}

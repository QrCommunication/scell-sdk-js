/**
 * Invoice legal-mentions assistant types.
 *
 * Two stateless endpoints that write nothing:
 *  - `POST /invoice-mentions/assistant` — suggests per-field mention texts from
 *    a profile (VAT, clientele, payment terms, penalties…).
 *  - `POST /invoice-mentions/preview` — live preview of the automatic mentions
 *    by overriding (without persisting) the tenant's default issuing Company.
 *
 * The legal logic lives server-side (single resolver) — no client-side
 * duplication nor drift.
 *
 * @since 3.5.0
 *
 * @packageDocumentation
 */

/** VAT profile of the issuer. @since 3.5.0 */
export type InvoiceMentionsVatProfile = 'franchise' | 'vat_liable';

/** Clientele targeted by the issuer. @since 3.5.0 */
export type InvoiceMentionsClientele = 'b2b' | 'b2c' | 'mixed';

/** Late-payment penalty mode. @since 3.5.0 */
export type InvoiceMentionsPenaltyMode = 'legal' | 'custom';

/**
 * Profile used to suggest per-field invoice mentions.
 *
 * @since 3.5.0
 */
export interface InvoiceMentionsAssistantInput {
  /** VAT profile of the issuing company. */
  vat_profile: InvoiceMentionsVatProfile;
  /** Clientele targeted (drives the L441-10 / B2C mentions). */
  clientele: InvoiceMentionsClientele;
  /** Net payment term in days. */
  payment_due_days: number;
  /** Penalty mode: legal default rate or a custom rate. */
  penalty_mode: InvoiceMentionsPenaltyMode;
  /** Custom penalty rate (% per year) — only when `penalty_mode === 'custom'`. */
  penalty_rate?: number | null | undefined;
  /** Early-payment discount rate (%). */
  discount_rate?: number | null | undefined;
  /** Optional professional-insurance mention text. */
  insurance_text?: string | null | undefined;
  /** Optional consumer-mediator mention text. */
  mediator_text?: string | null | undefined;
}

/**
 * Suggested invoice mentions returned by the assistant endpoint.
 *
 * Each value can be `null` (« leave empty, automatic legal default »). The
 * response also carries translatable `warnings` / `infos` codes for the UI.
 *
 * @since 3.5.0
 */
export interface InvoiceMentionsAssistantResult {
  /** Per-field suggested mention texts (shape resolved server-side). */
  [key: string]: unknown;
}

/**
 * Non-persisted issuing-Company overrides for the live mentions preview.
 *
 * @since 3.5.0
 */
export interface InvoiceMentionsPreviewInput {
  /** Net payment term in days. */
  payment_due_days?: number | undefined;
  /** Company legal name. */
  name?: string | undefined;
  /** Company SIRET (14 digits). */
  siret?: string | undefined;
  /** Company intra-community VAT number. */
  vat_number?: string | undefined;
  /** Address line 1. */
  address_line1?: string | undefined;
  /** Postal code. */
  postal_code?: string | undefined;
  /** City. */
  city?: string | undefined;
  /** ISO 3166-1 alpha-2 country code. */
  country?: string | undefined;
  /** Phone number. */
  phone?: string | undefined;
  /** Legal form (e.g. `'SARL'`, `'SAS'`). */
  legal_form?: string | undefined;
  /** Legal category code. */
  legal_category?: string | undefined;
  /** Share capital. */
  share_capital?: number | string | undefined;
  /** RCS registration city. */
  rcs_city?: string | undefined;
  /** RM (Répertoire des Métiers) department. */
  rm_department?: string | undefined;
  /** VAT regime (e.g. `'franchise'`). */
  vat_regime?: string | undefined;
  /** VAT basis. */
  vat_basis?: string | undefined;
  /** Early-payment discount rate (%). */
  early_payment_discount_rate?: number | undefined;
}

/**
 * Mentions composed by the server resolver for the live preview.
 *
 * @since 3.5.0
 */
export interface InvoiceMentionsPreviewResult {
  /** Composed invoice footer text (or `null` if empty). */
  invoice_footer: string | null;
  /** Composed B2B payment terms (or `null`). */
  payment_terms_b2b: string | null;
  /** Composed B2C payment terms (or `null`). */
  payment_terms_b2c: string | null;
  /** VAT franchise mention when applicable (or `null`). */
  vat_franchise_mention: string | null;
}

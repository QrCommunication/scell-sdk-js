/**
 * Document live-preview types for Scell.io SDK
 *
 * `POST /documents/preview` renders a NON-PERSISTED HTML preview of a
 * document being drafted (invoice, credit note or quote). The render uses
 * the real pipeline: invoice template + branding + legal mentions of the
 * issuing Company — so the preview matches the final document.
 *
 * Nothing is saved server-side; every field is optional except `type`.
 *
 * @since 3.2.0
 *
 * @packageDocumentation
 */

import type { DateString } from './common.js';

/**
 * Document kind being previewed.
 *
 * @since 3.2.0
 */
export type DocumentPreviewType = 'invoice' | 'credit_note' | 'quote';

/**
 * Buyer address as typed in the document creation form (all fields optional —
 * the preview renders whatever is available).
 *
 * @since 3.2.0
 */
export interface DocumentPreviewBuyerAddress {
  /** Address line 1 (street) */
  line1?: string | undefined;
  /** Address line 2 (building, floor...) */
  line2?: string | undefined;
  /** Postal code */
  postal_code?: string | undefined;
  /** City */
  city?: string | undefined;
  /** ISO 3166-1 alpha-2 country code, e.g. `"FR"` */
  country?: string | undefined;
}

/**
 * Buyer block of the previewed document (partial — the preview renders
 * whatever fields are filled in the form so far).
 *
 * @since 3.2.0
 */
export interface DocumentPreviewBuyer {
  /** Buyer name (company legal name or individual full name) */
  name?: string | undefined;
  /** Buyer SIRET (14 digits, B2B France) */
  siret?: string | undefined;
  /** Buyer intra-community VAT number */
  vat_number?: string | undefined;
  /** Buyer email address */
  email?: string | undefined;
  /** Buyer phone number */
  phone?: string | undefined;
  /** `true` when the buyer is a private individual (B2C) */
  is_individual?: boolean | undefined;
  /** Buyer billing address */
  address?: DocumentPreviewBuyerAddress | undefined;
}

/**
 * A document line as typed in the creation form (partial).
 *
 * @since 3.2.0
 */
export interface DocumentPreviewLine {
  /** Line description / label */
  description?: string | undefined;
  /** Quantity */
  quantity?: number | undefined;
  /** Unit price (excl. tax) */
  unit_price?: number | undefined;
  /** VAT rate in percent, e.g. `20` */
  tax_rate?: number | undefined;
}

/**
 * Payload for `POST /documents/preview` — a snapshot of the document
 * creation form. Only `type` is required; every other field is optional
 * and rendered as-is (no persistence, no numbering side effect).
 *
 * @since 3.2.0
 */
export interface DocumentPreviewInput {
  /** Document kind being previewed (required) */
  type: DocumentPreviewType;
  /** Document number to display (max 100 chars) — e.g. a draft placeholder */
  document_number?: string | undefined;
  /** Buyer block (partial) */
  buyer?: DocumentPreviewBuyer | undefined;
  /** Document lines (max 200) */
  lines?: DocumentPreviewLine[] | undefined;
  /** Issue date (`YYYY-MM-DD`) */
  issue_date?: DateString | undefined;
  /** Due date (`YYYY-MM-DD`) */
  due_date?: DateString | undefined;
  /** ISO 4217 currency code (3 chars), e.g. `"EUR"` */
  currency?: string | undefined;
  /** Free-form notes (max 2000 chars) */
  notes?: string | undefined;
  /** Payment terms text (max 2000 chars) */
  payment_terms?: string | undefined;
}

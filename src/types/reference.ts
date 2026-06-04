/**
 * Country company reference types.
 *
 * Served by `GET /api/v1/reference/countries[/{code}]` (public, no auth).
 *
 * @since 2.29.0
 */

/** Known legal form of a country (stable code + display label). */
export interface LegalForm {
  code: string;
  label: string;
}

/** VAT / tax identification metadata for a country. */
export interface CountryVatInfo {
  label: string;
  example: string | null;
  /** Anchored JS-compatible regex (`new RegExp(regex)`), null if unverified. */
  regex: string | null;
  /** Whether the number is checkable against the EU VIES registry. */
  vies_checkable: boolean;
}

/** National company-registration identifier metadata for a country. */
export interface CountryNationalIdInfo {
  label: string;
  /** ISO 6523 / Peppol EAS scheme of the register. */
  scheme: string | null;
  example: string | null;
  /** Anchored JS-compatible regex, null if format unverified for this country. */
  regex: string | null;
  required_for_b2b: boolean;
}

/**
 * Per-country company reference: VAT number, national registration identifier
 * and known legal forms — to build country-aware buyer/seller forms.
 */
export interface CountryReference {
  /** ISO 3166-1 alpha-2 code. */
  code: string;
  name: string | null;
  /** False when the country is not catalogued (permissive fallback). */
  known: boolean;
  is_eu: boolean;
  currency: string | null;
  vat: CountryVatInfo;
  national_id: CountryNationalIdInfo;
  legal_forms: LegalForm[];
}

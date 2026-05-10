/**
 * Onboarding Types
 *
 * Types for the SuperPDP OAuth2 onboarding flow.
 *
 * @packageDocumentation
 */

import type { RecommendedAction, SubTenant } from './sub-tenants.js';

/** Current step in the SuperPDP OAuth2 onboarding flow */
export type OnboardingStep = 'connect' | 'redirect' | 'complete';

/** An onboarding session */
export interface OnboardingSession {
  id: string;
  step: OnboardingStep;
  publishable_key: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/** Response from the SuperPDP authorize URL endpoint */
export interface SuperPDPAuthorizeResponse {
  authorize_url: string;
  state: string;
}

/** Tenant info returned after SuperPDP callback */
export interface SuperPDPCallbackTenant {
  id: string;
  name: string;
  siret: string;
  environment: string;
}

/** Response from the SuperPDP OAuth2 callback endpoint */
export interface SuperPDPCallbackResponse {
  success: boolean;
  authorization_code: string;
  tenant: SuperPDPCallbackTenant;
}

// ============================================================================
// Widget endpoints (publishable-key auth, since v2.0.0)
// ============================================================================

/**
 * Company data returned by the Sirene lookup endpoint.
 *
 * Mirrors the API response shape (flat address fields, snake_case).
 *
 * @example
 * ```json
 * {
 *   "name": "RL CONSEIL",
 *   "legal_name": "RL CONSEIL",
 *   "siret": "10178342100015",
 *   "siren": "101783421",
 *   "vat_number": "FR95101783421",
 *   "legal_form": "5710",
 *   "naf_code": "62.02A",
 *   "address_line1": "200 RUE DE LA CROIX NIVERT",
 *   "address_line2": null,
 *   "postal_code": "75015",
 *   "city": "PARIS",
 *   "country": "FR",
 *   "is_active": true,
 *   "creation_date": "2026-01-19",
 *   "employee_range": "NN"
 * }
 * ```
 */
export interface CompanyData {
  siret: string;
  siren: string;
  /** Trade name (or legal name as fallback). */
  name: string;
  legal_name?: string | null;
  legal_form?: string | null;
  legal_form_code?: string | null;
  naf_code?: string | null;
  naf_label?: string | null;
  vat_number?: string | null;
  address_line1: string;
  address_line2?: string | null;
  postal_code: string;
  city: string;
  country: string;
  is_active: boolean;
  /** ISO date the establishment was created (YYYY-MM-DD). */
  creation_date?: string | null;
  employee_range?: string | null;
}

/**
 * Raw response shape from `POST /widget/onboarding/sirene/lookup`.
 *
 * **Three possible cases — use `parseSireneLookup()` to discriminate**:
 *
 * 1. **Sirene found the company** : `data` is a full `CompanyData`, no `code`.
 * 2. **Sirene + INSEE down (manual entry required)** : `data` contains
 *    `sirene_lookup_failed: true` plus partial fields (siret/siren/vat_number/country),
 *    `code = 'SIRENE_MANUAL_ENTRY_REQUIRED'`.
 * 3. **SIRET not found** : `data: null`, `code = 'SIRENE_NOT_FOUND'` (HTTP 404).
 */
export interface SireneLookupRawResponse {
  data: CompanyData | SireneManualEntryData | null;
  code?: string;
  error?: string;
}

/**
 * Partial payload returned in the manual-entry fallback case.
 * Only `siret`, `siren`, `vat_number`, `country` are guaranteed.
 */
export interface SireneManualEntryData {
  sirene_lookup_failed: true;
  siret: string;
  siren: string;
  vat_number?: string | null;
  country: string;
}

/**
 * Discriminated, ready-to-consume Sirene lookup result.
 *
 * Returned by `OnboardingResource.lookupSirene()` since v2.3.0. Mirrors the
 * shape exposed by the PHP SDK (`Scell\Sdk\DTOs\SireneLookupResult`).
 */
export interface SireneLookupResult {
  /** Full CompanyData when Sirene resolved the SIRET. `null` otherwise. */
  data: CompanyData | null;
  /** True when Sirene returned a complete company record. */
  sirene_lookup_succeeded: boolean;
  /** True when both providers failed and the user must fill the form manually. */
  manual_entry_required: boolean;
  /**
   * Server status code, e.g. `'SIRENE_MANUAL_ENTRY_REQUIRED'` or
   * `'SIRENE_NOT_FOUND'`. `null` on success.
   */
  code: string | null;
}

/**
 * @deprecated since v2.3.0 — use `SireneLookupResult` instead. Kept as a
 * type alias for backwards compatibility (was always `null` for `data` due
 * to a parsing bug in pre-v2.3.0 SDKs anyway).
 */
export type SireneLookupResponse = SireneLookupResult;

/**
 * Identity form payload collected by the widget for the natural person
 * driving the onboarding (the "human" behind the legal entity).
 */
export interface IdentityFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  /** ISO date of birth (YYYY-MM-DD). */
  birth_date?: string;
  job_title?: string;
}

/**
 * Input for `POST /widget/onboarding/sub-tenant` (publishable-key auth).
 *
 * Builds a SubTenant from the widget data without requiring the partner
 * tenant's bearer token. The publishable key scopes the call to the
 * issuing tenant.
 */
export interface CreateWidgetSubTenantInput {
  external_id?: string;
  company: CompanyData;
  identity: IdentityFormData;
  /** Locale used to compute the localized strings inside `recommended_action`. */
  locale?: 'fr' | 'en';
  metadata?: Record<string, unknown>;
}

/**
 * Response from `POST /widget/onboarding/sub-tenant`.
 */
export interface CreateWidgetSubTenantResponse {
  data: SubTenant;
  recommended_action: RecommendedAction | null;
  resume_url: string | null;
}

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
 * Mirrors the INSEE / data.gouv Sirene v3 schema, normalized to ISO codes.
 */
export interface CompanyData {
  siret: string;
  siren: string;
  name: string;
  legal_form?: string | null;
  legal_form_code?: string | null;
  naf_code?: string | null;
  naf_label?: string | null;
  vat_number?: string | null;
  address: {
    line1: string;
    line2?: string | null;
    postal_code: string;
    city: string;
    country: string;
  };
  is_active: boolean;
  /** ISO date the company was created in Sirene. */
  created_at?: string | null;
}

/**
 * Response from `POST /widget/onboarding/sirene/lookup` (publishable-key auth).
 */
export interface SireneLookupResponse {
  data: CompanyData | null;
  /** True when Sirene answered (even with no match). False on rate-limit / outage. */
  sirene_lookup_succeeded: boolean;
}

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

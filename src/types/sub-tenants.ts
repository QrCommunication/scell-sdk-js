/**
 * Sub-Tenant Types
 *
 * Types for the sub-tenant management API.
 *
 * @packageDocumentation
 */

/**
 * SubTenant onboarding status (since v2.0.0).
 *
 * Replaces the legacy `kyc_status` field which was 3-valued
 * ('pending' | 'verified' | 'rejected'). The new model exposes the
 * full SuperPDP onboarding lifecycle:
 *
 * | Legacy `kyc_status` | New `onboarding_status`         |
 * |---------------------|---------------------------------|
 * | pending             | pending_superpdp                |
 * | pending             | superpdp_redirected             |
 * | pending             | superpdp_authorized             |
 * | pending             | superpdp_pending_review         |
 * | verified            | active                          |
 * | rejected            | superpdp_failed                 |
 */
export type OnboardingStatus =
  | 'pending_superpdp'
  | 'superpdp_redirected'
  | 'superpdp_authorized'
  | 'superpdp_pending_review'
  | 'active'
  | 'superpdp_failed';

/** SuperPDP company verification status (KYB). */
export type SuperPDPCompanyVerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'failed'
  | null;

/** SuperPDP user identity verification status (KYC). */
export type SuperPDPUserIdentityVerificationStatus =
  | 'verified'
  | 'needs_review'
  | 'not_verified'
  | null;

/**
 * Recommended next action presented to the partner UI, with structured
 * i18n labels (FR/EN). Backend computes this from `onboarding_status`,
 * `superpdp_company_verification_status` and
 * `superpdp_user_identity_verification_status`.
 */
export interface RecommendedAction {
  /** Stable machine code for analytics / logic branching. */
  code: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  title_fr: string;
  title_en: string;
  message_fr: string;
  message_en: string;
  cta_label_fr: string;
  cta_label_en: string;
  /** Optional URL the CTA should open (signed resume URL, dashboard link, ...). */
  cta_url: string | null;
  /** Whether the partner UI may dismiss the banner without taking action. */
  dismissible: boolean;
}

export interface SubTenantAddress {
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country?: string;
}

/**
 * SubTenant summary returned by `GET /sub-tenants/{id}` (v2 shape).
 *
 * Breaking change vs v1.x: dropped `kyc_status`, `kyc_verified_at`,
 * `kyc_delegated`. Replaced by `onboarding_status` plus the explicit
 * SuperPDP verification fields.
 */
export interface SubTenant {
  id: string;
  external_id?: string | null;
  name: string;
  siret?: string | null;
  siren?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: SubTenantAddress | null;
  metadata?: Record<string, unknown> | null;

  /** Contact first name (since v2.0.0). */
  contact_first_name?: string | null;
  /** Contact last name (since v2.0.0). */
  contact_last_name?: string | null;

  /** Onboarding lifecycle status (since v2.0.0). */
  onboarding_status: OnboardingStatus;
  /** SuperPDP KYB result (since v2.0.0). */
  superpdp_company_verification_status?: SuperPDPCompanyVerificationStatus;
  /** SuperPDP KYC result (since v2.0.0). */
  superpdp_user_identity_verification_status?: SuperPDPUserIdentityVerificationStatus;
  /** Last time the backend polled SuperPDP for status (ISO 8601 UTC). */
  last_polled_at?: string | null;
  /**
   * Signed resume URL valid 7 days, returned while `onboarding_status !== 'active'`.
   * Use this to redirect the sub-tenant back into the SuperPDP flow.
   */
  resume_url?: string | null;

  created_at?: string;
  updated_at?: string;
}

/**
 * Type alias kept for clarity in code that explicitly handles the
 * v2 enriched payload of `getSuperPDPStatus` / `refreshSuperPDPStatus`.
 */
export type SubTenantSummary = SubTenant;

export interface SubTenantListOptions {
  per_page?: number;
  page?: number;
  search?: string;
}

export interface CreateSubTenantInput {
  external_id?: string;
  name: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  address?: SubTenantAddress;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubTenantInput {
  external_id?: string;
  name?: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  address?: SubTenantAddress;
  metadata?: Record<string, unknown>;
}

/**
 * Response from `GET /tenant/sub-tenants/{id}/superpdp-status` and
 * `POST /tenant/sub-tenants/{id}/superpdp-status/refresh` (since v2.0.0).
 */
export interface SubTenantStatusResponse {
  data: SubTenant;
  recommended_action: RecommendedAction | null;
}

/**
 * Response from `POST /tenant/sub-tenants/{id}/resume-url` (since v2.0.0).
 */
export interface SubTenantResumeUrlResponse {
  resume_url: string;
  expires_at: string;
}

/**
 * Response from `POST /tenant/sub-tenants/{id}/superpdp-authorize`
 * (since v2.9.0). Returns a fresh SuperPDP OAuth authorize URL plus
 * the associated `state` parameter for CSRF protection.
 */
export interface SubTenantSuperPDPAuthorizeResponse {
  authorize_url: string;
  state: string;
}

/**
 * Options accepted by `SubTenantsResource.delete()` (since v2.9.0).
 *
 * Pass `cascade: true` to delete dependent Companies alongside the
 * sub-tenant. Without it, the API rejects deletion of a sub-tenant
 * that still owns Companies (422 `SUB_TENANT_HAS_COMPANIES`).
 *
 * Sub-tenants with fiscal entries (issued Invoices / CreditNotes)
 * are NEVER deletable regardless of this flag, due to ISCA
 * compliance (422 `SUB_TENANT_HAS_FISCAL_ENTRIES`).
 */
export interface DeleteSubTenantOptions {
  cascade?: boolean;
}

/**
 * Response body from `DELETE /tenant/sub-tenants/{id}` (since v2.9.0).
 *
 * `companies_deleted` reports how many Companies were cascade-deleted
 * with the sub-tenant. Zero when `cascade` was not used or the
 * sub-tenant owned no Companies.
 */
export interface DeleteSubTenantResponse {
  message: string;
  companies_deleted: number;
}

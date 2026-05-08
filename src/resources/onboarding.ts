/**
 * Onboarding Resource
 *
 * SuperPDP OAuth2 Authorization Code onboarding flow + widget endpoints.
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { SingleResponse } from '../types/common.js';
import type {
  CompanyData,
  CreateWidgetSubTenantInput,
  CreateWidgetSubTenantResponse,
  OnboardingSession,
  SireneLookupResponse,
  SuperPDPAuthorizeResponse,
  SuperPDPCallbackResponse,
} from '../types/onboarding.js';

/**
 * Onboarding API resource
 *
 * Manages the SuperPDP OAuth2 Authorization Code flow for partner tenant onboarding.
 * The flow has 3 steps: connect → redirect → complete.
 *
 * Since v2.0.0 also exposes the publishable-key widget endpoints
 * (`lookupSirene`, `createSubTenant`).
 */
export class OnboardingResource {
  constructor(private readonly http: HttpClient) {}

  /** Create a new onboarding session. */
  async createSession(
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<OnboardingSession>> {
    return this.http.post<SingleResponse<OnboardingSession>>(
      '/onboarding/sessions',
      undefined,
      requestOptions
    );
  }

  /** Get an existing onboarding session by ID. */
  async getSession(
    sessionId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<OnboardingSession>> {
    return this.http.get<SingleResponse<OnboardingSession>>(
      `/onboarding/sessions/${sessionId}`,
      undefined,
      requestOptions
    );
  }

  /** Get the SuperPDP OAuth2 authorization URL for an onboarding session. */
  async getSuperPDPAuthorizeUrl(
    sessionId: string,
    requestOptions?: RequestOptions
  ): Promise<SuperPDPAuthorizeResponse> {
    return this.http.post<SuperPDPAuthorizeResponse>(
      '/onboarding/superpdp/authorize',
      { session_id: sessionId },
      requestOptions
    );
  }

  /** Handle the SuperPDP OAuth2 callback and finalize the onboarding session. */
  async superpdpCallback(
    sessionId: string,
    code: string,
    state: string,
    requestOptions?: RequestOptions
  ): Promise<SuperPDPCallbackResponse> {
    return this.http.post<SuperPDPCallbackResponse>(
      '/onboarding/superpdp/callback',
      { session_id: sessionId, code, state },
      requestOptions
    );
  }

  // ==========================================================================
  // Widget endpoints (publishable-key auth, since v2.0.0)
  // ==========================================================================

  /**
   * Look up a French company by SIRET via the Sirene registry.
   *
   * Authenticates with a publishable key (X-Publishable-Key). Use this from
   * the partner widget to prefill the onboarding form.
   *
   * Returns `{ data: null, sirene_lookup_succeeded: true }` when Sirene
   * answered with no match for the SIRET.
   * Returns `{ data: null, sirene_lookup_succeeded: false }` on a Sirene
   * outage or rate-limit — in that case the widget should let the user
   * fill the form manually.
   *
   * @param siret - 14 digit SIRET, with or without spaces.
   *
   * @example
   * ```typescript
   * const publicClient = new ScellPublicClient('pk_live_...');
   * const { data, sirene_lookup_succeeded } =
   *   await publicClient.onboarding.lookupSirene('12345678901234');
   * if (data) {
   *   console.log(data.name, data.address.city);
   * }
   * ```
   */
  async lookupSirene(
    siret: string,
    requestOptions?: RequestOptions
  ): Promise<SireneLookupResponse> {
    return this.http.post<SireneLookupResponse>(
      '/widget/onboarding/sirene/lookup',
      { siret: siret.replace(/\s+/g, '') },
      requestOptions
    );
  }

  /**
   * Create a SubTenant from widget-collected data (publishable-key auth).
   *
   * The publishable key scopes the call to the issuing tenant; no bearer
   * token is required. Returns the created SubTenant, the localized
   * recommended next action and a signed resume URL valid 7 days.
   *
   * @example
   * ```typescript
   * const result = await publicClient.onboarding.createSubTenant({
   *   external_id: 'crm-42',
   *   company: companyDataFromSirene,
   *   identity: { first_name: 'Marie', last_name: 'Dupont', email: 'marie@acme.fr' },
   *   locale: 'fr',
   * });
   * if (result.recommended_action?.cta_url) {
   *   window.open(result.recommended_action.cta_url);
   * }
   * ```
   */
  async createSubTenant(
    input: CreateWidgetSubTenantInput,
    requestOptions?: RequestOptions
  ): Promise<CreateWidgetSubTenantResponse> {
    return this.http.post<CreateWidgetSubTenantResponse>(
      '/widget/onboarding/sub-tenant',
      input,
      requestOptions
    );
  }
}

/* Re-export for convenience when consumers import the resource directly. */
export type { CompanyData };

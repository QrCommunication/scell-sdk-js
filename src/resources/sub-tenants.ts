/**
 * Sub-Tenants Resource
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  CreateSubTenantInput,
  DeleteSubTenantOptions,
  DeleteSubTenantResponse,
  FiscalStatusResponse,
  SimulateThresholdInput,
  SubTenant,
  SubTenantListOptions,
  SubTenantResumeUrlResponse,
  SubTenantStatusResponse,
  SubTenantSuperPDPAuthorizeResponse,
  SubTenantSuperPDPReconnectResponse,
  SubTenantWidgetTokenOptions,
  SubTenantWidgetTokenResponse,
  ThresholdSimulationResponse,
  ThresholdsResponse,
  UpdateFiscalStatusInput,
  UpdateSubTenantInput,
} from '../types/sub-tenants.js';
import {
  DeleteSubTenantFiscalLockedError,
  DeleteSubTenantHasCompaniesError,
  ScellRateLimitError,
  SubTenantMissingAccessTokenError,
} from '../errors.js';

export class SubTenantsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: SubTenantListOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<SubTenant>> {
    return this.http.get<PaginatedResponse<SubTenant>>('/tenant/sub-tenants', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async create(input: CreateSubTenantInput, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.post<SingleResponse<SubTenant>>('/tenant/sub-tenants', input, requestOptions);
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.get<SingleResponse<SubTenant>>(`/tenant/sub-tenants/${id}`, undefined, requestOptions);
  }

  async update(id: string, input: UpdateSubTenantInput, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.patch<SingleResponse<SubTenant>>(`/tenant/sub-tenants/${id}`, input, requestOptions);
  }

  /**
   * Delete a sub-tenant.
   *
   * Without `cascade: true`, a sub-tenant that still owns Companies
   * cannot be deleted — the API responds with 422
   * `SUB_TENANT_HAS_COMPANIES`, surfaced here as
   * `DeleteSubTenantHasCompaniesError`. Retry with `{ cascade: true }`
   * to remove the Companies along with the sub-tenant.
   *
   * Sub-tenants that have issued Invoices or CreditNotes are NEVER
   * deletable (ISCA compliance). The API responds with 422
   * `SUB_TENANT_HAS_FISCAL_ENTRIES`, surfaced here as
   * `DeleteSubTenantFiscalLockedError`.
   *
   * @param id - Sub-tenant UUID
   * @param options - `{ cascade?: boolean }`. Also accepts `RequestOptions`
   *                  fields (headers, timeout, signal, skipRetry) for
   *                  backward compatibility with v2.8.x callers.
   *
   * @example Soft delete (default)
   * ```typescript
   * await client.subTenants.delete(subTenantId);
   * ```
   *
   * @example Cascade delete with retry pattern
   * ```typescript
   * try {
   *   await client.subTenants.delete(subTenantId);
   * } catch (e) {
   *   if (e instanceof DeleteSubTenantHasCompaniesError) {
   *     console.log(`Has ${e.companiesCount} companies; cascading...`);
   *     const { companies_deleted } =
   *       await client.subTenants.delete(subTenantId, { cascade: true });
   *     console.log(`Cascade deleted ${companies_deleted} companies.`);
   *   } else if (e instanceof DeleteSubTenantFiscalLockedError) {
   *     // Fiscal entries — cannot delete. Soft-archive instead.
   *   }
   * }
   * ```
   */
  async delete(
    id: string,
    options?: (DeleteSubTenantOptions & RequestOptions) | RequestOptions
  ): Promise<DeleteSubTenantResponse> {
    const { cascade, ...requestOptions } = (options ?? {}) as DeleteSubTenantOptions &
      RequestOptions;
    const path = cascade
      ? `/tenant/sub-tenants/${id}?cascade=true`
      : `/tenant/sub-tenants/${id}`;
    return this.http.delete<DeleteSubTenantResponse>(path, requestOptions);
  }

  async findByExternalId(externalId: string, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.get<SingleResponse<SubTenant>>(`/tenant/sub-tenants/by-external-id/${externalId}`, undefined, requestOptions);
  }

  // ==========================================================================
  // SuperPDP onboarding status (since v2.0.0)
  // ==========================================================================

  /**
   * Get the cached SuperPDP onboarding status for a sub-tenant.
   *
   * Returns the v2 enriched payload (onboarding_status + verification fields)
   * plus the localized recommended next action.
   *
   * @example
   * ```typescript
   * const { data, recommended_action } =
   *   await client.subTenants.getSuperPDPStatus(subTenantId);
   * console.log(data.onboarding_status, recommended_action?.title_fr);
   * ```
   */
  async getSuperPDPStatus(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SubTenantStatusResponse> {
    return this.http.get<SubTenantStatusResponse>(
      `/tenant/sub-tenants/${id}/superpdp-status`,
      undefined,
      requestOptions
    );
  }

  /**
   * Force a fresh poll of SuperPDP for the sub-tenant onboarding status.
   *
   * Rate-limited server-side to 1 request per minute per sub-tenant; a
   * 429 response is surfaced as a `ScellRateLimitError`.
   *
   * @example
   * ```typescript
   * try {
   *   const { data } = await client.subTenants.refreshSuperPDPStatus(subTenantId);
   * } catch (e) {
   *   if (e instanceof ScellRateLimitError) {
   *     // backoff and retry later, or fall back to getSuperPDPStatus().
   *   }
   * }
   * ```
   */
  async refreshSuperPDPStatus(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SubTenantStatusResponse> {
    return this.http.post<SubTenantStatusResponse>(
      `/tenant/sub-tenants/${id}/superpdp-status/refresh`,
      undefined,
      requestOptions
    );
  }

  /**
   * Regenerate the signed resume URL for a sub-tenant whose onboarding is
   * not yet complete (`onboarding_status !== 'active'`). The returned URL
   * is signed and valid 7 days.
   *
   * @example
   * ```typescript
   * const { resume_url, expires_at } =
   *   await client.subTenants.getResumeUrl(subTenantId);
   * sendEmailWithLink(resume_url, expires_at);
   * ```
   */
  async getResumeUrl(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SubTenantResumeUrlResponse> {
    return this.http.post<SubTenantResumeUrlResponse>(
      `/tenant/sub-tenants/${id}/resume-url`,
      undefined,
      requestOptions
    );
  }

  /**
   * Generate a fresh SuperPDP OAuth authorize URL for the sub-tenant
   * (since v2.9.0). Use this when you need a new authorize link
   * outside the refresh-status error path — e.g. to display a
   * "Reconnect SuperPDP" button in the partner UI.
   *
   * Returns the URL plus the associated `state` parameter, which the
   * partner UI must store (cookie / session) and verify against the
   * `state` returned in the OAuth callback to prevent CSRF.
   *
   * @example
   * ```typescript
   * const { authorize_url, state } =
   *   await client.subTenants.superpdpAuthorize(subTenantId);
   * storeState(subTenantId, state);
   * window.location.assign(authorize_url);
   * ```
   */
  async superpdpAuthorize(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SubTenantSuperPDPAuthorizeResponse> {
    return this.http.post<SubTenantSuperPDPAuthorizeResponse>(
      `/tenant/sub-tenants/${id}/superpdp-authorize`,
      undefined,
      requestOptions
    );
  }

  /**
   * Disconnect SuperPDP for a sub-tenant: revoke the tokens server-side and
   * reset `onboarding_status` to `pending_superpdp` (since v3.1.0).
   *
   * Already-issued invoices are untouched (immutable, ISCA); future B2B invoices
   * fall back to paper mode until SuperPDP is reconnected. To re-open the flow
   * in a single call, use {@link superpdpReconnect}.
   *
   * @example
   * ```typescript
   * await client.subTenants.superpdpDisconnect(subTenantId);
   * ```
   */
  async superpdpDisconnect(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SubTenantStatusResponse> {
    return this.http.post<SubTenantStatusResponse>(
      `/tenant/sub-tenants/${id}/superpdp-disconnect`,
      undefined,
      requestOptions
    );
  }

  /**
   * Force a SuperPDP reconnect: disconnect (revoke + reset) then generate a
   * fresh authorize URL in one call (since v3.1.0). Open `authorize_url` in a
   * new tab so the end user re-runs the SuperPDP KYB.
   *
   * @example
   * ```typescript
   * const { authorize_url, state } =
   *   await client.subTenants.superpdpReconnect(subTenantId);
   * storeState(subTenantId, state);
   * window.open(authorize_url, '_blank');
   * ```
   */
  async superpdpReconnect(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SubTenantSuperPDPReconnectResponse> {
    return this.http.post<SubTenantSuperPDPReconnectResponse>(
      `/tenant/sub-tenants/${id}/superpdp-reconnect`,
      undefined,
      requestOptions
    );
  }

  /**
   * Mint a signed token (signed URL scoped to ONE sub-tenant, 24h TTL) to feed
   * the `<scell-onboarding mode="superpdp" resume-token="...">` web component
   * (since v3.1.0). The widget then opens ONLY the SuperPDP step without
   * exposing the sub-tenant id (the HMAC signature prevents IDOR).
   *
   * Pass `{ reset: true }` to disconnect (revoke + reset) before minting — the
   * "force reconnect via widget" path. The destructive action stays server-side
   * (this sk_ or Sanctum call), never triggered by the public widget itself.
   *
   * @example
   * ```typescript
   * const { resume_token } =
   *   await client.subTenants.superpdpWidgetToken(subTenantId, { reset: true });
   * // Pass resume_token to <scell-onboarding mode="superpdp" resume-token={resume_token}>
   * ```
   */
  async superpdpWidgetToken(
    id: string,
    options?: SubTenantWidgetTokenOptions,
    requestOptions?: RequestOptions
  ): Promise<SubTenantWidgetTokenResponse> {
    return this.http.post<SubTenantWidgetTokenResponse>(
      `/tenant/sub-tenants/${id}/superpdp-widget-token`,
      options?.reset ? { reset: true } : undefined,
      requestOptions
    );
  }

  // ==========================================================================
  // Micro-entrepreneur thresholds + fiscal status (since v2.30.0)
  // ==========================================================================

  /**
   * Get the French micro-entrepreneur threshold gauges for a sub-tenant
   * (VAT franchise base/majored + micro-regime ceiling), with cumulative
   * HT revenue per category, the reached alert level and a projected
   * crossing date. The thresholds are dated rules (loi 2025-1044) resolved
   * server-side for the current fiscal year.
   *
   * The report is purely informational (not tax advice) — see `disclaimer`.
   *
   * @example
   * ```typescript
   * const { data, disclaimer } = await client.subTenants.getThresholds(subTenantId);
   * for (const g of data.gauges) {
   *   console.log(`${g.category}/${g.kind}: ${g.percent}% (${g.level ?? 'ok'})`);
   * }
   * ```
   */
  async getThresholds(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<ThresholdsResponse> {
    return this.http.get<ThresholdsResponse>(
      `/tenant/sub-tenants/${id}/thresholds`,
      undefined,
      requestOptions
    );
  }

  /**
   * Update a sub-tenant's declared fiscal profile (regime, VAT status,
   * activity type, activity start date, VAT number).
   *
   * Switching `vat_status` to `'liable'` flips Scell.io billing to charge
   * VAT: subsequent invoices carry VAT and drop the art. 293 B franchise
   * mention. A `vat_number` is required when becoming liable (in the payload
   * or already on the sub-tenant), otherwise the API responds 422. The
   * administrative VAT registration (URSSAF / guichet unique INPI) remains
   * the micro-entrepreneur's responsibility.
   *
   * @example
   * ```typescript
   * const { data, message } = await client.subTenants.updateFiscalStatus(subTenantId, {
   *   vat_status: 'liable',
   *   vat_number: 'FR12345678901',
   * });
   * ```
   */
  async updateFiscalStatus(
    id: string,
    input: UpdateFiscalStatusInput,
    requestOptions?: RequestOptions
  ): Promise<FiscalStatusResponse> {
    return this.http.patch<FiscalStatusResponse>(
      `/tenant/sub-tenants/${id}/fiscal-status`,
      input,
      requestOptions
    );
  }

  /**
   * Pre-issuance simulator: project the threshold gauges AS IF a hypothetical
   * invoice of `input.amount` (net/HT) were issued in `input.category`
   * (since v2.31.0). The returned gauge `level`/`actionable` reflect the
   * POST-invoice state, letting the micro-entrepreneur check whether issuing
   * would cross a threshold BEFORE doing so. Read-only — records nothing.
   *
   * @example
   * ```typescript
   * const { data } = await client.subTenants.simulateThresholds(subTenantId, {
   *   amount: 5000, category: 'service',
   * });
   * const crosses = data.gauges.some((g) => g.actionable);
   * ```
   */
  async simulateThresholds(
    id: string,
    input: SimulateThresholdInput,
    requestOptions?: RequestOptions
  ): Promise<ThresholdSimulationResponse> {
    return this.http.post<ThresholdSimulationResponse>(
      `/tenant/sub-tenants/${id}/thresholds/simulate`,
      input,
      requestOptions
    );
  }
}

/* Re-export error classes for convenience in catch sites. */
export {
  DeleteSubTenantFiscalLockedError,
  DeleteSubTenantHasCompaniesError,
  ScellRateLimitError,
  SubTenantMissingAccessTokenError,
};

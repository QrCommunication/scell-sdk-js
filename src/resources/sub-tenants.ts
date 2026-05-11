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
  SubTenant,
  SubTenantListOptions,
  SubTenantResumeUrlResponse,
  SubTenantStatusResponse,
  SubTenantSuperPDPAuthorizeResponse,
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
}

/* Re-export error classes for convenience in catch sites. */
export {
  DeleteSubTenantFiscalLockedError,
  DeleteSubTenantHasCompaniesError,
  ScellRateLimitError,
  SubTenantMissingAccessTokenError,
};

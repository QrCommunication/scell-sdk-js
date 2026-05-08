/**
 * Sub-Tenants Resource
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { MessageResponse, PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  CreateSubTenantInput,
  SubTenant,
  SubTenantListOptions,
  SubTenantResumeUrlResponse,
  SubTenantStatusResponse,
  UpdateSubTenantInput,
} from '../types/sub-tenants.js';
import { ScellRateLimitError } from '../errors.js';

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

  async delete(id: string, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/tenant/sub-tenants/${id}`, requestOptions);
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
      `/sub-tenants/${id}/superpdp-status`,
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
      `/sub-tenants/${id}/superpdp-status/refresh`,
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
      `/sub-tenants/${id}/resume-url`,
      undefined,
      requestOptions
    );
  }
}

/* Re-export rate-limit error for convenience in catch sites. */
export { ScellRateLimitError };

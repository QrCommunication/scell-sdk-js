/**
 * Tenant Signatures Resource
 *
 * Read-only access to electronic signatures scoped to the authenticated
 * tenant via `X-API-Key` (`sk_live_*` / `sk_test_*`). Endpoints follow the
 * URL-nested pattern already used by tenant invoices and credit notes :
 *
 * - `GET /tenant/signatures`
 * - `GET /tenant/signatures/{id}`
 * - `GET /tenant/sub-tenants/{subTenantId}/signatures`
 * - `GET /tenant/sub-tenants/{subTenantId}/signatures/{id}`
 *
 * The server scopes results by `tenant_id` (resolved via `company.tenant_id`)
 * and enforces strict ownership : passing an arbitrary sub-tenant UUID
 * that does not belong to the authenticated tenant returns 404.
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  PaginatedResponse,
  SingleResponse,
  Environment,
  UUID,
} from '../types/common.js';
import type {
  Signature,
  SignatureStatus,
} from '../types/signatures.js';

/**
 * Filter and pagination options for tenant signature listing.
 *
 * Unlike {@link SignatureListOptions} (used by the legacy `signatures.list()`
 * under Sanctum), the URL-nested tenant endpoints do not accept
 * `sub_tenant_id` as a query param — sub-tenant scope is expressed via
 * the URL itself.
 */
export interface TenantSignatureListOptions {
  /** Filter by signature status. */
  status?: SignatureStatus | undefined;
  /** Filter by environment (`'sandbox'` / `'production'`). */
  environment?: Environment | undefined;
  /** Items per page (Laravel pagination, max 100). */
  per_page?: number | undefined;
}

/**
 * Tenant Signatures API resource (read-only).
 *
 * @example
 * ```typescript
 * import { ScellApiClient } from '@scell/sdk';
 *
 * const client = new ScellApiClient('sk_live_xxx');
 *
 * // List all signatures of the tenant
 * const { data, meta } = await client.tenant.signatures.list({
 *   status: 'completed',
 *   per_page: 50,
 * });
 *
 * // Get a single signature
 * const { data: sig } = await client.tenant.signatures.get('sig-uuid');
 *
 * // Sub-tenant scoped
 * const { data: subData } = await client.tenant.signatures.listForSubTenant(
 *   'sub-tenant-uuid',
 *   { status: 'pending' },
 * );
 * ```
 */
export class TenantSignaturesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List signatures of the authenticated tenant.
   *
   * @param options - Optional filters and pagination
   * @param requestOptions - Optional request configuration
   * @returns Paginated signatures collection
   *
   * @example
   * ```typescript
   * const { data, meta } = await client.tenant.signatures.list({
   *   status: 'pending',
   *   per_page: 25,
   * });
   * console.log(`${meta.total} signatures`);
   * ```
   */
  async list(
    options: TenantSignatureListOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<PaginatedResponse<Signature>> {
    return this.http.get<PaginatedResponse<Signature>>(
      '/tenant/signatures',
      options as Record<string, string | number | boolean | undefined>,
      requestOptions,
    );
  }

  /**
   * Get a single signature by ID, scoped to the authenticated tenant.
   *
   * @param signatureId - Signature UUID
   * @param requestOptions - Optional request configuration
   * @returns Signature entity
   *
   * @throws {ScellNotFoundError} 404 if the signature does not belong to the
   * authenticated tenant.
   */
  async get(
    signatureId: UUID,
    requestOptions?: RequestOptions,
  ): Promise<SingleResponse<Signature>> {
    return this.http.get<SingleResponse<Signature>>(
      `/tenant/signatures/${signatureId}`,
      undefined,
      requestOptions,
    );
  }

  /**
   * List signatures of a specific sub-tenant of the authenticated tenant.
   *
   * Strict scope : the sub-tenant UUID must belong to the authenticated
   * tenant. Otherwise 404.
   *
   * @param subTenantId - Sub-tenant UUID (must belong to the current tenant)
   * @param options - Optional filters and pagination
   * @param requestOptions - Optional request configuration
   * @returns Paginated signatures collection
   *
   * @throws {ScellNotFoundError} 404 if the sub-tenant does not belong to
   * the authenticated tenant.
   */
  async listForSubTenant(
    subTenantId: UUID,
    options: TenantSignatureListOptions = {},
    requestOptions?: RequestOptions,
  ): Promise<PaginatedResponse<Signature>> {
    return this.http.get<PaginatedResponse<Signature>>(
      `/tenant/sub-tenants/${subTenantId}/signatures`,
      options as Record<string, string | number | boolean | undefined>,
      requestOptions,
    );
  }

  /**
   * Get a single signature scoped to a sub-tenant of the authenticated
   * tenant.
   *
   * Strict scope : the signature must belong to BOTH the sub-tenant AND
   * the authenticated tenant. Otherwise 404.
   *
   * @param subTenantId - Sub-tenant UUID
   * @param signatureId - Signature UUID
   * @param requestOptions - Optional request configuration
   * @returns Signature entity
   *
   * @throws {ScellNotFoundError} 404 if the signature does not belong to
   * the sub-tenant or the sub-tenant does not belong to the tenant.
   */
  async getForSubTenant(
    subTenantId: UUID,
    signatureId: UUID,
    requestOptions?: RequestOptions,
  ): Promise<SingleResponse<Signature>> {
    return this.http.get<SingleResponse<Signature>>(
      `/tenant/sub-tenants/${subTenantId}/signatures/${signatureId}`,
      undefined,
      requestOptions,
    );
  }
}

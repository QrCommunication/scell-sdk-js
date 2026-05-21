/**
 * Branding Resource
 *
 * Wraps the branding endpoints for both tenant and sub-tenant scopes:
 *
 * Tenant:
 *   GET    /api/v1/tenant/branding
 *   PATCH  /api/v1/tenant/branding
 *   POST   /api/v1/tenant/branding/logo-upload-url
 *
 * Sub-tenant:
 *   GET    /api/v1/sub-tenants/{id}/branding
 *   PATCH  /api/v1/sub-tenants/{id}/branding
 *   POST   /api/v1/sub-tenants/{id}/branding/logo-upload-url
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  Branding,
  BrandingLogoUploadUrlInput,
  BrandingLogoUploadUrlResponse,
  UpdateBrandingInput,
} from '../types/branding.js';

/**
 * Branding API resource
 *
 * Controls how emails (invoice delivery, reminders, signature requests)
 * appear to recipients. Branding is scoped per-tenant or per-sub-tenant.
 *
 * When branding is incomplete (missing fields), Scell.io default branding
 * is used automatically. Use `branding.is_complete` to check readiness.
 *
 * @example
 * ```typescript
 * const client = new ScellApiClient('sk_live_xxx');
 *
 * // 1. Get pre-signed upload URL
 * const { upload_url, public_url } = await client.branding.tenant.uploadLogo('image/png');
 *
 * // 2. Upload the logo directly to S3 (browser or Node.js)
 * await fetch(upload_url, { method: 'PUT', body: logoFileOrBuffer });
 *
 * // 3. Persist the public URL + other branding fields
 * const branding = await client.branding.tenant.update({
 *   brand_logo_url: public_url,
 *   brand_primary_color: '#1A73E8',
 *   brand_email_footer: 'Société XYZ — 12 rue de la République, 75001 Paris — SIRET 123 456 789 00012',
 *   brand_email_signature: "L'équipe Société XYZ",
 * });
 *
 * console.log('Branding complete:', branding.is_complete);
 * ```
 */
export class BrandingResource {
  constructor(private readonly http: HttpClient) {}

  /** Tenant-level branding operations */
  readonly tenant = {
    /**
     * Get the current tenant branding profile
     *
     * @param requestOptions - Per-request options
     * @returns Current branding profile with `is_complete` flag
     *
     * @example
     * ```typescript
     * const branding = await client.branding.tenant.get();
     * if (!branding.is_complete) {
     *   console.log('Missing fields:', branding.missing_fields);
     * }
     * ```
     */
    get: (requestOptions?: RequestOptions): Promise<Branding> =>
      this.http.get<Branding>('/tenant/branding', undefined, requestOptions),

    /**
     * Update the tenant branding profile (PATCH — partial update)
     *
     * Only provided fields are updated. Pass `null` to clear a field.
     *
     * @param data - Branding fields to update
     * @param requestOptions - Per-request options
     * @returns Updated branding profile
     *
     * @example
     * ```typescript
     * const updated = await client.branding.tenant.update({
     *   brand_primary_color: '#0D47A1',
     *   brand_email_footer: 'Nouvelle mention légale...',
     * });
     * ```
     */
    update: (
      data: UpdateBrandingInput,
      requestOptions?: RequestOptions
    ): Promise<Branding> =>
      this.http.patch<Branding>('/tenant/branding', data, requestOptions),

    /**
     * Get a pre-signed S3 URL for uploading the tenant brand logo
     *
     * The workflow is:
     * 1. Call `uploadLogo(mimeType)` to get `upload_url` + `public_url`
     * 2. PUT the binary file content to `upload_url`
     * 3. Call `update({ brand_logo_url: public_url })` to persist
     *
     * @param mimeType - MIME type of the file, e.g. `'image/png'`
     * @param requestOptions - Per-request options
     * @returns Pre-signed upload URL + final public URL
     *
     * @example
     * ```typescript
     * const { upload_url, public_url } = await client.branding.tenant.uploadLogo('image/png');
     * await fetch(upload_url, { method: 'PUT', body: logoBuffer, headers: { 'Content-Type': 'image/png' } });
     * await client.branding.tenant.update({ brand_logo_url: public_url });
     * ```
     */
    uploadLogo: (
      mimeType: string,
      requestOptions?: RequestOptions
    ): Promise<BrandingLogoUploadUrlResponse> =>
      this.http.post<BrandingLogoUploadUrlResponse>(
        '/tenant/branding/logo-upload-url',
        { mime_type: mimeType } satisfies BrandingLogoUploadUrlInput,
        requestOptions
      ),
  };

  /** Sub-tenant-level branding operations */
  readonly subTenants = {
    /**
     * Get the branding profile for a sub-tenant
     *
     * @param subTenantId - Sub-tenant UUID
     * @param requestOptions - Per-request options
     * @returns Sub-tenant branding profile
     *
     * @example
     * ```typescript
     * const branding = await client.branding.subTenants.get('sub-tenant-uuid');
     * console.log('Is complete:', branding.is_complete);
     * ```
     */
    get: (
      subTenantId: string,
      requestOptions?: RequestOptions
    ): Promise<Branding> =>
      this.http.get<Branding>(
        `/sub-tenants/${subTenantId}/branding`,
        undefined,
        requestOptions
      ),

    /**
     * Update the branding profile for a sub-tenant (PATCH — partial update)
     *
     * @param subTenantId - Sub-tenant UUID
     * @param data - Branding fields to update
     * @param requestOptions - Per-request options
     * @returns Updated sub-tenant branding profile
     *
     * @example
     * ```typescript
     * await client.branding.subTenants.update('sub-tenant-uuid', {
     *   brand_primary_color: '#2E7D32',
     *   brand_email_signature: "L'équipe Franchise Sud-Ouest",
     * });
     * ```
     */
    update: (
      subTenantId: string,
      data: UpdateBrandingInput,
      requestOptions?: RequestOptions
    ): Promise<Branding> =>
      this.http.patch<Branding>(
        `/sub-tenants/${subTenantId}/branding`,
        data,
        requestOptions
      ),

    /**
     * Get a pre-signed S3 URL for uploading a sub-tenant brand logo
     *
     * @param subTenantId - Sub-tenant UUID
     * @param mimeType - MIME type of the file, e.g. `'image/png'`
     * @param requestOptions - Per-request options
     * @returns Pre-signed upload URL + final public URL
     *
     * @example
     * ```typescript
     * const { upload_url, public_url } = await client.branding.subTenants.uploadLogo(
     *   'sub-tenant-uuid',
     *   'image/svg+xml'
     * );
     * await fetch(upload_url, { method: 'PUT', body: svgBuffer });
     * await client.branding.subTenants.update('sub-tenant-uuid', { brand_logo_url: public_url });
     * ```
     */
    uploadLogo: (
      subTenantId: string,
      mimeType: string,
      requestOptions?: RequestOptions
    ): Promise<BrandingLogoUploadUrlResponse> =>
      this.http.post<BrandingLogoUploadUrlResponse>(
        `/sub-tenants/${subTenantId}/branding/logo-upload-url`,
        { mime_type: mimeType } satisfies BrandingLogoUploadUrlInput,
        requestOptions
      ),
  };
}

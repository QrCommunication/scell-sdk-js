/**
 * Branding Resource
 *
 * Wraps the branding endpoints for both tenant and sub-tenant scopes:
 *
 * Tenant:
 *   GET    /api/v1/branding/tenant
 *   PUT    /api/v1/branding/tenant
 *   PATCH  /api/v1/branding/tenant
 *   POST   /api/v1/branding/tenant/logo-upload-url
 *   GET    /api/v1/branding/tenant/preview
 *
 * Sub-tenant:
 *   GET    /api/v1/branding/sub-tenants/{id}
 *   PUT    /api/v1/branding/sub-tenants/{id}
 *   PATCH  /api/v1/branding/sub-tenants/{id}
 *   POST   /api/v1/branding/sub-tenants/{id}/logo-upload-url
 *   GET    /api/v1/branding/sub-tenants/{id}/preview
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
 * const { url, public_url } = await client.branding.tenant.uploadLogo('image/png');
 *
 * // 2. Upload the logo directly to S3 (browser or Node.js)
 * await fetch(url, { method: 'PUT', body: logoFileOrBuffer });
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
      this.http.get<Branding>('/branding/tenant', undefined, requestOptions),

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
      this.http.patch<Branding>('/branding/tenant', data, requestOptions),

    /**
     * Get a pre-signed S3 URL for uploading the tenant brand logo
     *
     * The workflow is:
     * 1. Call `uploadLogo(mimeType)` to get `url` + `public_url`
     * 2. PUT the binary file content to `url`
     * 3. Call `update({ brand_logo_url: public_url })` to persist
     *
     * @param mimeType - MIME type of the file, e.g. `'image/png'`
     * @param requestOptions - Per-request options
     * @returns Pre-signed upload URL + final public URL
     *
     * @example
     * ```typescript
     * const { url, public_url } = await client.branding.tenant.uploadLogo('image/png');
     * await fetch(url, { method: 'PUT', body: logoBuffer, headers: { 'Content-Type': 'image/png' } });
     * await client.branding.tenant.update({ brand_logo_url: public_url });
     * ```
     */
    uploadLogo: (
      mimeType: string,
      requestOptions?: RequestOptions
    ): Promise<BrandingLogoUploadUrlResponse> =>
      this.http.post<BrandingLogoUploadUrlResponse>(
        '/branding/tenant/logo-upload-url',
        { mime_type: mimeType } satisfies BrandingLogoUploadUrlInput,
        requestOptions
      ),

    /**
     * Render a live HTML preview of how a branded email will look with the
     * current tenant branding profile.
     *
     * Returns the rendered HTML as a string. Pass `Accept: application/pdf`
     * via `requestOptions.headers` to request a PDF rendition instead — the
     * body is then returned as a (binary) string.
     *
     * @param requestOptions - Per-request options (use `headers.Accept` to negotiate format)
     * @returns Rendered email preview as HTML (string)
     *
     * @example
     * ```typescript
     * const html = await client.branding.tenant.preview();
     * // e.g. render `html` in an <iframe srcDoc={html} /> for a live preview
     * ```
     */
    preview: (requestOptions?: RequestOptions): Promise<string> =>
      this.http.getText('/branding/tenant/preview', undefined, requestOptions),
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
        `/branding/sub-tenants/${subTenantId}`,
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
        `/branding/sub-tenants/${subTenantId}`,
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
     * const { url, public_url } = await client.branding.subTenants.uploadLogo(
     *   'sub-tenant-uuid',
     *   'image/svg+xml'
     * );
     * await fetch(url, { method: 'PUT', body: svgBuffer });
     * await client.branding.subTenants.update('sub-tenant-uuid', { brand_logo_url: public_url });
     * ```
     */
    uploadLogo: (
      subTenantId: string,
      mimeType: string,
      requestOptions?: RequestOptions
    ): Promise<BrandingLogoUploadUrlResponse> =>
      this.http.post<BrandingLogoUploadUrlResponse>(
        `/branding/sub-tenants/${subTenantId}/logo-upload-url`,
        { mime_type: mimeType } satisfies BrandingLogoUploadUrlInput,
        requestOptions
      ),

    /**
     * Render a live HTML preview of how a branded email will look with a
     * sub-tenant's branding profile.
     *
     * Returns the rendered HTML as a string. Pass `Accept: application/pdf`
     * via `requestOptions.headers` to request a PDF rendition instead.
     *
     * @param subTenantId - Sub-tenant UUID
     * @param requestOptions - Per-request options (use `headers.Accept` to negotiate format)
     * @returns Rendered email preview as HTML (string)
     *
     * @example
     * ```typescript
     * const html = await client.branding.subTenants.preview('sub-tenant-uuid');
     * ```
     */
    preview: (
      subTenantId: string,
      requestOptions?: RequestOptions
    ): Promise<string> =>
      this.http.getText(
        `/branding/sub-tenants/${subTenantId}/preview`,
        undefined,
        requestOptions
      ),
  };
}

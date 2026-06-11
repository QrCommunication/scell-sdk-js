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
 *   POST   /api/v1/branding/tenant/logo
 *   GET    /api/v1/branding/tenant/preview
 *
 * Sub-tenant:
 *   GET    /api/v1/branding/sub-tenants/{id}
 *   PUT    /api/v1/branding/sub-tenants/{id}
 *   PATCH  /api/v1/branding/sub-tenants/{id}
 *   POST   /api/v1/branding/sub-tenants/{id}/logo-upload-url
 *   POST   /api/v1/branding/sub-tenants/{id}/logo
 *   GET    /api/v1/branding/sub-tenants/{id}/preview
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  Branding,
  BrandingLogoUploadUrlInput,
  BrandingLogoUploadUrlResponse,
  BrandingPreviewOverrides,
  UpdateBrandingInput,
} from '../types/branding.js';

/**
 * Build a multipart FormData with the logo file under the `logo` field.
 *
 * @internal
 */
function buildLogoFormData(
  logo: Blob | File | Uint8Array,
  filename: string
): FormData {
  const formData = new FormData();
  if (logo instanceof Uint8Array) {
    // Node : wrap Uint8Array into Blob (Node 18+ supports Blob globally)
    formData.append('logo', new Blob([logo]), filename);
  } else if (logo instanceof File) {
    formData.append('logo', logo);
  } else {
    formData.append('logo', logo, filename);
  }
  return formData;
}

/**
 * Serialize preview overrides into a query record, skipping undefined keys.
 *
 * @internal
 */
function buildPreviewQuery(
  overrides?: BrandingPreviewOverrides
): Record<string, string> | undefined {
  if (!overrides) {
    return undefined;
  }
  const params = new URLSearchParams();
  if (overrides.brand_primary_color !== undefined) {
    params.set('brand_primary_color', overrides.brand_primary_color);
  }
  if (overrides.brand_email_footer !== undefined) {
    params.set('brand_email_footer', overrides.brand_email_footer);
  }
  if (overrides.brand_email_signature !== undefined) {
    params.set('brand_email_signature', overrides.brand_email_signature);
  }
  if (overrides.brand_logo_url !== undefined) {
    params.set('brand_logo_url', overrides.brand_logo_url);
  }
  const query = Object.fromEntries(params.entries());
  return Object.keys(query).length > 0 ? query : undefined;
}

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
     * Upload the tenant email logo DIRECTLY (multipart) — single-call
     * alternative to the pre-signed flow ({@link BrandingResource.tenant.uploadLogo}).
     *
     * Accepted formats: jpeg, png, webp, svg/svgz. Max 2 MB.
     * The logo is stored and persisted on the branding profile in one call.
     *
     * @param logo - File / Blob / Uint8Array to upload
     * @param filename - Optional filename (defaults to `"logo"`)
     * @param requestOptions - Per-request options
     * @returns The updated branding profile (flat object, same shape as `tenant.get()`)
     *
     * @since 3.2.0
     *
     * @example
     * ```typescript
     * const branding = await client.branding.tenant.uploadLogoFile(file);
     * console.log('New logo URL:', branding.brand_logo_url);
     * ```
     */
    uploadLogoFile: (
      logo: Blob | File | Uint8Array,
      filename = 'logo',
      requestOptions?: RequestOptions
    ): Promise<Branding> =>
      this.http.postFormData<Branding>(
        '/branding/tenant/logo',
        buildLogoFormData(logo, filename),
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
     * Optionally pass `overrides` to replace stored branding values FOR THE
     * RENDER ONLY (nothing is persisted) — useful for live editor previews.
     *
     * @param overrides - Non-persisted branding overrides (query string). @since 3.2.0
     * @param requestOptions - Per-request options (use `headers.Accept` to negotiate format)
     * @returns Rendered email preview as HTML (string)
     *
     * @example
     * ```typescript
     * const html = await client.branding.tenant.preview();
     * // e.g. render `html` in an <iframe srcDoc={html} /> for a live preview
     *
     * // Live preview while editing — nothing is saved:
     * const draft = await client.branding.tenant.preview({
     *   brand_primary_color: '#FF5722',
     *   brand_email_signature: "L'équipe Nouvelle Marque",
     * });
     * ```
     */
    preview: (
      overrides?: BrandingPreviewOverrides,
      requestOptions?: RequestOptions
    ): Promise<string> =>
      this.http.getText(
        '/branding/tenant/preview',
        buildPreviewQuery(overrides),
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
     * Upload a sub-tenant email logo DIRECTLY (multipart) — single-call
     * alternative to the pre-signed flow. The sub-tenant must belong to the
     * current tenant (404 otherwise, anti-IDOR).
     *
     * Accepted formats: jpeg, png, webp, svg/svgz. Max 2 MB.
     *
     * @param subTenantId - Sub-tenant UUID
     * @param logo - File / Blob / Uint8Array to upload
     * @param filename - Optional filename (defaults to `"logo"`)
     * @param requestOptions - Per-request options
     * @returns The updated branding profile (flat object, same shape as `subTenants.get()`)
     *
     * @since 3.2.0
     *
     * @example
     * ```typescript
     * const branding = await client.branding.subTenants.uploadLogoFile(
     *   'sub-tenant-uuid',
     *   logoBlob
     * );
     * ```
     */
    uploadLogoFile: (
      subTenantId: string,
      logo: Blob | File | Uint8Array,
      filename = 'logo',
      requestOptions?: RequestOptions
    ): Promise<Branding> =>
      this.http.postFormData<Branding>(
        `/branding/sub-tenants/${subTenantId}/logo`,
        buildLogoFormData(logo, filename),
        requestOptions
      ),

    /**
     * Render a live HTML preview of how a branded email will look with a
     * sub-tenant's branding profile.
     *
     * Returns the rendered HTML as a string. Pass `Accept: application/pdf`
     * via `requestOptions.headers` to request a PDF rendition instead.
     *
     * Optionally pass `overrides` to replace stored branding values FOR THE
     * RENDER ONLY (nothing is persisted) — useful for live editor previews.
     *
     * @param subTenantId - Sub-tenant UUID
     * @param overrides - Non-persisted branding overrides (query string). @since 3.2.0
     * @param requestOptions - Per-request options (use `headers.Accept` to negotiate format)
     * @returns Rendered email preview as HTML (string)
     *
     * @example
     * ```typescript
     * const html = await client.branding.subTenants.preview('sub-tenant-uuid');
     *
     * // Live preview while editing — nothing is saved:
     * const draft = await client.branding.subTenants.preview('sub-tenant-uuid', {
     *   brand_primary_color: '#2E7D32',
     * });
     * ```
     */
    preview: (
      subTenantId: string,
      overrides?: BrandingPreviewOverrides,
      requestOptions?: RequestOptions
    ): Promise<string> =>
      this.http.getText(
        `/branding/sub-tenants/${subTenantId}/preview`,
        buildPreviewQuery(overrides),
        requestOptions
      ),
  };
}

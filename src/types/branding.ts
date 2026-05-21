/**
 * Branding types for Scell.io SDK
 *
 * Branding configuration controls how emails sent from the platform
 * (invoice delivery, signature requests, reminders) look to recipients.
 * Each tenant and each sub-tenant can maintain their own branding profile.
 *
 * Branding is applied to email sends only — it does not affect the
 * Factur-X XML / PDF invoice content (which uses the separate `logo_url`
 * field on the Company model).
 *
 * @packageDocumentation
 */

import type { DateTimeString, UUID } from './common.js';

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

/**
 * A branding profile scoped to a tenant or sub-tenant.
 *
 * When `is_complete` is `true`, all four mandatory fields
 * (`brand_logo_url`, `brand_primary_color`, `brand_email_footer`,
 * `brand_email_signature`) are set. Incomplete branding automatically
 * falls back to the Scell.io default branding on email sends.
 */
export interface Branding {
  /** Scope of this branding profile */
  scope: 'tenant' | 'sub_tenant';
  /** UUID of the Company record that stores these branding columns */
  company_id: UUID;
  /**
   * HTTPS URL to the brand logo image (PNG/SVG recommended, max 1 MB).
   * Distinct from `Company.logo_url` (which is used in Factur-X PDFs).
   * Falls back to `logo_url` when `brand_logo_url` is null.
   */
  brand_logo_url: string | null;
  /**
   * Primary brand color in 6-digit hex format, e.g. `"#1A73E8"`.
   * Used for email button and header backgrounds.
   */
  brand_primary_color: string | null;
  /**
   * Legal/contact footer text displayed at the bottom of every email.
   * Typically: company name, address, SIRET, VAT number.
   */
  brand_email_footer: string | null;
  /**
   * Signature block appended after the email body.
   * E.g. "L'équipe Société XYZ".
   */
  brand_email_signature: string | null;
  /**
   * `true` when all four mandatory branding fields are non-null.
   * When `false`, email sends fall back to Scell.io default branding.
   */
  is_complete: boolean;
  /**
   * List of field names that are still null (empty when `is_complete = true`).
   * Helps surfacing actionable guidance in the dashboard UI.
   */
  missing_fields: string[];
  updated_at: DateTimeString;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Payload for updating a branding profile (PATCH semantics — partial update).
 * All fields are optional; only provided fields will be updated.
 */
export interface UpdateBrandingInput {
  brand_logo_url?: string | null | undefined;
  brand_primary_color?: string | null | undefined;
  brand_email_footer?: string | null | undefined;
  brand_email_signature?: string | null | undefined;
}

// ---------------------------------------------------------------------------
// Logo upload
// ---------------------------------------------------------------------------

/**
 * Request payload for obtaining a pre-signed S3 upload URL.
 */
export interface BrandingLogoUploadUrlInput {
  /**
   * MIME type of the file to upload (e.g. `"image/png"`, `"image/svg+xml"`).
   */
  mime_type: string;
}

/**
 * Response containing the pre-signed S3 upload URL.
 * The client must issue a PUT request directly to `upload_url`
 * with the binary file content and the specified headers.
 *
 * After a successful upload, persist the resulting `public_url`
 * via `BrandingResource.tenant.update()` or `BrandingResource.subTenants.update()`.
 */
export interface BrandingLogoUploadUrlResponse {
  /** Pre-signed URL — issue a PUT request to this URL with the file body */
  upload_url: string;
  /** Public URL of the uploaded file once the PUT succeeds */
  public_url: string;
  /** ISO timestamp when the pre-signed URL expires (typically 5 minutes) */
  expires_at: DateTimeString;
}

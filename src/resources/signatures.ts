/**
 * Signatures Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  MessageWithDataResponse,
  PaginatedResponse,
  SingleResponse,
} from '../types/common.js';
import type { AuditTrailResponse } from '../types/invoices.js';
import type {
  CreateSignatureInput,
  Signature,
  SignatureDownloadResponse,
  SignatureDownloadType,
  SignatureListOptions,
  SignatureRemindResponse,
} from '../types/signatures.js';

/**
 * Signatures API resource
 *
 * @example
 * ```typescript
 * // Create a signature request
 * const signature = await client.signatures.create({
 *   title: 'Employment Contract',
 *   document: btoa(pdfContent), // Base64 encoded
 *   document_name: 'contract.pdf',
 *   signers: [{
 *     first_name: 'John',
 *     last_name: 'Doe',
 *     email: 'john@example.com',
 *     auth_method: 'email'
 *   }]
 * });
 *
 * // Send reminder
 * await client.signatures.remind(signature.id);
 * ```
 */
export class SignaturesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List signature requests with optional filtering.
   *
   * Scoped to the authenticated tenant. Available under both Sanctum
   * (dashboard) and API key authentication (`sk_live_*` / `sk_test_*`).
   *
   * Filters:
   * - `status` — restrict by signature status.
   * - `environment` — `'production'` or `'sandbox'`.
   * - `company_id` — restrict to a specific company of the tenant.
   * - `sub_tenant_id` — restrict to one sub-tenant of the current
   *   tenant (anti-IDOR enforced server-side).
   * - `per_page` — max 100.
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of signatures
   *
   * @example
   * ```typescript
   * const { data, meta } = await client.signatures.list({
   *   status: 'pending',
   *   sub_tenant_id: 'sub-tenant-uuid',
   *   per_page: 25
   * });
   * console.log(`${meta.total} pending signatures`);
   * ```
   */
  async list(
    options: SignatureListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Signature>> {
    return this.http.get<PaginatedResponse<Signature>>(
      '/signatures',
      options as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Get a specific signature by ID
   *
   * @param id - Signature UUID
   * @param requestOptions - Request options
   * @returns Signature details with signers
   *
   * @example
   * ```typescript
   * const { data: signature } = await client.signatures.get('uuid-here');
   * signature.signers?.forEach(signer => {
   *   console.log(`${signer.full_name}: ${signer.status}`);
   * });
   * ```
   */
  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Signature>> {
    return this.http.get<SingleResponse<Signature>>(
      `/signatures/${id}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create a new signature request
   *
   * Note: This endpoint requires API key authentication.
   * Creating a signature in production mode will debit your balance.
   *
   * @param input - Signature creation data
   * @param requestOptions - Request options
   * @returns Created signature
   *
   * @example
   * ```typescript
   * import { readFileSync } from 'fs';
   *
   * const pdfContent = readFileSync('contract.pdf');
   * const { data: signature } = await client.signatures.create({
   *   title: 'Service Agreement',
   *   description: 'Annual service contract',
   *   document: pdfContent.toString('base64'),
   *   document_name: 'contract.pdf',
   *   signers: [
   *     {
   *       first_name: 'Alice',
   *       last_name: 'Smith',
   *       email: 'alice@example.com',
   *       auth_method: 'email',
   *       message: 'Bonjour Alice, merci de signer ce contrat. Code OTP: {OTP}'
   *     },
   *     {
   *       first_name: 'Bob',
   *       last_name: 'Jones',
   *       phone: '+33612345678',
   *       auth_method: 'sms'
   *     }
   *   ],
   *   // signer_index (0-base) cible chaque position au bon signataire.
   *   // Un signataire peut avoir plusieurs positions (capacite EU-SES).
   *   signature_positions: [
   *     { signer_index: 0, page: 1, x: 70, y: 85, width: 20, height: 5, unit: 'percent' }, // Alice — page 1
   *     { signer_index: 0, page: 2, x: 70, y: 85, width: 20, height: 5, unit: 'percent' }, // Alice — page 2
   *     { signer_index: 1, page: 2, x: 20, y: 85, width: 20, height: 5, unit: 'percent' }  // Bob — page 2
   *   ],
   *   ui_config: {
   *     sidebar_logo: 'https://mycompany.com/logo.png',
   *     sidebar_background_color: '#3b82f6',
   *     sidebar_title_color: '#ffffff',
   *     sign_button_background_color: '#10b981',
   *     hide_download_validated: false,
   *     iframe_ancestors: ['https://myapp.com']
   *   },
   *   signature_options: {
   *     signature_mode: 'both',
   *     signer_must_read: true,
   *     user_editable_data: { name: false, email: false, mobile: true },
   *     timezone: 'Europe/Paris'
   *   },
   *   redirect_complete_url: 'https://myapp.com/signed',
   *   redirect_cancel_url: 'https://myapp.com/cancelled'
   * });
   *
   * // Send signing URLs to signers
   * signature.signers?.forEach(signer => {
   *   console.log(`${signer.email}: ${signer.signing_url}`);
   * });
   * ```
   */
  async create(
    input: CreateSignatureInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Signature>> {
    return this.http.post<MessageWithDataResponse<Signature>>(
      '/signatures',
      input,
      requestOptions
    );
  }

  /**
   * Download signature files
   *
   * @param id - Signature UUID
   * @param type - File type to download
   * @param requestOptions - Request options
   * @returns Temporary download URL
   *
   * @example
   * ```typescript
   * // Download signed document
   * const { url } = await client.signatures.download(
   *   'signature-uuid',
   *   'signed'
   * );
   *
   * // Download audit trail (proof file)
   * const { url: auditUrl } = await client.signatures.download(
   *   'signature-uuid',
   *   'audit_trail'
   * );
   * ```
   */
  async download(
    id: string,
    type: SignatureDownloadType,
    requestOptions?: RequestOptions
  ): Promise<SignatureDownloadResponse> {
    return this.http.get<SignatureDownloadResponse>(
      `/signatures/${id}/download/${type}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Send reminder to pending signers
   *
   * @param id - Signature UUID
   * @param requestOptions - Request options
   * @returns Number of signers reminded
   *
   * @example
   * ```typescript
   * const { signers_reminded } = await client.signatures.remind('uuid');
   * console.log(`Reminded ${signers_reminded} signers`);
   * ```
   */
  async remind(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SignatureRemindResponse> {
    return this.http.post<SignatureRemindResponse>(
      `/signatures/${id}/remind`,
      undefined,
      requestOptions
    );
  }

  /**
   * Cancel a signature request
   *
   * Note: Cannot cancel completed signatures.
   *
   * @param id - Signature UUID
   * @param requestOptions - Request options
   * @returns Cancellation confirmation
   *
   * @example
   * ```typescript
   * await client.signatures.cancel('signature-uuid');
   * console.log('Signature cancelled');
   * ```
   */
  async cancel(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      `/signatures/${id}/cancel`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get signature audit trail (JSON)
   *
   * Returns the complete history of actions on the signature:
   * creation, delivery, opening, signing, refusal, etc.
   *
   * @param id - Signature UUID
   * @param requestOptions - Request options
   * @returns Audit trail entries with integrity validation
   *
   * @example
   * ```typescript
   * const { data: entries, integrity_valid } = await client.signatures.auditTrail(
   *   'signature-uuid'
   * );
   *
   * if (integrity_valid) {
   *   entries.forEach(e => console.log(e.action, e.created_at));
   * }
   * ```
   */
  async auditTrail(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<AuditTrailResponse> {
    return this.http.get<AuditTrailResponse>(
      `/signatures/${id}/audit-trail`,
      undefined,
      requestOptions
    );
  }
}

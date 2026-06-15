/**
 * Invoice Templates resource.
 *
 * @since 1.15.0
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  CreateInvoiceTemplateInput,
  DerivedColorPalette,
  InvoiceTemplate,
  InvoiceTemplateListOptions,
  InvoiceTemplatePreviewParams,
  UpdateInvoiceTemplateInput,
} from '../types/invoice-templates.js';
import type { PaginatedResponse, UUID } from '../types/common.js';

export class InvoiceTemplatesResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * List templates accessible to the current context (tenant + system).
   */
  async list(options: InvoiceTemplateListOptions = {}): Promise<PaginatedResponse<InvoiceTemplate>> {
    return this.client.get<PaginatedResponse<InvoiceTemplate>>('invoice-templates', options as Record<string, string | number | boolean | undefined>);
  }

  async get(id: UUID): Promise<InvoiceTemplate> {
    const res = await this.client.get<{ data: InvoiceTemplate }>(`invoice-templates/${id}`);
    return res.data;
  }

  async create(input: CreateInvoiceTemplateInput): Promise<InvoiceTemplate> {
    const res = await this.client.post<{ data: InvoiceTemplate }>('invoice-templates', input);
    return res.data;
  }

  async update(id: UUID, input: UpdateInvoiceTemplateInput): Promise<InvoiceTemplate> {
    const res = await this.client.patch<{ data: InvoiceTemplate }>(`invoice-templates/${id}`, input);
    return res.data;
  }

  async delete(id: UUID): Promise<void> {
    await this.client.delete(`invoice-templates/${id}`);
  }

  /**
   * Mark a template as default for its scope.
   */
  async markDefault(id: UUID): Promise<InvoiceTemplate> {
    const res = await this.client.put<{ data: InvoiceTemplate }>(`invoice-templates/${id}/default`);
    return res.data;
  }

  /**
   * Upload a logo for the template.
   *
   * Accepted formats: jpeg, png, webp, svg/svgz. Max 2MB.
   * The logo is stored on S3 with public ACL, scoped per tenant.
   *
   * @param id - Template UUID
   * @param logo - File / Blob / Buffer to upload
   * @param filename - Optional filename (defaults to "logo")
   * @returns The updated template with new logo_url
   *
   * @since 1.18.0
   */
  async uploadLogo(
    id: UUID,
    logo: Blob | File | Uint8Array,
    filename = 'logo'
  ): Promise<InvoiceTemplate> {
    const formData = new FormData();
    if (logo instanceof Uint8Array) {
      // Node : wrap Uint8Array into Blob (Node 18+ supports Blob globally)
      formData.append('logo', new Blob([logo]), filename);
    } else if (logo instanceof File) {
      formData.append('logo', logo);
    } else {
      formData.append('logo', logo, filename);
    }
    const res = await this.client.postFormData<{ data: InvoiceTemplate }>(
      `invoice-templates/${id}/logo`,
      formData
    );
    return res.data;
  }

  /**
   * Derive primary/accent colors from the tenant email logo and apply them
   * to the default invoice template.
   *
   * `POST /invoice-templates/derive-colors-from-email-logo` (no body).
   * The default tenant template is created on the fly if it doesn't exist.
   *
   * @returns The updated (or freshly created) default template
   * @throws {ScellNotFoundError} 404 when the tenant has no email logo
   * @throws {ScellValidationError} 422 when the logo is unreachable or its colors are too neutral
   *
   * @since 3.2.0
   *
   * @example
   * ```typescript
   * const template = await client.invoiceTemplates.deriveColorsFromEmailLogo();
   * console.log(template.primary_color, template.accent_color);
   * ```
   */
  async deriveColorsFromEmailLogo(): Promise<InvoiceTemplate> {
    const res = await this.client.post<{ data: InvoiceTemplate }>(
      'invoice-templates/derive-colors-from-email-logo'
    );
    return res.data;
  }

  /**
   * Derive primary/accent colors from the tenant **invoice** logo and return
   * the palette WITHOUT persisting it.
   *
   * `POST /invoice-templates/derive-colors-from-invoice-logo` (no body).
   * Unlike {@link deriveColorsFromEmailLogo} (which applies the palette to the
   * template), this endpoint is meant for the LIVE update of an invoice
   * branding form: the user tweaks the suggested colors then saves them
   * himself via {@link update}.
   *
   * @returns The derived `{ primary_color, accent_color }` palette (not persisted)
   * @throws {ScellNotFoundError} 404 when the tenant is unknown or has no invoice logo
   * @throws {ScellValidationError} 422 when the logo is unreachable or its colors are too neutral
   *
   * @since 3.5.0
   *
   * @example
   * ```typescript
   * const palette = await client.invoiceTemplates.deriveColorsFromInvoiceLogo();
   * console.log(palette.primary_color, palette.accent_color);
   * ```
   */
  async deriveColorsFromInvoiceLogo(): Promise<DerivedColorPalette> {
    const res = await this.client.post<{ data: DerivedColorPalette }>(
      'invoice-templates/derive-colors-from-invoice-logo'
    );
    return res.data;
  }

  /**
   * Render a preview of a sample invoice with a given branding (HTML or PDF).
   *
   * `GET /invoice-templates/preview` — any branding field left out falls back
   * to the tenant's resolved default template (cascade explicit > sub_tenant >
   * tenant > system). Useful for live previewing unsaved branding changes.
   *
   * Returns the RAW content: HTML (`text/html`, default) as a string, or a PDF
   * `ArrayBuffer` (`application/pdf`) when `params.format === 'pdf'`. For the
   * HTML output, inject the result into an `<iframe srcdoc="...">`.
   *
   * @param params - Non-persisted branding overrides + output format
   * @param requestOptions - Per-request options
   * @returns HTML `string` (default) or a PDF `ArrayBuffer` when `format === 'pdf'`
   * @throws {ScellValidationError} 422 when a hex color or the logo URL is invalid
   *
   * @since 3.5.0
   *
   * @example
   * ```typescript
   * // HTML preview for an iframe
   * const html = await client.invoiceTemplates.preview({
   *   primary_color: '#0F4C81',
   *   logo_url: 'https://cdn.client.com/logo.svg',
   * });
   *
   * // Binary PDF preview
   * const pdf = await client.invoiceTemplates.preview({ format: 'pdf' });
   * // Node: writeFileSync('apercu.pdf', Buffer.from(pdf as ArrayBuffer));
   * ```
   */
  async preview(
    params: InvoiceTemplatePreviewParams = {},
    requestOptions?: RequestOptions
  ): Promise<string | ArrayBuffer> {
    const query = params as Record<string, string | number | boolean | undefined>;
    if (params.format === 'pdf') {
      return this.client.getRaw('invoice-templates/preview', query, requestOptions);
    }
    return this.client.getText('invoice-templates/preview', query, requestOptions);
  }
}

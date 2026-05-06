/**
 * Invoice Templates resource.
 *
 * @since 1.15.0
 */

import type { HttpClient } from '../client.js';
import type {
  CreateInvoiceTemplateInput,
  InvoiceTemplate,
  InvoiceTemplateListOptions,
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
}

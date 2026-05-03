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
}

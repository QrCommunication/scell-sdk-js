/**
 * Invoice Templates resource.
 *
 * @since 1.15.0
 */

import type { HttpClient } from '../http/client';
import type {
  CreateInvoiceTemplateInput,
  InvoiceTemplate,
  InvoiceTemplateListOptions,
  UpdateInvoiceTemplateInput,
} from '../types/invoice-templates';
import type { Paginated, UUID } from '../types/common';

export class InvoiceTemplatesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List templates accessible to the current context (tenant + system).
   */
  async list(options: InvoiceTemplateListOptions = {}): Promise<Paginated<InvoiceTemplate>> {
    return this.http.get<Paginated<InvoiceTemplate>>('invoice-templates', {
      query: options as Record<string, unknown>,
    });
  }

  async get(id: UUID): Promise<InvoiceTemplate> {
    const res = await this.http.get<{ data: InvoiceTemplate }>(`invoice-templates/${id}`);
    return res.data;
  }

  async create(input: CreateInvoiceTemplateInput): Promise<InvoiceTemplate> {
    const res = await this.http.post<{ data: InvoiceTemplate }>('invoice-templates', input);
    return res.data;
  }

  async update(id: UUID, input: UpdateInvoiceTemplateInput): Promise<InvoiceTemplate> {
    const res = await this.http.patch<{ data: InvoiceTemplate }>(`invoice-templates/${id}`, input);
    return res.data;
  }

  async delete(id: UUID): Promise<void> {
    await this.http.delete(`invoice-templates/${id}`);
  }

  /**
   * Mark a template as default for its scope.
   */
  async markDefault(id: UUID): Promise<InvoiceTemplate> {
    const res = await this.http.put<{ data: InvoiceTemplate }>(`invoice-templates/${id}/default`);
    return res.data;
  }
}

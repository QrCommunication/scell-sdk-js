/**
 * Suppliers Resource — scoped supplier registry (tenant + sub_tenant).
 *
 * Mirrors {@link BuyersResource} for vendors. Unlike buyers, suppliers carry no
 * shipping address, no dedicated billing email, and no VAT-context resolution
 * (those are buyer-only concepts).
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  Supplier,
  CreateSupplierInput,
  ListSuppliersInput,
  UpdateSupplierInput,
} from '../types/suppliers.js';

/**
 * Suppliers API resource.
 *
 * @example
 * ```typescript
 * // Register a supplier once, reuse it across incoming invoices
 * const supplier = await client.suppliers.create({
 *   name: 'Fournitures Express SARL',
 *   country: 'FR',
 *   siret: '98765432109876',
 *   billing_address: {
 *     line1: '5 Rue du Commerce',
 *     postal_code: '75015',
 *     city: 'Paris',
 *     country: 'FR',
 *   },
 * });
 * ```
 */
export class SuppliersResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    params?: ListSuppliersInput,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Supplier>> {
    return this.http.get<PaginatedResponse<Supplier>>(
      '/suppliers',
      params as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<Supplier> {
    const response = await this.http.get<SingleResponse<Supplier>>(
      `/suppliers/${id}`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  async create(
    input: CreateSupplierInput,
    requestOptions?: RequestOptions
  ): Promise<Supplier> {
    const response = await this.http.post<SingleResponse<Supplier>>(
      '/suppliers',
      input,
      requestOptions
    );
    return response.data;
  }

  async update(
    id: string,
    input: UpdateSupplierInput,
    requestOptions?: RequestOptions
  ): Promise<Supplier> {
    const response = await this.http.patch<SingleResponse<Supplier>>(
      `/suppliers/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  async delete(id: string, requestOptions?: RequestOptions): Promise<void> {
    await this.http.delete(`/suppliers/${id}`, requestOptions);
  }
}

/**
 * Buyers Resource — scoped buyer registry (tenant + sub_tenant).
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  Buyer,
  CreateBuyerInput,
  ListBuyersInput,
  UpdateBuyerInput,
} from '../types/buyers.js';

/**
 * Buyers API resource.
 *
 * @example
 * ```typescript
 * // Register a buyer once, reuse it on multiple invoices
 * const buyer = await client.buyers.create({
 *   name: 'Acme SAS',
 *   country: 'FR',
 *   siret: '12345678901234',
 *   billing_address: {
 *     line1: '1 Rue de la Paix',
 *     postal_code: '75001',
 *     city: 'Paris',
 *     country: 'FR',
 *   },
 *   shipping_address: {
 *     name: 'Entrepot Lyon',
 *     line1: '12 Avenue Saxe',
 *     postal_code: '69003',
 *     city: 'Lyon',
 *     country: 'FR',
 *   },
 * });
 *
 * await client.invoices.create({
 *   buyer_id: buyer.id, // snapshot taken at issuance
 *   // ... rest of invoice
 * });
 * ```
 */
export class BuyersResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    params?: ListBuyersInput,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Buyer>> {
    return this.http.get<PaginatedResponse<Buyer>>(
      '/buyers',
      params as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<Buyer> {
    const response = await this.http.get<SingleResponse<Buyer>>(
      `/buyers/${id}`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  async create(
    input: CreateBuyerInput,
    requestOptions?: RequestOptions
  ): Promise<Buyer> {
    const response = await this.http.post<SingleResponse<Buyer>>(
      '/buyers',
      input,
      requestOptions
    );
    return response.data;
  }

  async update(
    id: string,
    input: UpdateBuyerInput,
    requestOptions?: RequestOptions
  ): Promise<Buyer> {
    const response = await this.http.patch<SingleResponse<Buyer>>(
      `/buyers/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  async delete(id: string, requestOptions?: RequestOptions): Promise<void> {
    await this.http.delete(`/buyers/${id}`, requestOptions);
  }
}

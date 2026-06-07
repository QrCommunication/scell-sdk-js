/**
 * Suppliers Resource — read-mostly supplier registry (tenant + sub_tenant).
 *
 * **v3 breaking change**: Suppliers are now derived automatically from received
 * invoices (the invoice is the source of truth). `POST /suppliers` and
 * `DELETE /suppliers/{id}` have been removed from the API (HTTP 405).
 *
 * Only contact/enrichment fields (`email`, `phone`, `notes`, `metadata`) are
 * editable via `update()`. Identity fields (name, siret, country, address, …)
 * come from the received invoices and are read-only.
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  Supplier,
  ListSuppliersInput,
  UpdateSupplierInput,
} from '../types/suppliers.js';

/**
 * Suppliers API resource.
 *
 * @example
 * ```typescript
 * // List suppliers derived from received invoices
 * const { data: suppliers } = await client.suppliers.list({ q: 'Express' });
 *
 * // Enrich a supplier's contact info (only these fields are writable)
 * const updated = await client.suppliers.update(supplier.id, {
 *   email: 'contact@fournitures.fr',
 *   notes: 'Preferred vendor',
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

  /**
   * Update enrichment fields for a supplier.
   *
   * Only `email`, `phone`, `notes`, and `metadata` are accepted.
   * Identity fields (name, siret, country, billing_address, etc.) are
   * read-only and derived from received invoices — the server ignores them.
   */
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
}

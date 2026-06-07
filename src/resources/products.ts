/**
 * Products Resource — scoped product/service catalog (tenant + sub_tenant).
 *
 * Reuse a catalog product to pre-fill an invoice/quote line via `product_id`
 * without re-typing label, unit price and VAT rate. Like the buyer registry,
 * the catalog carries the *current* state of the article — mutating a product
 * never affects already-issued invoices (snapshot pattern, ISCA compliance).
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  CreateProductInput,
  ListProductsParams,
  Product,
  UpdateProductInput,
} from '../types/products.js';

/**
 * Products API resource.
 *
 * @example
 * ```typescript
 * // Register a product once, reuse it on multiple invoice lines
 * const product = await client.products.create({
 *   name: 'Consulting',
 *   unit_price_ht: 800,
 *   default_tax_rate: 20,
 *   unit: 'HUR',
 * });
 *
 * await client.invoices.create({
 *   lines: [{ product_id: product.id, quantity: 2 }],
 *   // ... rest of invoice
 * });
 * ```
 */
export class ProductsResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    params?: ListProductsParams,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(
      '/products',
      params as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<Product> {
    const response = await this.http.get<SingleResponse<Product>>(
      `/products/${id}`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  async create(
    input: CreateProductInput,
    requestOptions?: RequestOptions
  ): Promise<Product> {
    const response = await this.http.post<SingleResponse<Product>>(
      '/products',
      input,
      requestOptions
    );
    return response.data;
  }

  /**
   * Partially update a product (PATCH).
   */
  async update(
    id: string,
    input: UpdateProductInput,
    requestOptions?: RequestOptions
  ): Promise<Product> {
    const response = await this.http.patch<SingleResponse<Product>>(
      `/products/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  /**
   * Fully replace a product (PUT).
   */
  async replace(
    id: string,
    input: UpdateProductInput,
    requestOptions?: RequestOptions
  ): Promise<Product> {
    const response = await this.http.put<SingleResponse<Product>>(
      `/products/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  async delete(id: string, requestOptions?: RequestOptions): Promise<void> {
    await this.http.delete(`/products/${id}`, requestOptions);
  }
}

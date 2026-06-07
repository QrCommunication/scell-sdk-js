/**
 * Product Categories Resource — scoped catalog categories (tenant + sub_tenant).
 *
 * Categories group catalog products/services (see ./products.ts). The registry
 * is strictly scoped by (tenant, sub_tenant).
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  CreateProductCategoryInput,
  ListProductCategoriesParams,
  ProductCategory,
  UpdateProductCategoryInput,
} from '../types/product-categories.js';

/**
 * Product categories API resource.
 *
 * @example
 * ```typescript
 * const category = await client.productCategories.create({
 *   name: 'Consulting',
 *   color: '#0066FF',
 * });
 * ```
 */
export class ProductCategoriesResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    params?: ListProductCategoriesParams,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<ProductCategory>> {
    return this.http.get<PaginatedResponse<ProductCategory>>(
      '/product-categories',
      params as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<ProductCategory> {
    const response = await this.http.get<SingleResponse<ProductCategory>>(
      `/product-categories/${id}`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  async create(
    input: CreateProductCategoryInput,
    requestOptions?: RequestOptions
  ): Promise<ProductCategory> {
    const response = await this.http.post<SingleResponse<ProductCategory>>(
      '/product-categories',
      input,
      requestOptions
    );
    return response.data;
  }

  /**
   * Partially update a category (PATCH).
   */
  async update(
    id: string,
    input: UpdateProductCategoryInput,
    requestOptions?: RequestOptions
  ): Promise<ProductCategory> {
    const response = await this.http.patch<SingleResponse<ProductCategory>>(
      `/product-categories/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  /**
   * Fully replace a category (PUT).
   */
  async replace(
    id: string,
    input: UpdateProductCategoryInput,
    requestOptions?: RequestOptions
  ): Promise<ProductCategory> {
    const response = await this.http.put<SingleResponse<ProductCategory>>(
      `/product-categories/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  async delete(id: string, requestOptions?: RequestOptions): Promise<void> {
    await this.http.delete(`/product-categories/${id}`, requestOptions);
  }
}

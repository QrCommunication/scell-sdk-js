/**
 * Product category types (scoped tenant + sub_tenant).
 *
 * Categories group catalog products/services (see ./products.ts). The registry
 * is strictly scoped by (tenant, sub_tenant) — you only ever see the categories
 * of your own scope.
 *
 * @since 2.38.0
 */

import type { DateTimeString, UUID } from './common.js';

export interface ProductCategory {
  id: UUID;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  name: string;
  /** Hex color (#RRGGBB) used for UI badges, or null. */
  color: string | null;
  description: string | null;
  /** Display order (ascending). */
  position: number;
  /** Number of products filed under this category (when returned by the API). */
  products_count?: number;
  metadata: Record<string, unknown> | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export interface CreateProductCategoryInput {
  name: string;
  color?: string;
  description?: string;
  position?: number;
  metadata?: Record<string, unknown>;
}

export type UpdateProductCategoryInput = Partial<CreateProductCategoryInput>;

export interface ListProductCategoriesParams {
  q?: string;
  per_page?: number;
  page?: number;
}

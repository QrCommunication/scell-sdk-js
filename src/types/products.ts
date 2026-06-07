/**
 * Product catalog types (scoped tenant + sub_tenant).
 *
 * The catalog holds the *current* state of a reusable product/service (label,
 * unit price, default VAT rate, unit…). Reuse a product to pre-fill an invoice
 * or quote line via `product_id` without re-typing it. Like a Buyer, the
 * catalog carries the current state of the article — mutating a product never
 * affects already-issued invoices (snapshot pattern, ISCA fiscal compliance).
 *
 * @since 2.38.0
 */

import type { DateTimeString, UUID } from './common.js';
import type { ProductCategory } from './product-categories.js';

/** Fiscal revenue category of a catalog product. */
export type ProductRevenueCategory = 'goods' | 'service' | 'accommodation';

export interface Product {
  id: UUID;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  product_category_id: UUID | null;
  name: string;
  description: string | null;
  /** Stock-keeping unit / internal reference. */
  sku: string | null;
  /** Fiscal revenue category, or null if unspecified. */
  revenue_category: ProductRevenueCategory | null;
  /** Human-readable label for `revenue_category` (server-derived). */
  revenue_category_label: string | null;
  /** UN/ECE Rec 20 unit code (default `C62` — "one / unit"). */
  unit: string;
  /** Unit price excluding tax. */
  unit_price_ht: number;
  /** Default VAT rate (percentage, e.g. 20). */
  default_tax_rate: number;
  /** Default per-line discount rate (percentage), or null. */
  default_discount_rate: number | null;
  /** ISO 4217 currency code (default `EUR`). */
  currency: string;
  is_active: boolean;
  /** Nested category (eager-loaded) when returned by the API. */
  product_category: ProductCategory | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export interface CreateProductInput {
  name: string;
  unit_price_ht: number;
  product_category_id?: string;
  description?: string;
  sku?: string;
  revenue_category?: ProductRevenueCategory;
  /** UN/ECE Rec 20 unit code (default `C62`). */
  unit?: string;
  default_tax_rate?: number;
  default_discount_rate?: number;
  /** ISO 4217 currency code (default `EUR`). */
  currency?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
  notes?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface ListProductsParams {
  q?: string;
  revenue_category?: ProductRevenueCategory;
  product_category_id?: string;
  is_active?: boolean;
  per_page?: number;
  page?: number;
}

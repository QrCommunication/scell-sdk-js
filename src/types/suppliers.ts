/**
 * Supplier registry types (scoped tenant + sub_tenant).
 *
 * The Supplier registry holds the *current* state of a vendor's identity and
 * billing address. It mirrors the Buyer registry, minus the buyer-only
 * concepts (shipping address, dedicated billing email, VAT-context resolution),
 * which do not apply to suppliers.
 */

import type { Address, DateTimeString, UUID } from './common.js';

export interface Supplier {
  id: UUID;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  name: string;
  is_individual: boolean;
  siret: string | null;
  vat_number: string | null;
  legal_id: string | null;
  legal_id_scheme: string | null;
  email: string | null;
  phone: string | null;
  country: string;
  /** Billing address (BG-7 / BT-50..55). */
  billing_address: Address;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export interface CreateSupplierInput {
  name: string;
  country: string;
  billing_address: Address;
  is_individual?: boolean;
  siret?: string;
  vat_number?: string;
  legal_id?: string;
  legal_id_scheme?: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
  notes?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface ListSuppliersInput {
  q?: string;
  is_individual?: boolean;
  per_page?: number;
  page?: number;
}

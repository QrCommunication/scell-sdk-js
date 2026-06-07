/**
 * Supplier registry types (scoped tenant + sub_tenant).
 *
 * Suppliers are **derived automatically** from received invoices — the invoice
 * is the source of truth for identity fields (name, siret, vat_number,
 * legal_id, legal_id_scheme, country, billing_address, is_individual).
 * Only contact and enrichment fields (email, phone, notes, metadata) are
 * writable via `PATCH /suppliers/{id}`.
 *
 * POST /suppliers and DELETE /suppliers/{id} are removed from the API (405).
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

/**
 * Enrichment-only fields accepted by `PATCH /suppliers/{id}`.
 *
 * Identity fields (name, siret, vat_number, legal_id, legal_id_scheme,
 * country, billing_address, is_individual) are read-only — they are derived
 * from the received invoices and ignored by the server if sent.
 */
export interface UpdateSupplierInput {
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ListSuppliersInput {
  q?: string;
  is_individual?: boolean;
  per_page?: number;
  page?: number;
}

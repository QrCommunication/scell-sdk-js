/**
 * Buyer registry types (scoped tenant + sub_tenant).
 *
 * The Buyer registry holds the *current* state of a customer's identity and
 * addresses. When invoices are created with `buyer_id`, the API copies the
 * registry's current state onto the invoice (snapshot pattern). Mutating a
 * Buyer never affects already-issued invoices — ISCA fiscal compliance.
 */

import type { Address, DateTimeString, UUID } from './common.js';

export interface Buyer {
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
  /** Required billing address (BG-7 / BT-50..55). */
  billing_address: Address;
  /**
   * Optional shipping address (BG-13 / BT-71..80). NULL means
   * "ship to = bill to" per EN16931 presumption. Carries an optional `name`
   * (BT-74) that identifies the destination site (e.g. "Entrepot Lyon").
   */
  shipping_address: Address | null;
  has_distinct_shipping_address: boolean;
  /**
   * Dedicated accounts-payable / billing email address (BT-49 extension).
   * Distinct from `email` (which is the general contact email).
   *
   * Resolution order for `invoices.sendByEmail()`:
   *  1. `recipient_email` override in the request body
   *  2. `invoice.buyer_billing_email` (snapshot of this field)
   *  3. `invoice.buyer_email` (snapshot of the general `email`)
   *  4. 422 `BUYER_HAS_NO_EMAIL`
   *
   * Available since SDK 2.13.0.
   */
  billing_email: string | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

export interface CreateBuyerInput {
  name: string;
  country: string;
  billing_address: Address;
  is_individual?: boolean;
  siret?: string;
  vat_number?: string;
  legal_id?: string;
  legal_id_scheme?: string;
  email?: string;
  /**
   * Dedicated accounts-payable / billing email address.
   * When set, this address takes priority over `email` for invoice delivery.
   * Available since SDK 2.13.0.
   */
  billing_email?: string;
  phone?: string;
  shipping_address?: Address;
  metadata?: Record<string, unknown>;
  notes?: string;
}

export type UpdateBuyerInput = Partial<CreateBuyerInput>;

export interface ListBuyersInput {
  q?: string;
  is_individual?: boolean;
  per_page?: number;
  page?: number;
}

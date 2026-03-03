/**
 * Tenant Profile Types
 *
 * Types for tenant profile and identity API.
 *
 * @packageDocumentation
 */

export interface TenantProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  siret?: string;
  siren?: string;
  address?: TenantAddress | null;
  kyb_status?: string;
  environment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TenantAddress {
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country?: string;
}

export interface UpdateTenantProfileInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: TenantAddress;
}

export interface TenantBalance {
  credits: number;
  currency: string;
}

export interface TenantQuickStats {
  invoices_this_month: number;
  credit_notes_this_month: number;
  signatures_this_month: number;
}

export interface RegenerateKeyResult {
  tenant_key: string;
}

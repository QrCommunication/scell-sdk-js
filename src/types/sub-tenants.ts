/**
 * Sub-Tenant Types
 *
 * Types for the sub-tenant management API.
 *
 * @packageDocumentation
 */

export interface SubTenant {
  id: string;
  external_id?: string | null;
  name: string;
  siret?: string | null;
  siren?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: SubTenantAddress | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubTenantAddress {
  line1: string;
  line2?: string;
  postal_code: string;
  city: string;
  country?: string;
}

export interface SubTenantListOptions {
  per_page?: number;
  page?: number;
  search?: string;
}

export interface CreateSubTenantInput {
  external_id?: string;
  name: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  address?: SubTenantAddress;
  metadata?: Record<string, unknown>;
}

export interface UpdateSubTenantInput {
  external_id?: string;
  name?: string;
  siret?: string;
  siren?: string;
  email?: string;
  phone?: string;
  address?: SubTenantAddress;
  metadata?: Record<string, unknown>;
}

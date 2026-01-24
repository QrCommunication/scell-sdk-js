import type { DateTimeString, Siren, Siret, UUID } from './common.js';

/**
 * Company KYC status
 */
export type CompanyStatus = 'pending_kyc' | 'active' | 'suspended';

/**
 * Company entity
 */
export interface Company {
  id: UUID;
  name: string;
  siret: Siret;
  siren: Siren | null;
  vat_number: string | null;
  legal_form: string | null;
  address_line1: string;
  address_line2: string | null;
  postal_code: string;
  city: string;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  status: CompanyStatus;
  kyc_completed_at: DateTimeString | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/**
 * Company creation input
 */
export interface CreateCompanyInput {
  name: string;
  siret: Siret;
  vat_number?: string | undefined;
  legal_form?: string | undefined;
  address_line1: string;
  address_line2?: string | undefined;
  postal_code: string;
  city: string;
  country?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
}

/**
 * Company update input
 */
export interface UpdateCompanyInput {
  name?: string | undefined;
  siret?: Siret | undefined;
  vat_number?: string | undefined;
  legal_form?: string | undefined;
  address_line1?: string | undefined;
  address_line2?: string | undefined;
  postal_code?: string | undefined;
  city?: string | undefined;
  country?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  website?: string | undefined;
}

/**
 * KYC initiation response
 */
export interface KycInitiateResponse {
  message: string;
  kyc_reference: string;
  redirect_url: string;
}

/**
 * KYC status response
 */
export interface KycStatusResponse {
  status: CompanyStatus;
  kyc_reference: string | null;
  kyc_completed_at: DateTimeString | null;
  message: string;
}

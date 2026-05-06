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
  legal_id: string | null;
  legal_id_scheme: string | null;
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
  /** BT-84 — IBAN for Factur-X payment means */
  iban?: string | null;
  /** BT-86 — BIC/SWIFT for Factur-X payment means */
  bic?: string | null;
  /** BT-20 — Default payment terms text (e.g. "30 days net") */
  payment_terms_default?: string | null;
  /** Default payment due days used when creating invoices (default: 7) */
  payment_due_days_default?: number | null;
  /** Default footer text appended to generated invoice PDFs */
  invoice_footer_default?: string | null;
  /** BT-22 — Default buyer notes/remarks on invoices */
  invoice_notes_default?: string | null;
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
  siret?: Siret;
  legal_id?: string;
  legal_id_scheme?: string;
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
  /** BT-84 — IBAN for Factur-X payment means */
  iban?: string | null | undefined;
  /** BT-86 — BIC/SWIFT for Factur-X payment means */
  bic?: string | null | undefined;
  /** BT-20 — Default payment terms text */
  payment_terms_default?: string | null | undefined;
  /** Default payment due days (default: 7) */
  payment_due_days_default?: number | null | undefined;
  /** Default footer text for invoice PDFs */
  invoice_footer_default?: string | null | undefined;
  /** BT-22 — Default buyer notes on invoices */
  invoice_notes_default?: string | null | undefined;
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
  /** BT-84 — IBAN for Factur-X payment means */
  iban?: string | null | undefined;
  /** BT-86 — BIC/SWIFT for Factur-X payment means */
  bic?: string | null | undefined;
  /** BT-20 — Default payment terms text */
  payment_terms_default?: string | null | undefined;
  /** Default payment due days (default: 7) */
  payment_due_days_default?: number | null | undefined;
  /** Default footer text for invoice PDFs */
  invoice_footer_default?: string | null | undefined;
  /** BT-22 — Default buyer notes on invoices */
  invoice_notes_default?: string | null | undefined;
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

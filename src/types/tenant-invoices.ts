/**
 * Tenant Invoices types
 *
 * Types for multi-tenant invoice operations including direct invoices,
 * incoming invoices, and credit notes.
 *
 * @packageDocumentation
 */

import type {
  Address,
  CurrencyCode,
  DateString,
  DateTimeString,
  PaginationOptions,
  Siren,
  Siret,
  UUID,
} from './common.js';
import type { InvoiceFormat, InvoiceLine, InvoiceLineInput, InvoiceStatus } from './invoices.js';

/**
 * Invoice direction for tenant operations
 */
export type TenantInvoiceDirection = 'outgoing' | 'incoming';

/**
 * Buyer information for direct invoice creation
 */
export interface TenantInvoiceBuyer {
  /** Buyer company name */
  company_name: string;
  /** SIREN number (9 digits) - optional */
  siren?: Siren | undefined;
  /** SIRET number (14 digits) - optional */
  siret?: Siret | undefined;
  /** VAT number - optional */
  vat_number?: string | undefined;
  /** Buyer address */
  address: Address;
  /** Buyer email for notifications */
  email: string;
}

/**
 * Seller information for incoming invoice creation
 */
export interface TenantInvoiceSeller {
  /** Seller company name */
  company_name: string;
  /** SIREN number (9 digits) - required, validated with Luhn algorithm */
  siren: Siren;
  /** SIRET number (14 digits) - optional */
  siret?: Siret | undefined;
  /** VAT number - optional */
  vat_number?: string | undefined;
  /** Seller address */
  address: Address;
  /** Seller email */
  email: string;
}

/**
 * Input for creating a tenant direct invoice
 *
 * Direct invoices are outgoing invoices created by a tenant
 * that are billed directly to an external buyer (not a sub-tenant).
 *
 * @example
 * ```typescript
 * const params: CreateTenantDirectInvoiceParams = {
 *   company_id: 'company-uuid',
 *   buyer: {
 *     company_name: 'Client SARL',
 *     siret: '12345678901234',
 *     address: {
 *       line1: '123 Rue Example',
 *       postal_code: '75001',
 *       city: 'Paris',
 *       country: 'FR'
 *     },
 *     email: 'contact@client.com'
 *   },
 *   lines: [{
 *     description: 'Consulting services',
 *     quantity: 10,
 *     unit_price: 100,
 *     tax_rate: 20,
 *     total_ht: 1000,
 *     total_tax: 200,
 *     total_ttc: 1200
 *   }],
 *   issue_date: '2026-01-26'
 * };
 * ```
 */
export interface CreateTenantDirectInvoiceParams {
  /** Company UUID issuing the invoice */
  company_id: UUID;
  /** Buyer information */
  buyer: TenantInvoiceBuyer;
  /** Invoice line items */
  lines: InvoiceLineInput[];
  /** Issue date (YYYY-MM-DD) - defaults to today */
  issue_date?: DateString | undefined;
  /** Due date (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Currency code (ISO 4217) - defaults to EUR */
  currency?: CurrencyCode | undefined;
  /** Notes or comments on the invoice */
  notes?: string | undefined;
  /** Custom metadata */
  metadata?: Record<string, unknown> | undefined;
  /** Output format for the invoice */
  output_format?: InvoiceFormat | undefined;
  /** External reference ID */
  external_id?: string | undefined;
}

/**
 * Input for creating a tenant direct credit note
 *
 * Direct credit notes are linked to direct invoices and allow
 * partial or total refunds.
 *
 * @example
 * ```typescript
 * const params: CreateTenantDirectCreditNoteParams = {
 *   invoice_id: 'invoice-uuid',
 *   reason: 'Product returned - damaged item',
 *   type: 'partial',
 *   items: [{ invoice_line_id: 'line-uuid', quantity: 2 }]
 * };
 * ```
 */
export interface CreateTenantDirectCreditNoteParams {
  /** Invoice UUID to credit */
  invoice_id: UUID;
  /** Reason for the credit note */
  reason: string;
  /** Type: 'partial' or 'total' */
  type: 'partial' | 'total';
  /** Items to credit (required for partial credit notes) */
  items?: TenantCreditNoteItemInput[] | undefined;
  /** Custom metadata */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Credit note item input
 */
export interface TenantCreditNoteItemInput {
  /** Invoice line ID to credit */
  invoice_line_id: UUID;
  /** Quantity to credit (defaults to full line quantity) */
  quantity?: number | undefined;
}

/**
 * Input for creating an incoming invoice for a sub-tenant
 *
 * Incoming invoices represent invoices received by a sub-tenant
 * from an external supplier.
 *
 * @example
 * ```typescript
 * const params: CreateIncomingInvoiceParams = {
 *   invoice_number: 'SUPP-2026-001',
 *   company_id: 'company-uuid',
 *   seller: {
 *     company_name: 'Supplier Corp',
 *     siren: '123456789',
 *     address: {
 *       line1: '456 Avenue Fournisseur',
 *       postal_code: '69001',
 *       city: 'Lyon',
 *       country: 'FR'
 *     },
 *     email: 'invoices@supplier.com'
 *   },
 *   lines: [{
 *     description: 'Raw materials',
 *     quantity: 100,
 *     unit_price: 5,
 *     tax_rate: 20,
 *     total_ht: 500,
 *     total_tax: 100,
 *     total_ttc: 600
 *   }],
 *   issue_date: '2026-01-20',
 *   total_ht: 500,
 *   total_ttc: 600
 * };
 * ```
 */
export interface CreateIncomingInvoiceParams {
  /** Supplier's invoice number */
  invoice_number: string;
  /** Company UUID receiving the invoice */
  company_id: UUID;
  /** Seller (supplier) information */
  seller: TenantInvoiceSeller;
  /** Invoice line items */
  lines: InvoiceLineInput[];
  /** Issue date (YYYY-MM-DD) */
  issue_date: DateString;
  /** Due date (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Total excluding tax */
  total_ht: number;
  /** Total including tax */
  total_ttc: number;
  /** Currency code (ISO 4217) - defaults to EUR */
  currency?: CurrencyCode | undefined;
  /** External reference ID */
  external_id?: string | undefined;
}

/**
 * Input for updating a tenant invoice
 *
 * Only invoices in 'draft' status can be updated.
 */
export interface UpdateTenantInvoiceParams {
  /** Updated buyer information */
  buyer?: Partial<TenantInvoiceBuyer> | undefined;
  /** Updated line items (replaces all existing lines) */
  lines?: InvoiceLineInput[] | undefined;
  /** Updated due date */
  due_date?: DateString | undefined;
  /** Updated notes */
  notes?: string | undefined;
  /** Updated metadata */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Input for updating a tenant credit note
 *
 * Only credit notes in 'draft' status can be updated.
 */
export interface UpdateTenantCreditNoteParams {
  /** Updated reason */
  reason?: string | undefined;
  /** Updated items (for partial credit notes) */
  items?: TenantCreditNoteItemInput[] | undefined;
  /** Updated metadata */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Filter options for tenant invoice listing
 *
 * @example
 * ```typescript
 * const filters: TenantInvoiceFilters = {
 *   status: 'validated',
 *   direction: 'outgoing',
 *   date_from: '2026-01-01',
 *   date_to: '2026-01-31',
 *   per_page: 50
 * };
 * ```
 */
export interface TenantInvoiceFilters extends PaginationOptions {
  /** Search in invoice number, buyer/seller name */
  search?: string | undefined;
  /** Filter by status (single or multiple) */
  status?: InvoiceStatus | InvoiceStatus[] | undefined;
  /** Filter by direction */
  direction?: TenantInvoiceDirection | undefined;
  /** Filter invoices from this date (YYYY-MM-DD) */
  date_from?: DateString | undefined;
  /** Filter invoices to this date (YYYY-MM-DD) */
  date_to?: DateString | undefined;
  /** Filter by buyer SIRET */
  buyer_siret?: Siret | undefined;
  /** Filter by seller SIRET */
  seller_siret?: Siret | undefined;
  /** Minimum total amount (TTC) */
  min_amount?: number | undefined;
  /** Maximum total amount (TTC) */
  max_amount?: number | undefined;
  /** Sort field */
  sort?: string | undefined;
  /** Sort order */
  order?: 'asc' | 'desc' | undefined;
}

/**
 * Filter options for tenant credit note listing
 */
export interface TenantCreditNoteFilters extends PaginationOptions {
  /** Filter by status */
  status?: 'draft' | 'sent' | 'cancelled' | undefined;
  /** Filter credit notes from this date (YYYY-MM-DD) */
  date_from?: DateString | undefined;
  /** Filter credit notes to this date (YYYY-MM-DD) */
  date_to?: DateString | undefined;
  /** Sort field */
  sort?: string | undefined;
  /** Sort order */
  order?: 'asc' | 'desc' | undefined;
}

/**
 * Tenant Invoice entity
 *
 * Extended invoice entity with tenant-specific fields.
 */
export interface TenantInvoice {
  id: UUID;
  external_id: string | null;
  invoice_number: string;
  direction: TenantInvoiceDirection;
  output_format: InvoiceFormat;
  issue_date: DateString;
  due_date: DateString | null;
  currency: CurrencyCode;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  seller: {
    siret: Siret | null;
    siren: Siren | null;
    name: string;
    address: Address;
    email?: string | undefined;
  };
  buyer: {
    siret: Siret | null;
    siren: Siren | null;
    name: string;
    address: Address;
    email?: string | undefined;
  };
  lines: InvoiceLine[] | null;
  status: InvoiceStatus;
  status_message: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  company_id: UUID;
  created_at: DateTimeString;
  updated_at: DateTimeString;
  validated_at: DateTimeString | null;
  paid_at: DateTimeString | null;
  payment_reference: string | null;
}

/**
 * Tenant Credit Note entity
 */
export interface TenantCreditNote {
  id: UUID;
  credit_note_number: string;
  invoice_id: UUID;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  status: 'draft' | 'sent' | 'cancelled';
  type: 'partial' | 'total';
  reason: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: CurrencyCode;
  buyer_name: string | null;
  buyer_siret: Siret | null;
  seller_name: string | null;
  seller_siret: Siret | null;
  issue_date: DateString;
  metadata: Record<string, unknown> | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
  items: TenantCreditNoteItem[] | null;
}

/**
 * Tenant Credit Note Item
 */
export interface TenantCreditNoteItem {
  id: UUID;
  invoice_line_id: UUID | null;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

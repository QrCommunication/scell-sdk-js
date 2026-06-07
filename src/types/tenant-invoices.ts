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
 * Buyer information for invoice creation (nested `buyer` object).
 *
 * Mirrors the server contract: the API field is `name` (NOT `company_name`).
 * For French buyers (`address.country === 'FR'`) `siret` is required unless
 * `is_individual` is true.
 *
 * For B2C (private individual buyer), set `is_individual: true`. In that case
 * `siret` / `vat_number` are NOT required and the generated Factur-X / UBL /
 * CII omits BT-46/BT-47/BT-48 (BR-CO-26).
 */
export interface TenantInvoiceBuyer {
  /** Buyer legal/company name (or full name for B2C). API field: `name`. */
  name: string;
  /** SIRET number (14 digits). Required for FR buyers unless `is_individual`. */
  siret?: Siret | undefined;
  /** VAT number - optional, ignored if is_individual=true */
  vat_number?: string | undefined;
  /** Legal identifier (BT-29) - optional */
  legal_id?: string | undefined;
  /** Legal identifier scheme (e.g. ISO 6523) - optional */
  legal_id_scheme?: string | undefined;
  /** Buyer postal address (line1, postal_code, city, country required) */
  address: Address;
  /** Buyer email for notifications - optional */
  email?: string | undefined;
  /**
   * B2C flag : true if buyer is a private individual.
   * Default: false (B2B).
   */
  is_individual?: boolean | undefined;
}

/**
 * Seller information for invoice creation (nested `seller` object).
 *
 * Mirrors the server contract: the API field is `name` (NOT `company_name`).
 * For French sellers (`address.country === 'FR'`) `siret` is required.
 */
export interface TenantInvoiceSeller {
  /** Seller legal/company name. API field: `name`. */
  name: string;
  /** SIRET number (14 digits). Required for FR sellers. */
  siret?: Siret | undefined;
  /** VAT number - optional */
  vat_number?: string | undefined;
  /** Legal identifier (BT-29) - optional */
  legal_id?: string | undefined;
  /** Legal identifier scheme (e.g. ISO 6523) - optional */
  legal_id_scheme?: string | undefined;
  /** Seller postal address (line1, postal_code, city, country required) */
  address: Address;
  /** Seller email - optional */
  email?: string | undefined;
}

/**
 * Input for creating a tenant direct invoice (`POST /tenant/invoices`).
 *
 * Direct invoices are billed directly between a `seller` and a `buyer`
 * (both provided as nested objects, mirroring the server contract — there
 * is no `company_id` shortcut). `direction`, `output_format`, `seller`,
 * `buyer`, `lines`, `issue_date` and the three invoice-level totals
 * (`total_ht` / `total_tax` / `total_ttc`) are all REQUIRED server-side.
 *
 * @example
 * ```typescript
 * const params: CreateTenantDirectInvoiceParams = {
 *   direction: 'outgoing',
 *   output_format: 'facturx',
 *   issue_date: '2026-01-26',
 *   seller: {
 *     name: 'Ma Société SARL',
 *     siret: '12345678901234',
 *     vat_number: 'FR12345678901',
 *     address: { line1: '1 Rue du Vendeur', postal_code: '75002', city: 'Paris', country: 'FR' },
 *   },
 *   buyer: {
 *     name: 'Client SARL',
 *     siret: '98765432109876',
 *     address: { line1: '123 Rue Example', postal_code: '75001', city: 'Paris', country: 'FR' },
 *     email: 'contact@client.com',
 *   },
 *   lines: [{
 *     description: 'Consulting services',
 *     quantity: 10,
 *     unit_price: 100,
 *     tax_rate: 20,
 *     total_ht: 1000,
 *     total_tax: 200,
 *     total_ttc: 1200,
 *   }],
 *   total_ht: 1000,
 *   total_tax: 200,
 *   total_ttc: 1200,
 * };
 * ```
 */
export interface CreateTenantDirectInvoiceParams {
  /** Invoice direction (`outgoing` | `incoming`). REQUIRED. */
  direction: TenantInvoiceDirection;
  /** Output format (`facturx` | `ubl` | `cii`). REQUIRED server-side. */
  output_format: InvoiceFormat;
  /** Seller (issuer) information. REQUIRED. */
  seller: TenantInvoiceSeller;
  /** Buyer information. REQUIRED. */
  buyer: TenantInvoiceBuyer;
  /** Invoice line items. REQUIRED (min 1). */
  lines: InvoiceLineInput[];
  /** Invoice-level total excluding tax (sum of line `total_ht`). REQUIRED server-side. */
  total_ht: number;
  /**
   * Invoice-level VAT amount. REQUIRED server-side.
   *
   * Note: the API field is `total_tax` (NOT `total_tva`).
   */
  total_tax: number;
  /** Invoice-level total including tax (`total_ht` + `total_tax`). REQUIRED server-side. */
  total_ttc: number;
  /** Issue date (YYYY-MM-DD). REQUIRED, must be today or earlier. */
  issue_date: DateString;
  /** Due date (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Currency code (ISO 4217) - defaults to EUR */
  currency?: CurrencyCode | undefined;
  /** Notes or comments on the invoice */
  notes?: string | undefined;
  /** Custom metadata */
  metadata?: Record<string, unknown> | undefined;
  /** External reference ID */
  external_id?: string | undefined;
  /**
   * B2C flag : true if buyer is a private individual.
   *
   * Equivalent to setting `buyer.is_individual = true`. When true,
   * buyer SIRET / VAT are NOT required server-side. The generated
   * Factur-X / UBL / CII omits BT-46/BT-47/BT-48 (BR-CO-26).
   *
   * Default: false (B2B).
   */
  buyer_is_individual?: boolean | undefined;
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
 * The target sub-tenant is passed as the first argument of
 * `incomingInvoices.create(subTenantId, params)`, not inside the payload.
 * `seller`, `buyer`, `lines`, `issue_date` and the three totals
 * (`total_ht` / `total_tax` / `total_ttc`) are REQUIRED server-side.
 *
 * @example
 * ```typescript
 * const params: CreateIncomingInvoiceParams = {
 *   invoice_number: 'SUPP-2026-001',
 *   issue_date: '2026-01-20',
 *   seller: {
 *     name: 'Supplier Corp',
 *     siret: '12345678901234',
 *     address: { line1: '456 Avenue Fournisseur', postal_code: '69001', city: 'Lyon', country: 'FR' },
 *   },
 *   buyer: {
 *     name: 'Ma Société (récepteur)',
 *     siret: '98765432109876',
 *     address: { line1: '1 Rue du Client', postal_code: '75001', city: 'Paris', country: 'FR' },
 *   },
 *   lines: [{
 *     description: 'Raw materials',
 *     quantity: 100,
 *     unit_price: 5,
 *     tax_rate: 20,
 *     total_ht: 500,
 *     total_tax: 100,
 *     total_ttc: 600,
 *   }],
 *   total_ht: 500,
 *   total_tax: 100,
 *   total_ttc: 600,
 * };
 * ```
 */
export interface CreateIncomingInvoiceParams {
  /** Supplier's invoice number */
  invoice_number: string;
  /** Seller (supplier) information. REQUIRED. */
  seller: TenantInvoiceSeller;
  /** Buyer (the receiving company). REQUIRED. */
  buyer: TenantInvoiceBuyer;
  /** Invoice line items. REQUIRED (min 1). */
  lines: InvoiceLineInput[];
  /** Issue date (YYYY-MM-DD). REQUIRED. */
  issue_date: DateString;
  /** Due date (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Total excluding tax. REQUIRED. */
  total_ht: number;
  /** Total VAT amount. REQUIRED (API field: `total_tax`, NOT `total_tva`). */
  total_tax: number;
  /** Total including tax. REQUIRED. */
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
    /** B2C flag : true if buyer is a private individual */
    is_individual?: boolean;
  };
  /**
   * B2C flag : true if buyer is a private individual.
   * In that case, buyer SIRET/SIREN/VAT are not required and Factur-X
   * BT-46/BT-47/BT-48 are omitted (BR-CO-26 EN16931 compliant).
   */
  buyer_is_individual: boolean;
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
  /**
   * Stripe PaymentIntent ID (pi_...) if a payment has been initiated.
   * Available since API Wave 1 B3.
   */
  stripe_payment_intent_id?: string | null;
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
  /** B2C flag, inherited from the source invoice. */
  buyer_is_individual: boolean;
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

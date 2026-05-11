import type {
  Address,
  CurrencyCode,
  DateString,
  DateTimeString,
  Environment,
  Siret,
  UUID,
} from './common.js';

/**
 * Invoice direction
 */
export type InvoiceDirection = 'outgoing' | 'incoming';

/**
 * Invoice output format
 */
export type InvoiceFormat = 'facturx' | 'ubl' | 'cii';

/**
 * Invoice status
 */
export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'validated'
  | 'converted'
  | 'transmitted'
  | 'accepted'
  | 'rejected'
  | 'paid'
  | 'disputed'
  | 'cancelled'
  | 'error';

/**
 * Invoice download file type
 */
export type InvoiceDownloadType = 'original' | 'converted' | 'pdf';

/**
 * Invoice line item
 */
export interface InvoiceLine {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
}

/**
 * Invoice party (seller or buyer).
 *
 * For the buyer, the optional fields below are populated when the invoice
 * was created with `buyer_id` (registry shortcut) or with an explicit
 * shipping address:
 *  - `id`: soft link to the buyers registry (Buyer.id)
 *  - `shipping_address`: snapshot of the BG-13 ship-to (NULL if identical
 *    to the billing `address`)
 *  - `is_individual`: B2C flag mirrored from buyer_is_individual
 */
export interface InvoiceParty {
  id?: UUID | null;
  siret?: Siret;
  vat_number?: string;
  legal_id?: string;
  legal_id_scheme?: string;
  country: string;
  name: string;
  address: Address;
  shipping_address?: Address | null;
  is_individual?: boolean;
}

/**
 * Invoice entity
 */
export interface Invoice {
  id: UUID;
  external_id: string | null;
  invoice_number: string;
  direction: InvoiceDirection;
  output_format: InvoiceFormat;
  issue_date: DateString;
  due_date: DateString | null;
  currency: CurrencyCode;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  lines: InvoiceLine[] | null;
  status: InvoiceStatus;
  status_message: string | null;
  environment: Environment;
  archive_enabled: boolean;
  amount_charged: number | null;
  created_at: DateTimeString;
  validated_at: DateTimeString | null;
  transmitted_at: DateTimeString | null;
  completed_at: DateTimeString | null;
  /** Date when the invoice was marked as paid (ISO 8601) */
  paid_at: DateTimeString | null;
  /** Payment reference (bank transfer ID, check number, etc.) */
  payment_reference: string | null;
  /** Optional note about the payment */
  payment_note: string | null;
  /**
   * Number of credit notes issued against this invoice (partial or total).
   * Available since SDK 1.16.0 (API 2026-05-04).
   */
  credit_notes_count?: number;
  /**
   * Total amount credited (sum of validated/sent/transmitted credit notes).
   * Use to detect partial vs full credit (credited_amount >= total_ttc).
   * Available since SDK 1.16.0.
   */
  credited_amount?: number;
  /**
   * Optional list of related credit notes (loaded only on detail endpoint).
   * Available since SDK 1.16.0.
   */
  credit_notes?: Array<{
    id: UUID;
    credit_note_number: string;
    type: "partial" | "total";
    total: number;
    status: string;
    created_at: DateTimeString;
  }> | null;
}

/**
 * Invoice line input for creation
 */
export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
}

/**
 * Invoice creation input
 */
export interface CreateInvoiceInput {
  /** Your external reference ID */
  external_id?: string | undefined;
  /**
   * Target a specific sub-tenant of the authenticated tenant. When
   * omitted, the invoice is issued under the master tenant directly.
   * The server returns `404 SUB_TENANT_NOT_FOUND` if the UUID does
   * not belong to the current tenant (anti-IDOR).
   */
  sub_tenant_id?: UUID | undefined;
  /** Direction: outgoing (sale) or incoming (purchase) */
  direction: InvoiceDirection;
  /** Output format for electronic invoice */
  output_format: InvoiceFormat;
  /** Issue date (YYYY-MM-DD) */
  issue_date: DateString;
  /** Due date (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Currency code (default: EUR) */
  currency?: CurrencyCode | undefined;
  /** Total excluding tax */
  total_ht: number;
  /** Total tax amount */
  total_tax: number;
  /** Total including tax */
  total_ttc: number;
  /** Seller SIRET (14 digits) */
  seller_siret?: Siret;
  /** Seller VAT number */
  seller_vat_number?: string;
  /** Seller country (ISO 3166-1 alpha-2) */
  seller_country: string;
  /** Seller legal identifier */
  seller_legal_id?: string;
  /** Seller legal identifier scheme */
  seller_legal_id_scheme?: string;
  /** Seller company name */
  seller_name: string;
  /** Seller address */
  seller_address: Address;
  /**
   * Reference an existing buyer in the registry (scoped tenant + sub_tenant).
   * When provided, the API snapshots the registry's current state onto the
   * issued invoice; the flat buyer_* fields below become optional.
   * Mutating the buyer later does NOT change this invoice (ISCA immutability).
   */
  buyer_id?: UUID | undefined;
  /** Buyer SIRET (14 digits) */
  buyer_siret?: Siret;
  /** Buyer VAT number */
  buyer_vat_number?: string;
  /** Buyer country (ISO 3166-1 alpha-2) — required unless `buyer_id` is set. */
  buyer_country?: string;
  /** Buyer legal identifier */
  buyer_legal_id?: string;
  /** Buyer legal identifier scheme */
  buyer_legal_id_scheme?: string;
  /** Buyer company name — required unless `buyer_id` is set. */
  buyer_name?: string;
  /** Buyer address — required unless `buyer_id` is set. */
  buyer_address?: Address;
  /**
   * Optional shipping address (Factur-X BG-13 / BT-71..80). When omitted
   * or identical to buyer_address, the API does not emit BG-13 in the XML
   * (EN16931 presumption ship=bill). Carries an optional `name` (BT-74)
   * to identify the destination site (e.g. "Entrepot Lyon").
   */
  buyer_shipping_address?: Address | undefined;
  /**
   * B2C flag : true if buyer is a private individual.
   *
   * When true, buyer_siret / buyer_vat_number / buyer_legal_id are
   * NOT required server-side, and the generated Factur-X / UBL / CII
   * document omits BT-46/BT-47/BT-48 (BR-CO-26 EN16931).
   *
   * Default: false (B2B).
   */
  buyer_is_individual?: boolean | undefined;
  /** Invoice line items */
  lines: InvoiceLineInput[];
  /** Enable 10-year archiving */
  archive_enabled?: boolean | undefined;
}

/**
 * Invoice list filter options
 */
export interface InvoiceListOptions {
  company_id?: UUID | undefined;
  direction?: InvoiceDirection | undefined;
  status?: InvoiceStatus | undefined;
  environment?: Environment | undefined;
  from?: DateString | undefined;
  to?: DateString | undefined;
  per_page?: number | undefined;
}

/**
 * Invoice conversion input
 */
export interface ConvertInvoiceInput {
  invoice_id: UUID;
  target_format: InvoiceFormat;
}

/**
 * Invoice download response
 */
export interface InvoiceDownloadResponse {
  url: string;
  expires_at: DateTimeString;
}

/**
 * Audit trail entry
 */
export interface AuditTrailEntry {
  action: string;
  details: string;
  actor_ip: string | null;
  created_at: DateTimeString;
}

/**
 * Audit trail response
 */
export interface AuditTrailResponse {
  data: AuditTrailEntry[];
  integrity_valid: boolean;
}

/**
 * Incoming invoice list filter options
 */
export interface IncomingInvoiceParams {
  status?: InvoiceStatus | undefined;
  seller_siret?: Siret | undefined;
  from?: DateString | undefined;
  to?: DateString | undefined;
  min_amount?: number | undefined;
  max_amount?: number | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
}

/**
 * Rejection reason code for incoming invoices
 */
export type RejectionCode =
  | 'incorrect_amount'
  | 'duplicate'
  | 'unknown_order'
  | 'incorrect_vat'
  | 'other';

/**
 * Dispute type for incoming invoices
 */
export type DisputeType =
  | 'amount_dispute'
  | 'quality_dispute'
  | 'delivery_dispute'
  | 'other';

/**
 * Input for accepting an incoming invoice
 */
export interface AcceptInvoiceInput {
  /** Expected payment date (YYYY-MM-DD) */
  payment_date?: DateString | undefined;
  /** Optional note about the acceptance */
  note?: string | undefined;
}

/**
 * Input for rejecting an incoming invoice
 */
export interface RejectInvoiceInput {
  /** Reason for rejection */
  reason: string;
  /** Standardized rejection code */
  reason_code: RejectionCode;
}

/**
 * Input for disputing an incoming invoice
 */
export interface DisputeInvoiceInput {
  /** Reason for the dispute */
  reason: string;
  /** Type of dispute */
  dispute_type: DisputeType;
  /** Expected correct amount (if amount dispute) */
  expected_amount?: number | undefined;
}

/**
 * Input for marking an incoming invoice as paid
 */
export interface MarkPaidInput {
  /** Payment reference (bank transfer ID, check number, etc.) */
  payment_reference?: string | undefined;
  /** Payment date (ISO 8601) - defaults to current date/time if not provided */
  paid_at?: DateTimeString | undefined;
  /** Optional note about the payment */
  note?: string | undefined;
}

/**
 * Invoice file download format
 */
export type InvoiceFileFormat = 'pdf' | 'xml';

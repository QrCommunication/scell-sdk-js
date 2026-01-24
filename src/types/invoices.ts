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
 * Invoice party (seller or buyer)
 */
export interface InvoiceParty {
  siret: Siret;
  name: string;
  address: Address;
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
  /** Invoice number (required) */
  invoice_number: string;
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
  seller_siret: Siret;
  /** Seller company name */
  seller_name: string;
  /** Seller address */
  seller_address: Address;
  /** Buyer SIRET (14 digits) */
  buyer_siret: Siret;
  /** Buyer company name */
  buyer_name: string;
  /** Buyer address */
  buyer_address: Address;
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

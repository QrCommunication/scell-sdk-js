/**
 * Quote types for Scell.io SDK
 *
 * @packageDocumentation
 */

import type {
  Address,
  CurrencyCode,
  DateString,
  DateTimeString,
  Environment,
  UUID,
} from './common.js';

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

/**
 * Quote status lifecycle:
 *  draft → sent → (accepted | refused | expired) → (converted → invoice)
 */
export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'refused'
  | 'expired'
  | 'cancelled'
  | 'converted';

/**
 * Actor type in the audit log
 */
export type QuoteActorType = 'user' | 'system' | 'public_visitor';

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

/**
 * A single line item within a quote
 */
export interface QuoteLine {
  id: UUID;
  quote_id: UUID;
  position: number;
  description: string;
  product_code: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  metadata: Record<string, unknown> | null;
}

/**
 * Electronic signature captured on a quote (EU-SES level)
 */
export interface QuoteSignature {
  /** Base64-encoded SVG from signature pad (when drawn) */
  canvas_svg: string | null;
  /** Full name typed by the signer (when typed) */
  typed_name: string | null;
  /** Whether the signer accepted the consent clause */
  consent_accepted: boolean;
  /** IP address at time of signing */
  ip: string | null;
  /** User-agent at time of signing */
  user_agent: string | null;
  /** ISO 8601 timestamp of signing */
  signed_at: DateTimeString;
}

/**
 * A single entry in the quote's tamper-evident audit log
 */
export interface QuoteAuditEntry {
  id: UUID;
  quote_id: UUID;
  sequence_number: number;
  action: string;
  actor_type: QuoteActorType;
  actor_id: UUID | null;
  data_snapshot: Record<string, unknown>;
  data_hash: string;
  previous_hash: string | null;
  chain_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: DateTimeString;
}

/**
 * Quote entity (full detail)
 */
export interface Quote {
  id: UUID;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  company_id: UUID;
  buyer_id: UUID | null;
  invoice_template_id: UUID | null;
  environment: Environment;
  quote_number: string;
  external_id: string | null;
  status: QuoteStatus;
  issue_date: DateString;
  valid_until: DateString;
  currency: CurrencyCode;

  // Buyer snapshot (immutable after acceptance)
  buyer_name: string;
  buyer_is_individual: boolean;
  buyer_siret: string | null;
  buyer_vat_number: string | null;
  buyer_legal_id: string | null;
  buyer_legal_id_scheme: string | null;
  buyer_country: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  buyer_address: Address;
  buyer_shipping_address: Address | null;

  // Seller snapshot
  seller_name: string;
  seller_siret: string | null;
  seller_vat_number: string | null;
  seller_country: string;
  seller_address: Address;

  // Totals
  total_ht: number;
  total_tax: number;
  total_ttc: number;

  // Conditions
  payment_terms: string | null;
  notes: string | null;
  internal_notes: string | null;

  // Signature
  signature_required: boolean;
  signature: QuoteSignature | null;

  // Public link
  public_link: string | null;
  public_token_expires_at: DateTimeString | null;
  public_token_revoked_at: DateTimeString | null;

  // Workflow timestamps
  sent_at: DateTimeString | null;
  viewed_first_at: DateTimeString | null;
  viewed_last_at: DateTimeString | null;
  view_count: number;
  accepted_at: DateTimeString | null;
  refused_at: DateTimeString | null;
  refusal_reason: string | null;
  cancelled_at: DateTimeString | null;
  expired_at: DateTimeString | null;
  converted_at: DateTimeString | null;

  // Conversion
  auto_convert_on_accept: boolean;
  /** ID of the deposit invoice created from this quote (if converted) */
  deposit_invoice_id: UUID | null;
  /** ID of the balance invoice created from this quote (if converted) */
  balance_invoice_id: UUID | null;

  /**
   * URL de callback fournie par le tenant à la création.
   *
   * Si présente, le viewer public redirige le buyer vers cette URL après
   * acceptation ou refus avec query string :
   *   `?status=signed|refused&quote_id=<UUID>&quote_number=<num>&reason=<txt>`
   *
   * `null` = comportement par défaut (page confirmation Scell.io).
   */
  callback_url: string | null;

  metadata: Record<string, unknown> | null;

  // Relations (populated on detail endpoint)
  lines: QuoteLine[] | null;
  audit_log?: QuoteAuditEntry[] | null;

  created_at: DateTimeString;
  updated_at: DateTimeString;
  deleted_at: DateTimeString | null;
}

// ---------------------------------------------------------------------------
// List response
// ---------------------------------------------------------------------------

/**
 * Paginated response for quote listing
 */
export interface QuoteListResponse {
  data: Quote[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ---------------------------------------------------------------------------
// Input types — creation & update
// ---------------------------------------------------------------------------

/**
 * Input for a single line item (creation / update)
 */
export interface QuoteLineInput {
  description: string;
  product_code?: string | undefined;
  quantity: number;
  unit?: string | undefined;
  unit_price: number;
  tax_rate?: number | undefined;
  discount_rate?: number | undefined;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
}

/**
 * Input for creating a new quote
 */
export interface CreateQuoteInput {
  /** Your external reference ID (idempotency) */
  external_id?: string | undefined;
  /**
   * Sub-tenant scope. When omitted, the quote is issued under the master
   * tenant. Returns 404 SUB_TENANT_NOT_FOUND if not in scope (anti-IDOR).
   */
  sub_tenant_id?: UUID | undefined;
  /** Issue date (YYYY-MM-DD) */
  issue_date: DateString;
  /** Validity date (YYYY-MM-DD) */
  valid_until: DateString;
  /** Currency code (default: EUR) */
  currency?: CurrencyCode | undefined;
  /** Optional invoice template UUID */
  invoice_template_id?: UUID | undefined;

  // Buyer — either buyer_id (registry shortcut) or flat fields
  buyer_id?: UUID | undefined;
  buyer_name?: string | undefined;
  buyer_is_individual?: boolean | undefined;
  buyer_siret?: string | undefined;
  buyer_vat_number?: string | undefined;
  buyer_legal_id?: string | undefined;
  buyer_legal_id_scheme?: string | undefined;
  buyer_country?: string | undefined;
  buyer_email?: string | undefined;
  buyer_phone?: string | undefined;
  buyer_address?: Address | undefined;
  buyer_shipping_address?: Address | undefined;

  // Totals
  total_ht: number;
  total_tax: number;
  total_ttc: number;

  // Conditions
  payment_terms?: string | undefined;
  notes?: string | undefined;
  internal_notes?: string | undefined;

  /** Whether electronic signature is required before acceptance */
  signature_required?: boolean | undefined;
  /** Auto-convert to deposit invoice upon acceptance */
  auto_convert_on_accept?: boolean | undefined;

  /**
   * URL de callback : après acceptation ou refus via le viewer public,
   * le buyer est redirigé vers cette URL avec query string
   * `status=signed|refused&quote_id=...&quote_number=...&reason=...`.
   *
   * Permet au tenant d'intégrer la signature dans son propre flow
   * (page de remerciement, dashboard client, automation post-signature).
   *
   * Format : URL absolue HTTPS, max 500 caractères.
   */
  callback_url?: string | undefined;

  lines: QuoteLineInput[];
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Input for updating an existing draft quote
 */
export interface UpdateQuoteInput {
  issue_date?: DateString | undefined;
  valid_until?: DateString | undefined;
  currency?: CurrencyCode | undefined;
  invoice_template_id?: UUID | undefined;

  buyer_id?: UUID | undefined;
  buyer_name?: string | undefined;
  buyer_is_individual?: boolean | undefined;
  buyer_siret?: string | undefined;
  buyer_vat_number?: string | undefined;
  buyer_legal_id?: string | undefined;
  buyer_legal_id_scheme?: string | undefined;
  buyer_country?: string | undefined;
  buyer_email?: string | undefined;
  buyer_phone?: string | undefined;
  buyer_address?: Address | undefined;
  buyer_shipping_address?: Address | undefined;

  total_ht?: number | undefined;
  total_tax?: number | undefined;
  total_ttc?: number | undefined;

  payment_terms?: string | undefined;
  notes?: string | undefined;
  internal_notes?: string | undefined;

  signature_required?: boolean | undefined;
  auto_convert_on_accept?: boolean | undefined;
  /**
   * URL de callback tenant. Mise à jour autorisée tant que le devis
   * n'est pas signé. Voir `CreateQuoteInput.callback_url` pour les
   * détails du flow de redirection.
   */
  callback_url?: string | null | undefined;

  lines?: QuoteLineInput[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// Action inputs
// ---------------------------------------------------------------------------

/**
 * Input for sending a quote to the buyer (generates public link + optional email)
 */
export interface SendQuoteInput {
  /** Send email notification to buyer_email */
  send_email?: boolean | undefined;
  /** Custom message in the email */
  email_message?: string | undefined;
  /** Override buyer email for this send */
  email?: string | undefined;
  /** Number of days until public link expires (default: 30) */
  link_expires_in_days?: number | undefined;
}

/**
 * Input for converting a sent/accepted quote into a deposit invoice
 */
export interface ConvertToDepositInput {
  /**
   * Deposit amount (TTC). When omitted, full quote total_ttc is used.
   */
  deposit_amount?: number | undefined;
  /** Deposit percentage (alternative to deposit_amount, e.g. 30 = 30%) */
  deposit_percent?: number | undefined;
  /** Label for the deposit invoice line */
  deposit_label?: string | undefined;
  /** Due date for the deposit invoice (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Output format for the deposit invoice */
  output_format?: 'facturx' | 'ubl' | 'cii' | undefined;
}

/**
 * Input for converting a quote (with deposit already paid) into a balance invoice.
 * The balance invoice deducts the deposit invoice amount from the total.
 */
export interface ConvertToBalanceInput {
  /** Due date for the balance invoice (YYYY-MM-DD) */
  due_date?: DateString | undefined;
  /** Output format for the balance invoice */
  output_format?: 'facturx' | 'ubl' | 'cii' | undefined;
}

/**
 * Input for client-side acceptance of a quote (via public link)
 *
 * Used by the public acceptance flow — not typically called from server SDK.
 */
export interface AcceptQuoteInput {
  /** Full name typed by the signer (required when signature_required = true) */
  typed_name?: string | undefined;
  /** Base64-encoded SVG canvas data from signature pad */
  canvas_svg?: string | undefined;
  /** Whether signer accepted the consent clause */
  consent_accepted: boolean;
}

/**
 * Input for refusing a quote (by the buyer, via public link)
 */
export interface RefuseQuoteInput {
  /** Reason for refusal */
  reason: string;
}

// ---------------------------------------------------------------------------
// List / filter params
// ---------------------------------------------------------------------------

/**
 * Filter and pagination options for quote listing
 */
export interface QuoteListParams {
  /** Filter by status */
  status?: QuoteStatus | undefined;
  /** Filter by buyer name / number (partial search) */
  q?: string | undefined;
  /** Filter by company UUID */
  company_id?: UUID | undefined;
  /** Filter by sub-tenant UUID */
  sub_tenant_id?: UUID | undefined;
  /** Filter by environment */
  environment?: Environment | undefined;
  /** Start date filter (issue_date >= from) */
  from?: DateString | undefined;
  /** End date filter (issue_date <= to) */
  to?: DateString | undefined;
  page?: number | undefined;
  per_page?: number | undefined;
}

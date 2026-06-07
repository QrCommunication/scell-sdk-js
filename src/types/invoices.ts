import type {
  Address,
  CurrencyCode,
  DateString,
  DateTimeString,
  Environment,
  Siret,
  UUID,
} from './common.js';
import type { PaymentMeansCode } from './enums.js';

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
 *
 * Mirrors the PostgreSQL `invoices_status_check` constraint on the server.
 *
 * Statuses introduced in API 2026-05-27 (SDK v2.22.0):
 *  - `'refunded'`           : full refund — sum of validated credit notes covers `total_ttc`.
 *  - `'partially_refunded'` : partial refund — at least one credit note attached but
 *                              the cumulative amount is strictly below `total_ttc`.
 *
 * Both transitions are driven server-side by `CreditNoteObserver::recomputeRefundStatus()`
 * and do NOT bypass ISCA immutability (status is not part of `IMMUTABLE_FISCAL_FIELDS`).
 *
 * Aligné sur le check constraint PostgreSQL `invoices_status_check` (16 statuts).
 * Les anciennes valeurs `pending` et `cancelled` ont été retirées : le serveur
 * ne les émet jamais (il utilise `validating` / `received`).
 */
export type InvoiceStatus =
  | 'draft'
  | 'validating'
  | 'validated'
  | 'converting'
  | 'converted'
  | 'transmitting'
  | 'transmitted'
  | 'accepted'
  | 'rejected'
  | 'disputed'
  | 'paid'
  | 'received'
  | 'completed'
  | 'error'
  | 'refunded'
  | 'partially_refunded';

/**
 * Refund status — read-only aggregate computed server-side from the linked
 * credit notes (status='sent' or beyond).
 *
 * Available since SDK 2.22.0 (API 2026-05-27).
 *
 *  - `'none'`    : no validated credit note attached.
 *  - `'partial'` : at least one credit note covers part of `total_ttc`.
 *  - `'full'`    : the cumulative credit covers `total_ttc` (within 0.01 EUR tolerance).
 */
export type RefundStatus = 'none' | 'partial' | 'full';

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
 * Invoice type (standard, deposit from quote, or balance/solde)
 *
 * - `standard` : regular invoice (default, backward compatible)
 * - `deposit`  : acompte invoice generated from a quote via `convertToDeposit`
 * - `balance`  : solde invoice generated from a quote via `convertToBalance`
 *
 * Available since SDK 2.11.0 (API 2026-05-16).
 */
export type InvoiceType = 'standard' | 'deposit' | 'balance';

/**
 * Invoice entity
 */
export interface Invoice {
  id: UUID;
  external_id: string | null;
  invoice_number: string;
  direction: InvoiceDirection;
  /**
   * Invoice type for quote-to-invoice conversion workflow.
   * Absent on invoices created before v2.11.0 — treat `undefined` as `'standard'`.
   */
  invoice_type?: InvoiceType | undefined;
  /**
   * UUID of the parent quote this invoice was generated from.
   *
   * Populated on:
   *  - `deposit` invoices created via `quotes.convertToDeposit()`
   *  - `balance` invoices created via `quotes.convertToBalance()`
   *  - `standard` invoices created via `invoices.create({ parent_quote_id })`
   *    (available since SDK 2.21.0)
   */
  parent_quote_id?: string | undefined;
  /**
   * UUIDs of prior invoices deducted in a balance (solde) invoice.
   * Only set on `balance` invoice types; contains the deposit invoice IDs.
   */
  parent_invoice_ids?: string[] | undefined;
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
   * Payment means code (UN/ECE 4461 — Factur-X BT-81).
   *
   * Populated when the invoice has been marked as paid via
   * `markPaid()`. `null` otherwise (invoice not yet paid, or marked
   * paid prior to API 2026-05-28). Drives the `<ram:TypeCode>` value
   * emitted under `<ram:SpecifiedTradeSettlementPaymentMeans>` in the
   * generated Factur-X / UBL / CII document.
   *
   * @see {@link PaymentMeansCode}
   * @since 2.25.0
   */
  payment_means_code?: PaymentMeansCode | null | undefined;
  /**
   * Optional free-text label for the payment means (Factur-X BT-82).
   *
   * Use to disambiguate a generic code: e.g. `'BNP Paribas'` for code
   * `'58'` (SEPA credit transfer), `'Stripe checkout'` for code `'48'`
   * (bank card). Capped at 100 characters server-side.
   *
   * @since 2.25.0
   */
  payment_means_text?: string | null | undefined;
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
  /**
   * Aggregate refund status — server-side rollup of attached credit notes.
   *
   * - `'none'`    : no validated credit note attached.
   * - `'partial'` : at least one credit note, cumulative amount < `total_ttc`.
   * - `'full'`    : cumulative credit covers `total_ttc` (within 0.01 EUR).
   *
   * Mirrors the invoice `status` transition to `'partially_refunded'` /
   * `'refunded'` posed by `CreditNoteObserver::recomputeRefundStatus()`.
   * Available since SDK 2.22.0 (API 2026-05-27).
   */
  refund_status?: RefundStatus | undefined;
  /**
   * Total amount already refunded via attached credit notes (sum of
   * `total_ttc` of credit notes with status='sent' or beyond).
   *
   * Defaults to `0` when no credit note is attached. Equivalent in value to
   * `credited_amount` but exposed under a refund-oriented name for the new
   * refunded/partially_refunded workflow.
   * Available since SDK 2.22.0 (API 2026-05-27).
   */
  total_refunded?: number | undefined;
  /**
   * UUID of the payment schedule line that triggered the generation of this
   * deposit invoice. Available since SDK 2.13.0.
   */
  schedule_line_id?: UUID | null | undefined;
  /**
   * Timestamp when this invoice was sent to the buyer via `send-by-email`.
   * Available since SDK 2.13.0.
   */
  sent_to_buyer_at?: DateTimeString | null | undefined;
  /**
   * Email address that the invoice was sent to (resolved from
   * `buyer_billing_email`, `buyer_email`, or an explicit `recipient_email`
   * override). Available since SDK 2.13.0.
   */
  sent_to_buyer_email?: string | null | undefined;
  /**
   * Snapshot of the buyer's billing email at the time the invoice was
   * created (from `Buyer.billing_email`). May differ from `buyer_email`
   * when the buyer uses a dedicated accounts-payable address.
   * Available since SDK 2.13.0.
   */
  buyer_billing_email?: string | null | undefined;
  /**
   * UUID of the deposit group this invoice belongs to.
   * Populated on standalone deposit invoices (created directly via
   * `POST /invoices` with `invoice_type: 'deposit'`, without a parent quote).
   * All deposit invoices sharing the same `deposit_group_id` are part of
   * the same commercial deal. Available since SDK 2.15.0.
   */
  deposit_group_id?: string | null | undefined;
  /**
   * Total pre-tax amount of the commercial deal (HT), set at group creation.
   * Used to track progress across multiple deposit invoices.
   * Available since SDK 2.15.0.
   */
  deposit_total_ht?: number | null | undefined;
  /**
   * Free-text reference for the deposit group (e.g. purchase order number,
   * contract reference). Available since SDK 2.15.0.
   */
  deposit_reference_text?: string | null | undefined;
  /**
   * Progress summary for the deposit group. Present only on the detail
   * endpoint (`GET /invoices/:id`), not on list responses.
   * Available since SDK 2.15.0.
   */
  deposit_group_progress?: {
    /** Total pre-tax amount of the deal (copied from `deposit_total_ht`) */
    deposit_total_ht: number;
    /** Sum of all deposit invoices emitted in this group (HT) */
    sum_deposits_ht: number;
    /** Remaining amount not yet invoiced (HT) */
    remaining_ht: number;
    /** Percentage invoiced so far (0–100) */
    progress_percent: number;
    /** Whether a balance (solde) invoice has already been emitted */
    has_balance: boolean;
    /** Number of invoices in the group */
    invoices_count: number;
    /** Brief summary of each invoice in the group */
    invoices: Array<{
      id: string;
      invoice_type: InvoiceType;
      total_ht: number;
      invoice_number: string;
    }>;
  } | null | undefined;
}

/**
 * Input for sending an invoice to the buyer by email
 *
 * All fields are optional. When `recipient_email` is omitted, the server
 * resolves the destination in this order:
 *  1. `invoice.buyer_billing_email` (dedicated A/P address)
 *  2. `invoice.buyer_email` (general contact)
 *  3. `quote.buyer_email` (if the invoice originates from a quote)
 *  4. 422 `BUYER_HAS_NO_EMAIL` — no resolvable address
 *
 * If the invoice is in `draft` status, the server auto-transitions it to
 * `validated` before sending. A confirmation modal is recommended in UIs.
 *
 * Available since SDK 2.13.0.
 */
export interface SendInvoiceByEmailInput {
  /**
   * Override the recipient email address for this send.
   * When omitted, the server follows the resolution cascade described above.
   */
  recipient_email?: string | undefined;
  /**
   * Additional CC recipients (max 5).
   */
  cc?: string[] | undefined;
  /**
   * Optional plain-text message appended to the email body.
   * Max 2000 characters.
   */
  message?: string | undefined;
}

/**
 * Response returned after a successful `sendByEmail()` call
 */
export interface SendInvoiceByEmailResponse {
  /** Actual email address the invoice was sent to */
  sent_to: string;
  /** ISO 8601 timestamp of the send */
  sent_at: DateTimeString;
  /** SMTP message-ID of the sent email */
  message_id: string;
  /** CC addresses included (empty array if none) */
  cc: string[];
}

/**
 * Invoice line input for creation.
 *
 * The optional VAT-control fields (`vat_category`, `supply_type`,
 * `place_of_supply`, `vat_override_reason`) drive the server-side authoritative
 * VAT resolution. When the submitted `tax_rate` is inconsistent with the
 * seller/buyer context (e.g. 20 % on an intra-EU B2B sale to a VAT-registered
 * buyer) **and** no `vat_override_reason` is given, the API replies
 * `409 VAT_CORRECTION_REQUIRED` ({@link VatCorrectionRequiredError}) instead of
 * persisting the invoice.
 */
export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  /**
   * Explicit VAT category. When omitted, the server resolves it from the
   * seller/buyer context (recommended: let the server decide, or use
   * {@link createInvoiceLine}).
   */
  vat_category?: import('./vat.js').VatCategory | undefined;
  /**
   * Supply nature — DISCRIMINATES intra-EU/export exemption:
   * goods → `INTRACOM_GOODS` (K) / `EXPORT` (G); services → `REVERSE_CHARGE`
   * (AE) / `OUT_OF_SCOPE` (O). Defaults to `services`.
   */
  supply_type?: 'goods' | 'services' | undefined;
  /**
   * ISO 3166-1 alpha-2 country where the supply is effectively delivered
   * (art. 259-A CGI override).
   */
  place_of_supply?: string | undefined;
  /**
   * Justification to keep a divergent tax rate (avoids the
   * `409 VAT_CORRECTION_REQUIRED`, recorded for the fiscal audit trail).
   * Max 500 chars.
   */
  vat_override_reason?: string | undefined;
  /**
   * Pre-fill this line from a catalog product (server copies label, unit price
   * and default VAT rate; values provided here override them). @since 2.38.0
   */
  product_id?: string | undefined;
  /**
   * Save this line as a catalog product (server-side upsert). @since 2.38.0
   */
  save_to_catalog?: boolean | undefined;
  /**
   * File the saved product under this catalog category (used together with
   * `save_to_catalog`). @since 2.38.0
   */
  product_category_id?: string | undefined;
  /** Arbitrary application-specific metadata forwarded as-is. */
  metadata?: Record<string, unknown> | undefined;
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
  /**
   * Invoice type for standalone deposit workflows (without a parent quote).
   *
   * - `'standard'` (default): regular invoice
   * - `'deposit'`: standalone deposit/acompte invoice — debits TVA immediately
   *   (CGI art. 289). Creates or joins a deposit group.
   * - `'balance'`: final balance/solde invoice that deducts prior deposits
   *   (Factur-X BG-22 code '80').
   *
   * When used with a parent quote, this field is set automatically by
   * `quotes.convertToDeposit()` / `quotes.convertToBalance()`.
   * Available since SDK 2.15.0.
   */
  invoice_type?: InvoiceType | undefined;
  /**
   * UUID of an existing deposit group to join.
   *
   * - `undefined` / `null`: creates a new deposit group (only relevant when
   *   `invoice_type` is `'deposit'`).
   * - Existing UUID: links this invoice to an existing group. The UUID must
   *   belong to a deposit group owned by the same tenant/sub-tenant
   *   (anti-IDOR: server returns 404 otherwise).
   *
   * Available since SDK 2.15.0.
   */
  deposit_group_id?: string | null | undefined;
  /**
   * Total pre-tax amount of the commercial deal (HT).
   * Stored on the deposit group at creation time; ignored when joining an
   * existing group (`deposit_group_id` provided). Available since SDK 2.15.0.
   */
  deposit_total_ht?: number | undefined;
  /**
   * Free-text reference for the deposit group (purchase order number, contract
   * reference, etc.). Max 500 characters. Available since SDK 2.15.0.
   */
  deposit_reference_text?: string | undefined;
  /**
   * UUID of a quote to link this standard invoice to.
   *
   * Only accepted when `invoice_type` is `'standard'` (or omitted, which
   * defaults to standard). For `'deposit'` / `'balance'` invoices, use the
   * dedicated `quotes.convertToDeposit()` / `quotes.convertToBalance()`
   * endpoints instead — passing `parent_quote_id` with a non-standard
   * `invoice_type` results in HTTP 422.
   *
   * Anti-IDOR: the quote must belong to the current tenant (and matching
   * sub-tenant scope when applicable). The server returns HTTP 404 if the
   * quote UUID does not resolve under the caller's scope.
   *
   * Available since SDK 2.21.0 (API 2026-05-27).
   */
  parent_quote_id?: UUID | undefined;
}

/**
 * Update a draft invoice. All fields are optional (partial update).
 */
export type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, 'direction' | 'output_format'>>;

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
 * Input for marking an invoice (incoming or outgoing) as paid.
 *
 * Since v2.25.0 (API 2026-05-28), `payment_means_code` is **REQUIRED**
 * by the backend (`MarkPaidRequest::rules()`). The server returns
 * HTTP 422 with the validation error `payment_means_code.required` if
 * the field is omitted.
 *
 * Frontends should pre-fill the dropdown with a sensible default (most
 * commonly `'30'` — credit transfer, or `'58'` — SEPA credit transfer
 * for French B2B) to avoid friction.
 *
 * @see {@link PaymentMeansCode} for the allowed UN/ECE 4461 values.
 */
export interface MarkPaidInput {
  /**
   * Payment means code (UN/ECE 4461 — Factur-X BT-81).
   *
   * **REQUIRED** since API 2026-05-28. Common B2B France values:
   *  - `'58'` — SEPA credit transfer (preferred)
   *  - `'30'` — Generic credit transfer
   *  - `'20'` — Cheque
   *  - `'48'` — Bank card
   *
   * @since 2.25.0
   */
  payment_means_code: PaymentMeansCode;
  /**
   * Optional free-text label for the payment means (Factur-X BT-82).
   * Max 100 characters. Use to disambiguate a generic code (e.g.
   * `'BNP Paribas'` for code `'58'`).
   *
   * @since 2.25.0
   */
  payment_means_text?: string | undefined;
  /** Payment reference (bank transfer ID, check number, etc.) — max 100 chars. */
  payment_reference?: string | undefined;
  /** Payment date (ISO 8601) - defaults to current date/time if not provided */
  paid_at?: DateTimeString | undefined;
  /** Optional note about the payment — max 500 chars. */
  note?: string | undefined;
}

/**
 * Invoice file download format
 */
export type InvoiceFileFormat = 'pdf' | 'xml';

/**
 * Credit Notes types (direct user / dashboard)
 *
 * @packageDocumentation
 */

import type {
  CurrencyCode,
  DateTimeString,
  PaginationOptions,
  UUID,
} from './common.js';
import type { PaymentMeansCode } from './enums.js';

/**
 * A credit note item AS RETURNED by the API (response shape).
 *
 * These fields are computed server-side by **inheriting** the referenced
 * invoice line — you never set `unit_price`/`tax_rate` yourself when creating
 * a credit note (see {@link CreditNoteLineSelection}). The `tax_rate` mirrors
 * the EXACT rate of the source invoice line (an invoice may carry several
 * rates: 5.5 %, 20 %, VAT-exempt 0 %, …), so a partial credit on an exempt
 * line stays at 0 %.
 *
 * @since 2.32.0 — added `invoice_line_id` + `category` (per-line VAT category).
 */
export interface CreditNoteItem {
  /** UUID of the original invoice line this item credits. */
  invoice_line_id?: UUID;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  /** VAT category inherited from the source invoice line. */
  category?: string | null;
}

/**
 * Line selection for **creating** a partial credit note (input shape).
 *
 * A credit note can NEVER invent amounts: each selected line MUST reference an
 * existing line of the source invoice via `invoice_line_id`. The unit price and
 * the VAT rate are inherited from that line (per-line, so multi-rate invoices
 * are handled correctly). Omit `quantity` to credit the line's full quantity.
 *
 * Discover the creditable lines first with
 * {@link CreditNotesResource.remainingCreditable}.
 *
 * @since 2.32.0
 */
export interface CreditNoteLineSelection {
  /**
   * UUID of the invoice line to credit. Must belong to `invoice_id`
   * (422 otherwise).
   */
  invoice_line_id: UUID;
  /** Quantity to credit. Defaults to the full line quantity when omitted. */
  quantity?: number;
}

/**
 * Credit Note (direct user)
 */
export interface CreditNote {
  id: UUID;
  invoice_id: UUID;
  number: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  currency: CurrencyCode;
  reason: string;
  items: CreditNoteItem[];
  created_at: DateTimeString;
  updated_at: DateTimeString;
  /**
   * Payment means code inherited from the source invoice when the
   * credit note refunds a fully paid invoice (Factur-X BT-81).
   *
   * `null` on credit notes issued against unpaid invoices or created
   * prior to API 2026-05-28.
   *
   * @see {@link PaymentMeansCode}
   * @since 2.25.0
   */
  payment_means_code?: PaymentMeansCode | null | undefined;
  /**
   * Optional free-text label for the payment means (Factur-X BT-82),
   * inherited from the source invoice. Max 100 characters.
   *
   * @since 2.25.0
   */
  payment_means_text?: string | null | undefined;
}

/**
 * Input for creating a credit note (avoir).
 *
 * A credit note ALWAYS targets an existing invoice (`invoice_id`) — it cannot
 * exist on its own. Two shapes:
 *
 * - `type: 'total'` — credits **every** line of the invoice. `items` is ignored.
 * - `type: 'partial'` — you MUST provide `items`, each selecting an original
 *   invoice line via `invoice_line_id` (the unit price and exact VAT rate are
 *   inherited per line). Use {@link CreditNotesResource.remainingCreditable}
 *   to list the lines that can still be credited, then select among them.
 *
 * @since 2.32.0 — added the required `type` field and switched `items` to
 *   {@link CreditNoteLineSelection} (line references, not free-form amounts).
 */
export interface CreateCreditNoteInput {
  /** UUID of the invoice to credit (required — an avoir cannot exist alone). */
  invoice_id: UUID;
  /** Reason for the credit note (mandatory). */
  reason: string;
  /** `'total'` credits all lines; `'partial'` requires `items`. */
  type: 'partial' | 'total';
  /**
   * Lines to credit — **required for `type: 'partial'`**, ignored for
   * `'total'`. Each entry references an original invoice line; amounts and VAT
   * are inherited from that line.
   */
  items?: CreditNoteLineSelection[];
  /**
   * Target a specific sub-tenant of the authenticated tenant. When
   * omitted, the credit note is created under the master tenant
   * directly. The server returns `404 SUB_TENANT_NOT_FOUND` if the
   * UUID does not belong to the current tenant (anti-IDOR).
   */
  sub_tenant_id?: UUID | undefined;
}

/**
 * One creditable line of an invoice, as returned by
 * {@link CreditNotesResource.remainingCreditable}. Reflects how much of the
 * line can STILL be credited after previous credit notes. @since 2.32.0
 */
export interface RemainingCreditableLine {
  /** UUID to pass back as `invoice_line_id` in a partial credit note. */
  invoice_line_id: UUID;
  description: string;
  original_quantity: number;
  credited_quantity: number;
  /** Quantity still creditable (`original − credited`). */
  remaining_quantity: number;
  unit_price: number;
  /** Exact VAT rate of the line (inherited as-is by the credit note). */
  tax_rate: number;
  /** Remaining creditable amount excl. tax (`remaining_quantity × unit_price`). */
  remaining_amount_ht: number;
}

/**
 * Response of {@link CreditNotesResource.remainingCreditable}. @since 2.32.0
 */
export interface RemainingCreditable {
  invoice_id: UUID;
  invoice_number: string;
  /** Per-line remaining creditable amounts (select from these). */
  items: RemainingCreditableLine[];
  total_remaining: number;
  /** False once the invoice is fully credited / not creditable. */
  can_be_credited: boolean;
}

/**
 * List options for credit notes
 */
export interface CreditNoteListOptions extends PaginationOptions {
  sort?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
}

/**
 * Payment Schedule types for Scell.io SDK
 *
 * Models an installment plan attached to a Quote. Each line represents one
 * payment milestone — either a percentage of the quote total or a fixed
 * amount — triggered by a calendar date and/or a free-text milestone label.
 *
 * Lines are editable while the quote is in `draft` or `sent` status.
 * They become immutable (locked) when the quote is accepted/signed.
 *
 * @packageDocumentation
 */

import type { DateString, DateTimeString, UUID } from './common.js';

// ---------------------------------------------------------------------------
// Enums / union types
// ---------------------------------------------------------------------------

/**
 * Determines how `amount_value` is interpreted:
 * - `'percent'` — a percentage of the quote's `total_ttc` (between 0.01 and 100)
 * - `'amount'` — an absolute amount in the quote's currency (strictly positive)
 */
export type AmountType = 'percent' | 'amount';

/**
 * Lifecycle status of a payment schedule line:
 * - `'pending'`  — not yet converted to an invoice
 * - `'invoiced'` — a deposit invoice has been created for this line
 * - `'cancelled'` — explicitly cancelled (line will not be invoiced)
 */
export type ScheduleLineStatus = 'pending' | 'invoiced' | 'cancelled';

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

/**
 * A single line in a quote's payment schedule.
 *
 * Constraints:
 * - At least one of `due_date` OR `milestone_label` must be non-null.
 * - `auto_generate` can only be `true` when `due_date` is set.
 * - Sum of all percent lines must be ≤ 100.
 * - `status === 'invoiced'` iff `invoice_id !== null`.
 */
export interface PaymentScheduleLine {
  id: UUID;
  quote_id: UUID;
  /** 1-based display order within the schedule */
  order: number;
  amount_type: AmountType;
  /** Percent (0.01–100) when `amount_type = 'percent'`, or absolute amount */
  amount_value: string;
  /**
   * TTC amount frozen at the time the quote is accepted.
   * NULL before acceptance (for percent lines, the actual TTC is unknown
   * until the quote total is finalized and accepted).
   */
  amount_ttc_snapshot: string | null;
  /** Calendar due date for this milestone (YYYY-MM-DD) */
  due_date: DateString | null;
  /** Free-text milestone label, e.g. "Livraison MVP" */
  milestone_label: string | null;
  /** Optional free-text description shown on the deposit invoice line */
  description: string | null;
  /**
   * When `true`, a deposit invoice is automatically generated in `draft`
   * status when `due_date` is reached (daily CRON at 06:00 UTC).
   * Only valid when `due_date` is set.
   */
  auto_generate: boolean;
  status: ScheduleLineStatus;
  /** UUID of the deposit invoice created for this line, or null */
  invoice_id: UUID | null;
  invoiced_at: DateTimeString | null;
  /** ISO timestamp when the line was locked (= `quote.accepted_at`) */
  locked_at: DateTimeString | null;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

// ---------------------------------------------------------------------------
// Summary (read-only, computed)
// ---------------------------------------------------------------------------

/** A line reference included in due / overdue sections of the summary */
export interface ScheduleLineSummaryRef {
  line_id: UUID;
  due_date: DateString | null;
  amount_ttc: string;
  label: string | null;
  /** Positive = days until due; negative = days overdue */
  days_until?: number;
  days_overdue?: number;
}

/** SuperPDP transmission status for an invoice referenced in the schedule */
export interface ScheduleInvoiceSuperPDPStatus {
  invoice_id: UUID;
  invoice_number: string;
  status: string;
  accepted_at: DateTimeString | null;
  paid_at: DateTimeString | null;
}

/**
 * Real-time summary of how much has been invoiced vs. remains on a quote.
 *
 * All monetary fields are string-formatted decimals (e.g. `"3000.00"`)
 * to preserve precision across environments.
 */
export interface PaymentSummary {
  quote: {
    id: UUID;
    quote_number: string;
    total_ttc: string;
  };
  schedule: {
    planned_total_ttc: string;
    planned_remainder: string;
    lines_count: number;
    pending_count: number;
    invoiced_count: number;
  };
  invoiced: {
    gross_ttc: string;
    credits_ttc: string;
    net_ttc: string;
    remaining_ttc: string;
    remaining_pct: number;
  };
  /** Next upcoming line (closest future due date), or null if none */
  next_due: ScheduleLineSummaryRef | null;
  /** Lines whose `due_date` has passed and have not yet been invoiced */
  overdue: ScheduleLineSummaryRef[];
  /** SUPER PDP status for each deposit invoice already issued */
  superpdp_status: ScheduleInvoiceSuperPDPStatus[];
  /**
   * Full payment schedule lines list (since v2.14.0).
   *
   * Permet au consumer d'afficher le tracker complet (toutes les
   * échéances + status + highlight de la next_due) sans seconde
   * requête `GET /payment-schedule`. Ordonné par `due_date` puis `order`.
   */
  lines: PaymentScheduleLine[];
}

// ---------------------------------------------------------------------------
// Preset
// ---------------------------------------------------------------------------

/**
 * A server-side preset template for quickly applying a common schedule pattern,
 * e.g. 30/70, 50/50, 3 monthly installments.
 */
export interface SchedulePreset {
  /** Machine-readable key, e.g. `'30-70'` */
  key: string;
  /** Human-readable label, e.g. `'30% / 70%'` */
  label: string;
  /** Template lines — apply via `paymentSchedule.set(quoteId, preset.lines)` */
  lines: PaymentScheduleLineInput[];
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

/**
 * Input for a single schedule line (creation or bulk replacement).
 *
 * At least one of `due_date` or `milestone_label` must be provided.
 */
export interface PaymentScheduleLineInput {
  amount_type: AmountType;
  /** Percent (0.01–100) or absolute amount, depending on `amount_type` */
  amount_value: number;
  /** Calendar due date (YYYY-MM-DD). Required if `auto_generate = true`. */
  due_date?: DateString | null | undefined;
  /** Free-text milestone label */
  milestone_label?: string | null | undefined;
  /** Optional description carried onto the deposit invoice */
  description?: string | null | undefined;
  /**
   * Automatically generate a deposit invoice draft when `due_date` arrives.
   * Requires `due_date` to be set.
   * @default false
   */
  auto_generate?: boolean | undefined;
}

/**
 * Input for a partial line update (used in the `update` array of `patch()`).
 */
export interface PaymentScheduleLineUpdateInput {
  /** UUID of the line to update */
  id: UUID;
  due_date?: DateString | null | undefined;
  milestone_label?: string | null | undefined;
  description?: string | null | undefined;
  auto_generate?: boolean | undefined;
  amount_type?: AmountType | undefined;
  amount_value?: number | undefined;
}

/**
 * Input for a partial schedule update.
 * All three arrays are optional; you can mix add/update/remove in one call.
 */
export interface PatchPaymentScheduleInput {
  /** New lines to append to the schedule */
  add?: PaymentScheduleLineInput[] | undefined;
  /** Partial updates to existing lines (identified by `id`) */
  update?: PaymentScheduleLineUpdateInput[] | undefined;
  /** UUIDs of lines to remove (only `pending` lines can be removed) */
  remove?: UUID[] | undefined;
}

/**
 * Input for converting a pending schedule line into a deposit invoice.
 */
export interface ConvertScheduleLineInput {
  /**
   * Override the line's `due_date` for the deposit invoice due date.
   * When omitted, uses the line's own `due_date` (if any).
   */
  due_date?: DateString | undefined;
  /**
   * Override the description used as the deposit invoice line label.
   * When omitted, falls back to `milestone_label` then the line's `description`.
   */
  label?: string | undefined;
  /**
   * When `true`, the generated invoice is validated and sent by email to the
   * buyer immediately (requires a resolvable buyer email — see `buyer_billing_email`
   * / `buyer_email`). A 422 `BUYER_HAS_NO_EMAIL` is returned if no email can be
   * resolved.
   * @default false
   */
  send_email?: boolean | undefined;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * Response shape returned by `GET /quotes/{quote}/payment-schedule`.
 */
export interface PaymentScheduleResponse {
  data: PaymentScheduleLine[];
  meta: {
    lines_count: number;
    pending_count: number;
    invoiced_count: number;
    cancelled_count: number;
  };
}

/**
 * Recurring invoice profile types (scoped tenant + sub_tenant).
 *
 * A recurring invoice **profile** is a template + schedule that the platform
 * uses to emit invoices automatically on a cadence (monthly subscription,
 * weekly retainer, yearly licence…). Each emission produces an
 * {@link RecurringInvoiceOccurrence} that links to the concrete invoice that
 * was generated.
 *
 * The profile carries the buyer identity, the line items and a
 * {@link RecurrenceConfig}. Mutating a profile never rewrites already-emitted
 * occurrences (the issued invoices stay immutable — ISCA fiscal compliance);
 * changes only affect future runs.
 *
 * @since 2.33.0
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
import type {
  RecurrenceEndMode,
  RecurrenceIntervalUnit,
  RecurringEmissionMode,
  RecurringOccurrenceStatus,
  RecurringProfileStatus,
} from './enums.js';
import type { InvoiceFormat } from './invoices.js';

/**
 * Recurrence cadence configuration resolved on a recurring invoice profile.
 *
 * Mirrors the server-side recurrence rule. `interval_count` multiplies the
 * `interval_unit` (e.g. `unit: 'week', count: 2` → every two weeks).
 * `day_of_month` / `day_of_week` pin the run day when relevant.
 */
export interface RecurrenceConfig {
  /** Base cadence unit. */
  interval_unit: RecurrenceIntervalUnit;
  /** How many `interval_unit` between two runs (default `1`). */
  interval_count: number;
  /**
   * Day of month (1-31) used when `interval_unit` is `'month'` or `'year'`.
   * `null` when not applicable. The server clamps to the last day for short
   * months (e.g. 31 → 28/29 in February).
   */
  day_of_month: number | null;
  /**
   * Day of week (0=Sunday … 6=Saturday) used when `interval_unit` is
   * `'week'`. `null` when not applicable.
   */
  day_of_week: number | null;
  /** Human-readable, server-localized description (e.g. "Tous les mois le 1er"). */
  human: string;
}

/**
 * Line item carried by a recurring invoice profile. Each emission copies these
 * lines onto the generated invoice.
 */
export interface RecurringInvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  /** Unit of measure label (e.g. "h", "jour", "licence"). Optional. */
  unit?: string;
  /** Per-line discount (same currency as the profile). Optional. */
  discount?: number;
  /** VAT category hint forwarded to the Factur-X generator. Optional. */
  category?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Per-occurrence cadence config input on create/update.
 *
 * Only `interval_unit` is required; the rest fall back to server defaults
 * (`interval_count` → 1, day pinning derived from `start_date`).
 */
export interface RecurrenceConfigInput {
  interval_unit: RecurrenceIntervalUnit;
  interval_count?: number;
  /** Day of month (1-31) for `'month'` / `'year'` cadences. */
  day_of_month?: number;
  /** Day of week (0=Sunday … 6=Saturday) for `'week'` cadence. */
  day_of_week?: number;
}

/**
 * Resolved totals snapshot for a recurring invoice profile (per occurrence).
 */
export interface RecurringInvoiceTotals {
  total_ht: number;
  total_tax: number;
  total_ttc: number;
}

/**
 * A single scheduled (or already emitted) run of a recurring invoice profile.
 */
export interface RecurringInvoiceOccurrence {
  id: UUID;
  recurring_profile_id: UUID;
  /** 1-based index of the occurrence within the profile's lifetime. */
  occurrence_number: number;
  /** Scheduled emission date (ISO `YYYY-MM-DD`). */
  occurrence_date: DateString;
  status: RecurringOccurrenceStatus;
  /** Linked invoice once emitted (`null` while pending / skipped / failed). */
  invoice_id: UUID | null;
  /** Human invoice number once emitted (`null` otherwise). */
  invoice_number: string | null;
  /** Number of emission attempts so far. */
  attempts: number;
  /** Last error message when `status === 'failed'` (`null` otherwise). */
  last_error: string | null;
  emitted_at: DateTimeString | null;
  failed_at: DateTimeString | null;
  created_at: DateTimeString;
}

/**
 * Recurring invoice profile (subscription template + schedule).
 */
export interface RecurringInvoiceProfile {
  id: UUID;
  title: string;
  status: RecurringProfileStatus;
  emission_mode: RecurringEmissionMode;
  environment: Environment;
  tenant_id: UUID;
  sub_tenant_id: UUID | null;
  company_id: UUID;
  buyer_id: UUID | null;
  buyer_name: string;
  currency: CurrencyCode;
  output_format: InvoiceFormat;
  payment_terms: string | null;
  recurrence: RecurrenceConfig;
  /** First scheduled emission date (ISO `YYYY-MM-DD`). */
  start_date: DateString;
  end_mode: RecurrenceEndMode;
  /** End date when `end_mode === 'on_date'` (`null` otherwise). */
  end_date: DateString | null;
  /** Cap when `end_mode === 'after_occurrences'` (`null` otherwise). */
  max_occurrences: number | null;
  /** Days before each run to send a reminder notification (`null` to disable). */
  notify_before_days: number | null;
  /** Next scheduled run (`null` when the profile is paused / completed / cancelled). */
  next_run_at: DateTimeString | null;
  /** Number of occurrences already emitted. */
  occurrences_count: number;
  /** Date of the most recent emitted occurrence (`null` if none yet). */
  last_emitted_on: DateString | null;
  lines: InvoiceFormatLine[];
  totals: RecurringInvoiceTotals;
  /** Optionally embedded occurrences (when the endpoint expands them). */
  occurrences?: RecurringInvoiceOccurrence[];
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/**
 * Resolved line item as returned on a profile (mirrors the emitted invoice line
 * shape: per-line computed totals alongside the raw inputs).
 */
export interface InvoiceFormatLine {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  unit: string | null;
  discount: number | null;
  category: string | null;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
}

/**
 * Payload to create a recurring invoice profile.
 *
 * The buyer can be provided either by `buyer_id` (registry shortcut — the
 * registry's current state is snapshotted onto each emission) or via inline
 * `buyer_*` fields. `currency` defaults to `'EUR'` server-side.
 */
export interface CreateRecurringInvoiceInput {
  /** Human label for the profile (e.g. "Abonnement mensuel — Acme"). */
  title: string;
  sub_tenant_id?: UUID;
  /** Buyer from the registry (recommended). Mutually exclusive with inline `buyer_*`. */
  buyer_id?: UUID;
  buyer_name?: string;
  buyer_country?: string;
  buyer_is_individual?: boolean;
  buyer_siret?: string;
  buyer_vat_number?: string;
  buyer_email?: string;
  buyer_address?: Address;
  buyer_shipping_address?: Address;
  /** ISO 4217 currency code (default `'EUR'`). */
  currency?: CurrencyCode;
  /** Output document format (default `'facturx'`). */
  output_format?: InvoiceFormat;
  payment_terms?: string;
  /** Line items copied onto every emitted invoice (at least one required). */
  lines: RecurringInvoiceLineInput[];
  /** Cadence configuration (required). */
  recurrence: RecurrenceConfigInput;
  /** First emission date (ISO `YYYY-MM-DD`, required). */
  start_date: DateString;
  /** How the recurrence terminates (default `'never'`). */
  end_mode?: RecurrenceEndMode;
  /** Required when `end_mode === 'on_date'`. */
  end_date?: DateString;
  /** Required when `end_mode === 'after_occurrences'`. */
  max_occurrences?: number;
  /** `'draft'` stages each occurrence as a draft; `'auto_send'` emits + sends. */
  emission_mode?: RecurringEmissionMode;
  /** Days before each run to send a reminder (omit to disable). */
  notify_before_days?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Payload to update a recurring invoice profile. Every field is optional; only
 * future occurrences are affected.
 */
export type UpdateRecurringInvoiceInput = Partial<CreateRecurringInvoiceInput>;

/**
 * Query parameters for {@link RecurringInvoicesResource.list}.
 */
export interface RecurringInvoiceListOptions {
  status?: RecurringProfileStatus;
  sub_tenant_id?: UUID;
  per_page?: number;
  page?: number;
}

/**
 * Query parameters for {@link RecurringInvoicesResource.occurrences}.
 */
export interface RecurringInvoiceOccurrenceListOptions {
  status?: RecurringOccurrenceStatus;
  per_page?: number;
  page?: number;
}

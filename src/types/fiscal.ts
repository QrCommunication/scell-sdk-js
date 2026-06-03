/**
 * Fiscal Compliance Types
 *
 * Types for the fiscal compliance API (LF 2026).
 *
 * @packageDocumentation
 */

// ── Compliance Dashboard ────────────────────────────────────

export interface FiscalComplianceData {
  closing_coverage_percent: number;
  chain_integrity_percent: number;
  open_incidents: FiscalIncident[];
  open_incidents_count: number;
  overall_status: FiscalComplianceStatus;
  last_integrity_check_at: string | null;
  last_closing_at: string | null;
  last_closing_date: string | null;
  total_fiscal_entries: number;
  days_with_activity: number;
  days_closed: number;
  attestation_status: FiscalAttestationStatus;
}

export type FiscalComplianceStatus = 'CONFORME' | 'ALERTE' | 'NON_CONFORME';

export interface FiscalIncident {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  since?: string;
  count?: number;
}

export interface FiscalAttestationStatus {
  current: boolean;
  software_version: string;
  attestation_version: string | null;
  needs_renewal: boolean;
  reason: string | null;
}

// ── Integrity ───────────────────────────────────────────────

export interface FiscalIntegrityReport {
  is_valid: boolean;
  entries_checked: number;
  broken_links: number;
  details?: Record<string, unknown>;
}

export interface FiscalIntegrityCheck {
  id: string;
  tenant_id: string;
  result: 'passed' | 'failed';
  entries_checked: number;
  broken_links: number;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface FiscalIntegrityOptions {
  date_from?: string;
  date_to?: string;
}

export interface FiscalIntegrityHistoryOptions {
  per_page?: number;
}

// ── Closings ────────────────────────────────────────────────

/**
 * Detail by-calendar for OpenTimestamps blockchain anchoring.
 * Tracks each calendar server's success/failure independently.
 */
export interface FiscalClosingOtsCalendar {
  /** Calendar URL (e.g. `https://alice.btc.calendar.opentimestamps.org`) */
  calendar: string;
  /** Whether the calendar accepted the submit */
  ok: boolean;
  /** Error message if ok is false */
  error?: string | null;
}

/**
 * Raw totals snapshot for a fiscal closing. Keys reflect the backend
 * service `FiscalClosingService::calculateTotals()`.
 */
export interface FiscalClosingTotals {
  invoices_count?: number;
  invoices_total_ht?: number;
  invoices_total_ttc?: number;
  invoices_total_tax?: number;
  credit_notes_count?: number;
  credit_notes_total?: number;
  total_entries?: number;
}

/**
 * A daily / monthly / annual fiscal closing record from the immutable
 * ledger. Each closing seals a period with a SHA-256 `closing_hash`
 * chained to the previous closing of the same `(tenant, sub_tenant)`
 * pair (ISCA self-certification).
 *
 * @since 2.10.0 OTS fields added (`ots_proof_base64`, `ots_status`,
 *               `ots_submitted_at`, `ots_bitcoin_confirmed_at`,
 *               `ots_calendars`). The raw binary `ots_proof` BYTEA
 *               column is intentionally NOT exposed (non-UTF8 string
 *               made `json_encode()` crash; backend now ships a
 *               JSON-safe base64 representation).
 */
export interface FiscalClosing {
  id: string;
  tenant_id: string;
  /** Null for the master tenant's own flows; UUID for a sub-tenant closing. */
  sub_tenant_id?: string | null;
  closing_date: string;
  closing_type: 'daily' | 'monthly' | 'annual' | (string & {});
  status: 'closed' | 'anchored' | (string & {});
  entries_count: number;

  // Legacy / derived fields (kept for backward compat with pre-2.10.0 payloads)
  total_debit?: number;
  total_credit?: number;
  /** Alias of `closing_hash` in older API responses. */
  chain_hash?: string;

  // Sequence + chain hash
  first_sequence_number?: number;
  last_sequence_number?: number;
  closing_hash?: string;
  previous_closing_hash?: string | null;

  // Totals
  totals?: FiscalClosingTotals;
  cumulative_totals?: Record<string, number>;

  environment?: 'sandbox' | 'production' | (string & {});

  // CSV export (daily closing format)
  csv_path?: string | null;
  csv_hash?: string | null;

  /**
   * OpenTimestamps receipt anchoring `closing_hash` into Bitcoin,
   * encoded in base64 (the underlying BYTEA blob is not UTF-8 safe).
   *
   * To verify externally:
   * ```ts
   * import { writeFileSync } from 'node:fs';
   * const raw = Buffer.from(closing.ots_proof_base64, 'base64');
   * writeFileSync(`./${closing.id}.ots`, raw);
   * // then: $ ots verify ./xxx.ots
   * ```
   *
   * Null until the closing has been submitted to OTS calendar servers.
   */
  ots_proof_base64?: string | null;
  ots_status?: 'pending' | 'bitcoin_confirmed' | 'failed' | null;
  ots_submitted_at?: string | null;
  ots_bitcoin_confirmed_at?: string | null;
  ots_calendars?: FiscalClosingOtsCalendar[] | null;

  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface FiscalClosingsOptions {
  limit?: number;
}

export interface FiscalDailyClosingInput {
  date?: string;
}

// ── FEC Export ───────────────────────────────────────────────

export interface FiscalFecExportOptions {
  start_date: string;
  end_date: string;
  format?: 'pipe' | 'tab';
  download?: boolean;
}

export interface FiscalFecExportResult {
  period: {
    start_date: string;
    end_date: string;
  };
  format: string;
  file_path: string;
}

// ── Attestation ─────────────────────────────────────────────

export interface FiscalAttestation {
  year: number;
  tenant_name: string;
  software_version: string;
  compliance: Record<string, unknown>;
  generated_at?: string;
  certificate_hash?: string;
}

// ── Entries (Ledger) ────────────────────────────────────────

export interface FiscalEntry {
  id: string;
  tenant_id: string;
  sequence_number: number;
  entry_type: string;
  fiscal_date: string;
  entity_type?: string | null;
  entity_id?: string | null;
  data_snapshot?: Record<string, unknown> | null;
  data_hash?: string;
  previous_hash?: string;
  chain_hash?: string;
  environment?: string;
  legal_status?: string;
  created_at?: string;
}

export interface FiscalEntriesOptions {
  date_from?: string;
  date_to?: string;
  entry_type?: string;
  environment?: 'production' | 'sandbox';
  per_page?: number;
}

// ── Kill Switch ─────────────────────────────────────────────

export interface FiscalKillSwitchStatus {
  is_active: boolean;
  kill_switch: FiscalKillSwitch | null;
}

export interface FiscalKillSwitch {
  id: string;
  tenant_id: string;
  is_active: boolean;
  activated_at: string;
  reason: string;
  activated_by: string;
  deactivated_at?: string | null;
  deactivated_by?: string | null;
}

export interface FiscalKillSwitchActivateInput {
  /** Detailed reason, **>= 20 characters**, recorded in the immutable ledger. */
  reason: string;
  /**
   * Out-of-band (OOB) confirmation token, required in **production** to finalise
   * the step-up. The first call (without it) returns `403`
   * `OOB_CONFIRMATION_REQUIRED` and emails the token to the tenant contact;
   * re-submit with this field to apply. Omit in sandbox.
   */
  confirmation_token?: string;
}

/**
 * Deactivation shares the same step-up contract as activation: a `reason`
 * (>= 20 chars) and, in production, an out-of-band `confirmation_token`.
 */
export interface FiscalKillSwitchDeactivateInput {
  /** Detailed reason, **>= 20 characters**, recorded in the immutable ledger. */
  reason: string;
  /**
   * Out-of-band (OOB) confirmation token, required in **production**. The first
   * call returns `403` `OOB_CONFIRMATION_REQUIRED` and emails the token; re-submit
   * with this field to apply. Omit in sandbox.
   */
  confirmation_token?: string;
}

// ── Anchors ─────────────────────────────────────────────────

export interface FiscalAnchor {
  id: string;
  tenant_id: string;
  anchor_type: string;
  source_hash: string;
  anchor_reference?: string | null;
  anchor_provider?: string | null;
  anchored_at?: string | null;
  created_at?: string;
}

export interface FiscalAnchorsOptions {
  limit?: number;
}

// ── Rules ───────────────────────────────────────────────────

export type FiscalRuleCategory = 'vat' | 'invoicing' | 'credit_note' | 'closing' | 'export';

export interface FiscalRule {
  id: string;
  rule_key: string;
  name: string;
  category: FiscalRuleCategory;
  rule_definition: Record<string, unknown>;
  version: number;
  effective_from: string;
  effective_until?: string | null;
  legal_reference?: string | null;
  tenant_id?: string | null;
  description?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface FiscalRulesOptions {
  date?: string;
  category?: FiscalRuleCategory;
}

export interface FiscalCreateRuleInput {
  rule_key: string;
  name: string;
  category: FiscalRuleCategory;
  rule_definition: Record<string, unknown>;
  effective_from: string;
  effective_until?: string;
  legal_reference?: string;
}

export interface FiscalUpdateRuleInput {
  rule_definition: Record<string, unknown>;
  effective_from?: string;
  effective_until?: string;
  legal_reference?: string;
}

export interface FiscalExportRulesOptions {
  start_date: string;
  end_date: string;
}

export interface FiscalReplayRulesInput {
  start_date: string;
  end_date: string;
}

// ── Forensic Export ─────────────────────────────────────────

export type FiscalForensicExportType = 'chronology' | 'graph' | 'report';

export interface FiscalForensicExportOptions {
  start_date: string;
  end_date: string;
  type?: FiscalForensicExportType;
}

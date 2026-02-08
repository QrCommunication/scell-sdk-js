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

export interface FiscalClosing {
  id: string;
  tenant_id: string;
  closing_date: string;
  closing_type: string;
  status: string;
  entries_count: number;
  total_debit: number;
  total_credit: number;
  chain_hash?: string;
  environment?: string;
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
  reason: string;
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

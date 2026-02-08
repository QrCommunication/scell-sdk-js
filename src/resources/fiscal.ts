/**
 * Fiscal Compliance Resource
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { MessageResponse, PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  FiscalAnchor,
  FiscalAnchorsOptions,
  FiscalAttestation,
  FiscalClosing,
  FiscalClosingsOptions,
  FiscalComplianceData,
  FiscalCreateRuleInput,
  FiscalDailyClosingInput,
  FiscalEntriesOptions,
  FiscalEntry,
  FiscalExportRulesOptions,
  FiscalFecExportOptions,
  FiscalFecExportResult,
  FiscalForensicExportOptions,
  FiscalIntegrityHistoryOptions,
  FiscalIntegrityOptions,
  FiscalIntegrityReport,
  FiscalKillSwitchActivateInput,
  FiscalKillSwitchStatus,
  FiscalReplayRulesInput,
  FiscalRule,
  FiscalRulesOptions,
  FiscalUpdateRuleInput,
} from '../types/fiscal.js';

export class FiscalResource {
  constructor(private readonly http: HttpClient) {}

  async compliance(requestOptions?: RequestOptions): Promise<SingleResponse<FiscalComplianceData>> {
    return this.http.get<SingleResponse<FiscalComplianceData>>('/tenant/fiscal/compliance', undefined, requestOptions);
  }

  async integrity(options: FiscalIntegrityOptions = {}, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalIntegrityReport>> {
    return this.http.get<SingleResponse<FiscalIntegrityReport>>('/tenant/fiscal/integrity', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async integrityHistory(options: FiscalIntegrityHistoryOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalIntegrityReport>> {
    return this.http.get<PaginatedResponse<FiscalIntegrityReport>>('/tenant/fiscal/integrity/history', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async integrityForDate(date: string, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalIntegrityReport>> {
    return this.http.get<SingleResponse<FiscalIntegrityReport>>(`/tenant/fiscal/integrity/${date}`, undefined, requestOptions);
  }

  async closings(options: FiscalClosingsOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalClosing>> {
    return this.http.get<PaginatedResponse<FiscalClosing>>('/tenant/fiscal/closings', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async performDailyClosing(input: FiscalDailyClosingInput = {}, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/fiscal/closings/daily', input, requestOptions);
  }

  async fecExport(options: FiscalFecExportOptions, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalFecExportResult>> {
    return this.http.get<SingleResponse<FiscalFecExportResult>>('/tenant/fiscal/fec', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async fecDownload(options: FiscalFecExportOptions, requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.getRaw('/tenant/fiscal/fec', { ...options, download: true } as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async attestation(year: number, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalAttestation>> {
    return this.http.get<SingleResponse<FiscalAttestation>>(`/tenant/fiscal/attestation/${year}`, undefined, requestOptions);
  }

  async attestationDownload(year: number, requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.getRaw(`/tenant/fiscal/attestation/${year}/download`, undefined, requestOptions);
  }

  async entries(options: FiscalEntriesOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalEntry>> {
    return this.http.get<PaginatedResponse<FiscalEntry>>('/tenant/fiscal/entries', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async killSwitchStatus(requestOptions?: RequestOptions): Promise<SingleResponse<FiscalKillSwitchStatus>> {
    return this.http.get<SingleResponse<FiscalKillSwitchStatus>>('/tenant/fiscal/kill-switch/status', undefined, requestOptions);
  }

  async killSwitchActivate(input: FiscalKillSwitchActivateInput, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/fiscal/kill-switch/activate', input, requestOptions);
  }

  async killSwitchDeactivate(requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/fiscal/kill-switch/deactivate', undefined, requestOptions);
  }

  async anchors(options: FiscalAnchorsOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalAnchor>> {
    return this.http.get<PaginatedResponse<FiscalAnchor>>('/tenant/fiscal/anchors', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async rules(options: FiscalRulesOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalRule>> {
    return this.http.get<PaginatedResponse<FiscalRule>>('/tenant/fiscal/rules', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async ruleDetail(key: string, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalRule>> {
    return this.http.get<SingleResponse<FiscalRule>>(`/tenant/fiscal/rules/${key}`, undefined, requestOptions);
  }

  async ruleHistory(key: string, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalRule>> {
    return this.http.get<PaginatedResponse<FiscalRule>>(`/tenant/fiscal/rules/${key}/history`, undefined, requestOptions);
  }

  async createRule(input: FiscalCreateRuleInput, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalRule>> {
    return this.http.post<SingleResponse<FiscalRule>>('/tenant/fiscal/rules', input, requestOptions);
  }

  async updateRule(id: string, input: FiscalUpdateRuleInput, requestOptions?: RequestOptions): Promise<SingleResponse<FiscalRule>> {
    return this.http.post<SingleResponse<FiscalRule>>(`/tenant/fiscal/rules/${id}`, input, requestOptions);
  }

  async exportRules(options: FiscalExportRulesOptions, requestOptions?: RequestOptions): Promise<SingleResponse<Record<string, unknown>>> {
    return this.http.get<SingleResponse<Record<string, unknown>>>('/tenant/fiscal/rules/export', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async replayRules(input: FiscalReplayRulesInput, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/fiscal/rules/replay', input, requestOptions);
  }

  async forensicExport(options: FiscalForensicExportOptions, requestOptions?: RequestOptions): Promise<SingleResponse<Record<string, unknown>>> {
    return this.http.get<SingleResponse<Record<string, unknown>>>('/tenant/fiscal/forensic-export', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }
}

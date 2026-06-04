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
  FiscalKillSwitchDeactivateInput,
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

  /**
   * Download a closing's CSV (market format) as raw bytes (since v2.30.0).
   *
   * Tenant-scoped: a closing belonging to another tenant returns 404.
   * Works for daily, monthly and annual closings — including a
   * sub-tenant's isolated chain.
   *
   * @example
   * ```typescript
   * const { data } = await client.fiscal.closings({ closing_type: 'monthly', sub_tenant_id });
   * const csv = await client.fiscal.downloadClosing(data[0].id);
   * writeFileSync('closing.csv', Buffer.from(csv));
   * ```
   */
  async downloadClosing(closingId: string, requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.getRaw(`/tenant/fiscal/closings/${closingId}/download`, undefined, requestOptions);
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

  /**
   * Telecharge l'auto-attestation ISCA NOMINATIVE (PDF) pour le tenant
   * authentifie ou pour un sub_tenant specifique.
   *
   * Le PDF inclut :
   *   - Identite du logiciel (Scell.io + version)
   *   - Identite de l'editeur (QR Communication SAS)
   *   - **Identite nominative du beneficiaire** (tenant ou sub_tenant : nom,
   *     SIRET, TVA, adresse, contact, statut KYB/KYC)
   *   - Declaration de conformite (4 piliers ISCA : I, S, C, A)
   *   - Empreinte d'integrite SHA-256 du document
   *
   * Le hash couvre l'identite du beneficiaire, donc 2 attestations pour
   * 2 beneficiaires differents auront 2 hashes differents — preuve
   * cryptographique de la nominative.
   *
   * @param subTenantId Optionnel. Si fourni, attestation emise pour ce
   *   sub_tenant (404 si introuvable ou n'appartient pas au tenant).
   *   Sinon, attestation emise pour le tenant authentifie.
   * @returns ArrayBuffer du PDF binaire (a sauvegarder ou afficher).
   *
   * @example
   * // Attestation pour le tenant
   * const pdf = await scell.fiscal.iscaSelfAttestationDownload();
   * fs.writeFileSync('attestation-tenant.pdf', Buffer.from(pdf));
   *
   * @example
   * // Attestation pour un sub_tenant
   * const pdf = await scell.fiscal.iscaSelfAttestationDownload('019d5ea8-...');
   * fs.writeFileSync('attestation-sub.pdf', Buffer.from(pdf));
   */
  async iscaSelfAttestationDownload(
    subTenantId?: string,
    requestOptions?: RequestOptions,
  ): Promise<ArrayBuffer> {
    const path = subTenantId
      ? `/tenant/fiscal/isca/self-attestation/${subTenantId}/download`
      : '/tenant/fiscal/isca/self-attestation/download';
    return this.http.getRaw(path, undefined, requestOptions);
  }

  /**
   * Telecharge le registre des mesures ISCA (PDF). Document non-nominatif
   * decrivant les mesures techniques de conformite implementees par Scell.io.
   */
  async iscaMeasuresRegisterDownload(requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.getRaw('/tenant/fiscal/isca/measures-register/download', undefined, requestOptions);
  }

  /**
   * Telecharge le dossier technique ISCA (PDF). Document non-nominatif
   * decrivant l'architecture technique conforme aux exigences NF Z 42-025.
   */
  async iscaTechnicalDossierDownload(requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.getRaw('/tenant/fiscal/isca/technical-dossier/download', undefined, requestOptions);
  }

  async entries(options: FiscalEntriesOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<FiscalEntry>> {
    return this.http.get<PaginatedResponse<FiscalEntry>>('/tenant/fiscal/entries', options as unknown as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async killSwitchStatus(requestOptions?: RequestOptions): Promise<SingleResponse<FiscalKillSwitchStatus>> {
    return this.http.get<SingleResponse<FiscalKillSwitchStatus>>('/tenant/fiscal/kill-switch/status', undefined, requestOptions);
  }

  /**
   * Activate the fiscal kill-switch (emergency halt). Requires the `fiscal:admin`
   * scope (fail-closed). `input.reason` must be **>= 20 characters**. In
   * production, the first call returns `403` `OOB_CONFIRMATION_REQUIRED` and
   * emails a `confirmation_token` to the tenant contact — re-call with
   * `input.confirmation_token` to apply.
   */
  async killSwitchActivate(input: FiscalKillSwitchActivateInput, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/fiscal/kill-switch/activate', input, requestOptions);
  }

  /**
   * Deactivate the fiscal kill-switch. Same step-up contract as activation:
   * `input.reason` must be **>= 20 characters**, and in production an out-of-band
   * `input.confirmation_token` is required (first call returns `403`
   * `OOB_CONFIRMATION_REQUIRED` and emails the token).
   */
  async killSwitchDeactivate(input: FiscalKillSwitchDeactivateInput, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/fiscal/kill-switch/deactivate', input, requestOptions);
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
    return this.http.put<SingleResponse<FiscalRule>>(`/tenant/fiscal/rules/${id}`, input, requestOptions);
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

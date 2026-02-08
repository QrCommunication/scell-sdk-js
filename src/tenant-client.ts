/**
 * Scell Tenant Client
 *
 * Client for multi-tenant operations using X-Tenant-Key authentication.
 * Use this client for tenant-specific invoice and credit note operations.
 *
 * @packageDocumentation
 */

import { HttpClient, type ClientConfig, type RequestOptions } from './client.js';
import { TenantDirectInvoicesResource } from './resources/tenant-direct-invoices.js';
import { TenantDirectCreditNotesResource } from './resources/tenant-direct-credit-notes.js';
import { TenantIncomingInvoicesResource } from './resources/tenant-incoming-invoices.js';
import { TenantCreditNotesResource } from './resources/tenant-credit-notes.js';
import { FiscalResource } from './resources/fiscal.js';
import { BillingResource } from './resources/billing.js';
import { StatsResource } from './resources/stats.js';
import { SubTenantsResource } from './resources/sub-tenants.js';
import type { SingleResponse } from './types/common.js';
import type {
  TenantProfile,
  UpdateTenantProfileInput,
  TenantBalance,
  TenantQuickStats,
  RegenerateKeyResult,
} from './types/tenant-profile.js';

/**
 * Scell Tenant Client
 *
 * Use this client for multi-tenant operations with X-Tenant-Key authentication.
 */
export class ScellTenantClient {
  private readonly http: HttpClient;

  /** Direct invoices resource */
  public readonly directInvoices: TenantDirectInvoicesResource;

  /** Direct credit notes resource */
  public readonly directCreditNotes: TenantDirectCreditNotesResource;

  /** Incoming invoices resource */
  public readonly incomingInvoices: TenantIncomingInvoicesResource;

  /** Sub-tenant credit notes resource */
  public readonly subTenantCreditNotes: TenantCreditNotesResource;

  /** Fiscal compliance resource (LF 2026) */
  public readonly fiscal: FiscalResource;

  /** Billing resource */
  public readonly billing: BillingResource;

  /** Stats resource */
  public readonly stats: StatsResource;

  /** Sub-tenants resource */
  public readonly subTenants: SubTenantsResource;

  /**
   * Create a new Scell Tenant Client
   *
   * @param tenantKey - Your tenant API key (from dashboard)
   * @param config - Optional client configuration
   */
  constructor(tenantKey: string, config: ClientConfig = {}) {
    this.http = new HttpClient('tenant-key', tenantKey, config);

    this.directInvoices = new TenantDirectInvoicesResource(this.http);
    this.directCreditNotes = new TenantDirectCreditNotesResource(this.http);
    this.incomingInvoices = new TenantIncomingInvoicesResource(this.http);
    this.subTenantCreditNotes = new TenantCreditNotesResource(this.http);
    this.fiscal = new FiscalResource(this.http);
    this.billing = new BillingResource(this.http);
    this.stats = new StatsResource(this.http);
    this.subTenants = new SubTenantsResource(this.http);
  }

  // ── Tenant Profile Methods ──────────────────────────────

  /** Get tenant profile */
  async me(requestOptions?: RequestOptions): Promise<SingleResponse<TenantProfile>> {
    return this.http.get<SingleResponse<TenantProfile>>('/tenant/me', undefined, requestOptions);
  }

  /** Update tenant profile */
  async updateProfile(input: UpdateTenantProfileInput, requestOptions?: RequestOptions): Promise<SingleResponse<TenantProfile>> {
    return this.http.post<SingleResponse<TenantProfile>>('/tenant/me', input, requestOptions);
  }

  /** Get tenant balance */
  async balance(requestOptions?: RequestOptions): Promise<SingleResponse<TenantBalance>> {
    return this.http.get<SingleResponse<TenantBalance>>('/tenant/balance', undefined, requestOptions);
  }

  /** Get quick stats */
  async quickStats(requestOptions?: RequestOptions): Promise<SingleResponse<TenantQuickStats>> {
    return this.http.get<SingleResponse<TenantQuickStats>>('/tenant/stats', undefined, requestOptions);
  }

  /** Regenerate tenant key */
  async regenerateKey(requestOptions?: RequestOptions): Promise<SingleResponse<RegenerateKeyResult>> {
    return this.http.post<SingleResponse<RegenerateKeyResult>>('/tenant/regenerate-key', undefined, requestOptions);
  }
}

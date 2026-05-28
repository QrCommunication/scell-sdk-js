/**
 * Scell.io Official TypeScript SDK
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { ScellClient, ScellApiClient, ScellTenantClient, ScellAuth, ScellWebhooks } from '@scell/sdk';
 *
 * // Dashboard client (Bearer token)
 * const auth = await ScellAuth.login({ email, password });
 * const client = new ScellClient(auth.token);
 *
 * // API client (X-API-Key)
 * const apiClient = new ScellApiClient('your-api-key');
 *
 * // Tenant client (X-Tenant-Key) - for multi-tenant operations
 * const tenantClient = new ScellTenantClient('your-tenant-key');
 *
 * // Create invoice
 * const invoice = await apiClient.invoices.create({...});
 *
 * // Create direct invoice (tenant)
 * const directInvoice = await tenantClient.directInvoices.create({...});
 *
 * // Verify webhook
 * const isValid = await ScellWebhooks.verifySignature(payload, signature, secret);
 * ```
 */

// Client
import { HttpClient, type ClientConfig, type RequestOptions } from './client.js';

// Tenant Client
import { ScellTenantClient } from './tenant-client.js';

// Resources
import { ApiKeysResource } from './resources/api-keys.js';
import { AuthResource, ScellAuth } from './resources/auth.js';
import { BalanceResource } from './resources/balance.js';
import { BillingResource } from './resources/billing.js';
import { BuyersResource } from './resources/buyers.js';
import { CompaniesResource } from './resources/companies.js';
import { CreditNotesResource } from './resources/credit-notes.js';
import { CreditPacksResource } from './resources/credit-packs.js';
import { FiscalResource } from './resources/fiscal.js';
import { InvoiceTemplatesResource } from './resources/invoice-templates.js';
import { InvoicesResource } from './resources/invoices.js';
import { SignaturesResource } from './resources/signatures.js';
import { StatsResource } from './resources/stats.js';
import { SuppliersResource } from './resources/suppliers.js';
import { SubTenantsResource } from './resources/sub-tenants.js';
import { TenantCreditNotesResource } from './resources/tenant-credit-notes.js';
import { TenantDirectInvoicesResource } from './resources/tenant-direct-invoices.js';
import { TenantIncomingInvoicesResource } from './resources/tenant-incoming-invoices.js';
import { TenantSignaturesResource } from './resources/tenant-signatures.js';
import { WebhooksResource } from './resources/webhooks.js';
import { OnboardingResource } from './resources/onboarding.js';
import { QuotesResource } from './resources/quotes.js';
import { BrandingResource } from './resources/branding.js';

// Utilities
import { ScellWebhooks } from './utils/webhook-verify.js';
import { withRetry, createRetryWrapper } from './utils/retry.js';

/**
 * Scell Dashboard Client
 *
 * Use this client for dashboard/user operations with Bearer token authentication.
 *
 * @example
 * ```typescript
 * import { ScellClient, ScellAuth } from '@scell/sdk';
 *
 * // Login first
 * const auth = await ScellAuth.login({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 *
 * // Create client
 * const client = new ScellClient(auth.token);
 *
 * // Use the client
 * const companies = await client.companies.list();
 * const balance = await client.balance.get();
 * ```
 */
export class ScellClient {
  private readonly http: HttpClient;

  /** Authentication operations */
  public readonly auth: AuthResource;
  /** Company management */
  public readonly companies: CompaniesResource;
  /** Buyer registry (scoped tenant + sub_tenant) */
  public readonly buyers: BuyersResource;
  /** Supplier registry (scoped tenant + sub_tenant) */
  public readonly suppliers: SuppliersResource;
  /** API key management */
  public readonly apiKeys: ApiKeysResource;
  /** Balance and transactions */
  public readonly balance: BalanceResource;
  /** Webhook management */
  public readonly webhooks: WebhooksResource;
  /** Invoice listing (read-only via dashboard) */
  public readonly invoices: InvoicesResource;
  /** Signature listing (read-only via dashboard) */
  public readonly signatures: SignaturesResource;
  /** Credit notes management */
  public readonly creditNotes: CreditNotesResource;
  /** Quote management (create, send, accept, convert) */
  public readonly quotes: QuotesResource;
  /**
   * Branding profile management (logo, colors, email footer/signature).
   *
   * Controls how invoice delivery emails and signature requests are displayed
   * to recipients. Applies to the tenant scope.
   *
   * @example
   * ```typescript
   * const { upload_url, public_url } = await client.branding.tenant.uploadLogo('image/png');
   * await fetch(upload_url, { method: 'PUT', body: logoBuffer });
   * await client.branding.tenant.update({ brand_logo_url: public_url });
   * ```
   */
  public readonly branding: BrandingResource;
  /**
   * Invoice template management (CRUD + logo upload + default selection).
   *
   * Templates personnalisent l'apparence des factures (logo, couleurs,
   * mentions, footer). Cascade de resolution : explicit > sub_tenant default
   * > tenant default > system default.
   *
   * @since 2.24.0
   */
  public readonly invoiceTemplates: InvoiceTemplatesResource;
  /**
   * Credit packs catalogue (public read-only).
   *
   * Exposes the prepaid credit packs available for purchase by tenants.
   * Purchasing flow goes through Stripe + webhook (see backend docs).
   *
   * @since 2.24.0
   */
  public readonly creditPacks: CreditPacksResource;

  /**
   * Create a new Scell Dashboard Client
   *
   * @param token - Bearer token from login
   * @param config - Client configuration
   *
   * @example
   * ```typescript
   * const client = new ScellClient('your-bearer-token', {
   *   baseUrl: 'https://api.scell.io/api/v1',
   *   timeout: 30000,
   *   retry: { maxRetries: 3 }
   * });
   * ```
   */
  constructor(token: string, config: ClientConfig = {}) {
    this.http = new HttpClient('bearer', token, config);

    this.auth = new AuthResource(this.http);
    this.companies = new CompaniesResource(this.http);
    this.buyers = new BuyersResource(this.http);
    this.suppliers = new SuppliersResource(this.http);
    this.apiKeys = new ApiKeysResource(this.http);
    this.balance = new BalanceResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.invoices = new InvoicesResource(this.http);
    this.signatures = new SignaturesResource(this.http);
    this.creditNotes = new CreditNotesResource(this.http);
    this.quotes = new QuotesResource(this.http);
    this.branding = new BrandingResource(this.http);
    this.invoiceTemplates = new InvoiceTemplatesResource(this.http);
    this.creditPacks = new CreditPacksResource(this.http);
  }

  /**
   * Retrieve the deployed API version, commit SHA, and runtime info.
   *
   * Public endpoint (no auth required). Useful for drift detection between
   * the SDK version and the live API, and for surfacing build metadata in
   * health dashboards / monitoring tools.
   *
   * @returns Deployed version manifest (version, commit_sha, environment,
   *          php_version, laravel_version, etc.)
   *
   * @since 2.24.0
   *
   * @example
   * ```typescript
   * const v = await client.version();
   * console.log(`API ${v.version} (commit ${v.commit_short}, ${v.environment})`);
   * ```
   */
  async version(requestOptions?: RequestOptions): Promise<ApiVersionInfo> {
    return this.http.get<ApiVersionInfo>('/version', undefined, requestOptions);
  }
}

/**
 * API Client for server-to-server integration.
 * Uses X-API-Key header with sk_live_* or sk_test_* keys.
 *
 * Provides access to both tenant invoice/signature endpoints
 * and tenant management endpoints. For dedicated tenant operations,
 * prefer ScellTenantClient which uses X-Tenant-Key header.
 *
 * @example
 * ```typescript
 * import { ScellApiClient } from '@scell/sdk';
 *
 * const client = new ScellApiClient('your-api-key');
 *
 * // Create an invoice
 * const invoice = await client.invoices.create({
 *   direction: 'outgoing',
 *   output_format: 'facturx',
 *   // ...
 * });
 *
 * // Create a signature request
 * const signature = await client.signatures.create({
 *   title: 'Contract',
 *   document: btoa(pdfContent),
 *   document_name: 'contract.pdf',
 *   signers: [{...}]
 * });
 * ```
 */
export class ScellApiClient {
  private readonly http: HttpClient;

  /** Invoice operations (create, download, convert) */
  public readonly invoices: InvoicesResource;
  /** Signature operations (create, download, remind, cancel) */
  public readonly signatures: SignaturesResource;
  /** Sub-tenant management (provision, update, list) */
  public readonly subTenants: SubTenantsResource;
  /** ISCA fiscal compliance (closings, FEC, attestation) */
  public readonly fiscal: FiscalResource;
  /** Platform statistics */
  public readonly stats: StatsResource;
  /** Platform billing (usage, top-up, transactions) */
  public readonly billing: BillingResource;
  /** Credit notes operations (create, send, download) */
  public readonly creditNotes: TenantCreditNotesResource;
  /** Tenant invoice operations (create, submit, update, delete) */
  public readonly tenantInvoices: TenantDirectInvoicesResource;
  /** Tenant signature operations (read-only, scoped via X-API-Key) */
  public readonly tenantSignatures: TenantSignaturesResource;
  /** Incoming invoice operations (list, accept, reject) */
  public readonly incomingInvoices: TenantIncomingInvoicesResource;
  /** SuperPDP OAuth2 onboarding flow (partner tenant onboarding) */
  public readonly onboarding: OnboardingResource;
  /** Buyer registry (scoped tenant + sub_tenant) */
  public readonly buyers: BuyersResource;
  /** Supplier registry (scoped tenant + sub_tenant) */
  public readonly suppliers: SuppliersResource;
  /** Quote management (create, send, accept, convert to deposit / balance) */
  public readonly quotes: QuotesResource;
  /**
   * Branding profile management — controls how invoice emails and signature
   * requests appear to recipients, for both tenant and sub-tenant scopes.
   *
   * @example
   * ```typescript
   * // Get tenant branding status
   * const branding = await client.branding.tenant.get();
   * if (!branding.is_complete) console.log('Missing:', branding.missing_fields);
   *
   * // Update sub-tenant branding
   * await client.branding.subTenants.update('sub-tenant-uuid', {
   *   brand_primary_color: '#1A73E8',
   * });
   * ```
   */
  public readonly branding: BrandingResource;
  /**
   * Invoice template management (CRUD + logo upload + default selection).
   *
   * Templates personnalisent l'apparence des factures (logo, couleurs,
   * mentions, footer). Cascade de resolution : explicit > sub_tenant default
   * > tenant default > system default.
   *
   * @since 2.24.0
   */
  public readonly invoiceTemplates: InvoiceTemplatesResource;
  /**
   * Credit packs catalogue (public read-only).
   *
   * Exposes the prepaid credit packs available for purchase by tenants.
   * Purchasing flow goes through Stripe + webhook (see backend docs).
   *
   * @since 2.24.0
   */
  public readonly creditPacks: CreditPacksResource;

  /**
   * Create a new Scell API Client
   *
   * @param apiKey - Your API key (sk_live_xxx or sk_test_xxx)
   * @param config - Client configuration
   *
   * @example
   * ```typescript
   * // Production client
   * const client = new ScellApiClient('sk_live_xxx');
   *
   * // Sandbox client
   * const sandboxClient = new ScellApiClient('sk_test_xxx', {
   *   baseUrl: 'https://api.scell.io/api/v1/sandbox'
   * });
   * ```
   */
  constructor(apiKey: string, config: ClientConfig = {}) {
    this.http = new HttpClient('api-key', apiKey, config);

    this.invoices = new InvoicesResource(this.http);
    this.signatures = new SignaturesResource(this.http);
    this.subTenants = new SubTenantsResource(this.http);
    this.fiscal = new FiscalResource(this.http);
    this.stats = new StatsResource(this.http);
    this.billing = new BillingResource(this.http);
    this.creditNotes = new TenantCreditNotesResource(this.http);
    this.tenantInvoices = new TenantDirectInvoicesResource(this.http);
    this.tenantSignatures = new TenantSignaturesResource(this.http);
    this.incomingInvoices = new TenantIncomingInvoicesResource(this.http);
    this.onboarding = new OnboardingResource(this.http);
    this.buyers = new BuyersResource(this.http);
    this.suppliers = new SuppliersResource(this.http);
    this.quotes = new QuotesResource(this.http);
    this.branding = new BrandingResource(this.http);
    this.invoiceTemplates = new InvoiceTemplatesResource(this.http);
    this.creditPacks = new CreditPacksResource(this.http);
  }

  /**
   * Retrieve the deployed API version, commit SHA, and runtime info.
   *
   * Public endpoint (no auth required). Useful for drift detection between
   * the SDK version and the live API.
   *
   * @returns Deployed version manifest
   *
   * @since 2.24.0
   */
  async version(requestOptions?: RequestOptions): Promise<ApiVersionInfo> {
    return this.http.get<ApiVersionInfo>('/version', undefined, requestOptions);
  }
}

// Re-export utilities
export { ScellAuth, ScellWebhooks, withRetry, createRetryWrapper };

// Re-export tenant client
export { ScellTenantClient };

// Re-export public client
export { ScellPublicClient } from './public-client.js';

// Re-export types
export type { ClientConfig } from './client.js';
export type { RetryOptions } from './utils/retry.js';
export type { VerifySignatureOptions } from './utils/webhook-verify.js';

// Re-export QuotesResource
export { QuotesResource } from './resources/quotes.js';
export type {
  QuoteAuditLogResponse,
  QuotePdfResponse,
  QuotePreviewResponse,
  RegeneratePublicLinkResponse,
  SendQuoteResponse,
} from './resources/quotes.js';

// Re-export new resources (since v2.13.0)
export { PaymentScheduleResource } from './resources/payment-schedule.js';
export { BrandingResource } from './resources/branding.js';

// Re-export new resources (since v2.24.0)
export { InvoiceTemplatesResource } from './resources/invoice-templates.js';
export { CreditPacksResource } from './resources/credit-packs.js';

// Local import (ApiVersionInfo is re-exported via `export * from ./types/index.js`)
import type { ApiVersionInfo } from './types/version.js';

// Re-export errors
export {
  DeleteSubTenantFiscalLockedError,
  DeleteSubTenantHasCompaniesError,
  ScellError,
  ScellAuthenticationError,
  ScellAuthorizationError,
  ScellValidationError,
  ScellRateLimitError,
  ScellNotFoundError,
  ScellServerError,
  ScellInsufficientBalanceError,
  ScellNetworkError,
  ScellTimeoutError,
  SubTenantMissingAccessTokenError,
  // Payment schedule errors (since v2.13.0)
  QuoteNotEditableError,
  ScheduleLineAlreadyInvoicedError,
  ScheduleSumExceedsTotalError,
  // Invoice email delivery errors (since v2.13.0)
  BuyerHasNoEmailError,
  InvoiceBrandingIncompleteError,
} from './errors.js';

// Re-export all types
export * from './types/index.js';

// Re-export VAT types (since v2.20.0)
export { VAT_DEFAULT_RATES } from './types/vat.js';
export type {
  VatCategory,
  VatEn16931Code,
  VatExemptionReason,
  VatResolution,
  LineVatContext,
  VatBuyerContext,
  VatWarning,
  VatContextResponse,
} from './types/vat.js';

// Re-export invoice line builder (since v2.20.0)
export { createInvoiceLine, InvoiceLineBuilder } from './builders/invoice-line-builder.js';
export type { InvoiceLineInputWithMeta } from './builders/invoice-line-builder.js';

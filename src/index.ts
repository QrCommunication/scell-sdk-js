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
import { HttpClient, type ClientConfig } from './client.js';

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
import { FiscalResource } from './resources/fiscal.js';
import { InvoicesResource } from './resources/invoices.js';
import { SignaturesResource } from './resources/signatures.js';
import { StatsResource } from './resources/stats.js';
import { SubTenantsResource } from './resources/sub-tenants.js';
import { TenantCreditNotesResource } from './resources/tenant-credit-notes.js';
import { TenantDirectInvoicesResource } from './resources/tenant-direct-invoices.js';
import { TenantIncomingInvoicesResource } from './resources/tenant-incoming-invoices.js';
import { TenantSignaturesResource } from './resources/tenant-signatures.js';
import { WebhooksResource } from './resources/webhooks.js';
import { OnboardingResource } from './resources/onboarding.js';

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
    this.apiKeys = new ApiKeysResource(this.http);
    this.balance = new BalanceResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.invoices = new InvoicesResource(this.http);
    this.signatures = new SignaturesResource(this.http);
    this.creditNotes = new CreditNotesResource(this.http);
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
} from './errors.js';

// Re-export all types
export * from './types/index.js';

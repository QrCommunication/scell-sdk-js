/**
 * Scell.io Official TypeScript SDK
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { ScellClient, ScellApiClient, ScellAuth, ScellWebhooks } from '@scell/sdk';
 *
 * // Dashboard client (Bearer token)
 * const auth = await ScellAuth.login({ email, password });
 * const client = new ScellClient(auth.token);
 *
 * // API client (X-API-Key)
 * const apiClient = new ScellApiClient('your-api-key');
 *
 * // Create invoice
 * const invoice = await apiClient.invoices.create({...});
 *
 * // Verify webhook
 * const isValid = await ScellWebhooks.verifySignature(payload, signature, secret);
 * ```
 */

// Client
import { HttpClient, type ClientConfig } from './client.js';

// Resources
import { ApiKeysResource } from './resources/api-keys.js';
import { AuthResource, ScellAuth } from './resources/auth.js';
import { BalanceResource } from './resources/balance.js';
import { CompaniesResource } from './resources/companies.js';
import { InvoicesResource } from './resources/invoices.js';
import { SignaturesResource } from './resources/signatures.js';
import { WebhooksResource } from './resources/webhooks.js';

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
    this.apiKeys = new ApiKeysResource(this.http);
    this.balance = new BalanceResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.invoices = new InvoicesResource(this.http);
    this.signatures = new SignaturesResource(this.http);
  }
}

/**
 * Scell API Client
 *
 * Use this client for external API operations with X-API-Key authentication.
 * This is the client you'll use for creating invoices and signatures.
 *
 * @example
 * ```typescript
 * import { ScellApiClient } from '@scell/sdk';
 *
 * const client = new ScellApiClient('your-api-key');
 *
 * // Create an invoice
 * const invoice = await client.invoices.create({
 *   invoice_number: 'FACT-2024-001',
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

  /**
   * Create a new Scell API Client
   *
   * @param apiKey - Your API key (from dashboard)
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
  }
}

// Re-export utilities
export { ScellAuth, ScellWebhooks, withRetry, createRetryWrapper };

// Re-export types
export type { ClientConfig } from './client.js';
export type { RetryOptions } from './utils/retry.js';
export type { VerifySignatureOptions } from './utils/webhook-verify.js';

// Re-export errors
export {
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
} from './errors.js';

// Re-export all types
export * from './types/index.js';

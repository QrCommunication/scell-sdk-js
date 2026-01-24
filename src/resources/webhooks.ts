/**
 * Webhooks Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  MessageWithDataResponse,
  PaginatedResponse,
} from '../types/common.js';
import type {
  CreateWebhookInput,
  UpdateWebhookInput,
  Webhook,
  WebhookListOptions,
  WebhookLog,
  WebhookTestResponse,
  WebhookWithSecret,
} from '../types/webhooks.js';

/**
 * Webhooks API resource
 *
 * @example
 * ```typescript
 * // Create a webhook
 * const webhook = await client.webhooks.create({
 *   url: 'https://myapp.com/webhooks/scell',
 *   events: ['invoice.validated', 'signature.completed'],
 *   environment: 'production'
 * });
 *
 * // Store the secret securely!
 * console.log('Webhook secret:', webhook.secret);
 *
 * // Test the webhook
 * const test = await client.webhooks.test(webhook.id);
 * console.log('Test success:', test.success);
 * ```
 */
export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all webhooks
   *
   * @param options - Filter options
   * @param requestOptions - Request options
   * @returns List of webhooks
   *
   * @example
   * ```typescript
   * const { data: webhooks } = await client.webhooks.list();
   * webhooks.forEach(wh => {
   *   console.log(`${wh.url}: ${wh.is_active ? 'active' : 'inactive'}`);
   * });
   * ```
   */
  async list(
    options: WebhookListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<{ data: Webhook[] }> {
    return this.http.get<{ data: Webhook[] }>(
      '/webhooks',
      options as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }

  /**
   * Create a new webhook
   *
   * Important: The secret is only returned once during creation.
   * Store it securely - you'll need it to verify webhook signatures.
   *
   * @param input - Webhook configuration
   * @param requestOptions - Request options
   * @returns Created webhook with secret
   *
   * @example
   * ```typescript
   * const { data: webhook } = await client.webhooks.create({
   *   url: 'https://myapp.com/webhooks/scell',
   *   events: [
   *     'invoice.created',
   *     'invoice.validated',
   *     'signature.completed',
   *     'balance.low'
   *   ],
   *   environment: 'production',
   *   headers: {
   *     'X-Custom-Auth': 'my-secret-token'
   *   },
   *   retry_count: 5,
   *   timeout_seconds: 30
   * });
   *
   * // IMPORTANT: Store this secret securely!
   * await saveWebhookSecret(webhook.id, webhook.secret);
   * ```
   */
  async create(
    input: CreateWebhookInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<WebhookWithSecret>> {
    return this.http.post<MessageWithDataResponse<WebhookWithSecret>>(
      '/webhooks',
      input,
      requestOptions
    );
  }

  /**
   * Update a webhook
   *
   * @param id - Webhook UUID
   * @param input - Fields to update
   * @param requestOptions - Request options
   * @returns Updated webhook
   *
   * @example
   * ```typescript
   * // Disable a webhook temporarily
   * await client.webhooks.update('webhook-uuid', {
   *   is_active: false
   * });
   *
   * // Update events
   * await client.webhooks.update('webhook-uuid', {
   *   events: ['invoice.validated', 'signature.completed']
   * });
   * ```
   */
  async update(
    id: string,
    input: UpdateWebhookInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Webhook>> {
    return this.http.put<MessageWithDataResponse<Webhook>>(
      `/webhooks/${id}`,
      input,
      requestOptions
    );
  }

  /**
   * Delete a webhook
   *
   * @param id - Webhook UUID
   * @param requestOptions - Request options
   * @returns Deletion confirmation
   *
   * @example
   * ```typescript
   * await client.webhooks.delete('webhook-uuid');
   * ```
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/webhooks/${id}`, requestOptions);
  }

  /**
   * Regenerate webhook secret
   *
   * Use this if your secret has been compromised.
   * The old secret will immediately stop working.
   *
   * @param id - Webhook UUID
   * @param requestOptions - Request options
   * @returns Webhook with new secret
   *
   * @example
   * ```typescript
   * const { data: webhook } = await client.webhooks.regenerateSecret(
   *   'webhook-uuid'
   * );
   *
   * // Update your stored secret
   * await updateWebhookSecret(webhook.id, webhook.secret);
   * ```
   */
  async regenerateSecret(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<WebhookWithSecret>> {
    return this.http.post<MessageWithDataResponse<WebhookWithSecret>>(
      `/webhooks/${id}/regenerate-secret`,
      undefined,
      requestOptions
    );
  }

  /**
   * Test webhook by sending a test event
   *
   * @param id - Webhook UUID
   * @param requestOptions - Request options
   * @returns Test result
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.test('webhook-uuid');
   *
   * if (result.success) {
   *   console.log(`Success! Response time: ${result.response_time_ms}ms`);
   * } else {
   *   console.log(`Failed: ${result.error}`);
   * }
   * ```
   */
  async test(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<WebhookTestResponse> {
    return this.http.post<WebhookTestResponse>(
      `/webhooks/${id}/test`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get webhook delivery logs
   *
   * @param id - Webhook UUID
   * @param options - Pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of logs
   *
   * @example
   * ```typescript
   * const { data: logs } = await client.webhooks.logs('webhook-uuid', {
   *   per_page: 50
   * });
   *
   * logs.forEach(log => {
   *   const status = log.success ? 'OK' : 'FAILED';
   *   console.log(`${log.event} - ${status} (${log.response_time_ms}ms)`);
   * });
   * ```
   */
  async logs(
    id: string,
    options: { per_page?: number } = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<WebhookLog>> {
    return this.http.get<PaginatedResponse<WebhookLog>>(
      `/webhooks/${id}/logs`,
      options,
      requestOptions
    );
  }
}

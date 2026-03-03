/**
 * API Keys Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  MessageWithDataResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
} from '../types/api-keys.js';

/**
 * API Keys resource
 *
 * @example
 * ```typescript
 * // Create an API key for a company
 * const apiKey = await client.apiKeys.create({
 *   name: 'Production Key',
 *   company_id: 'company-uuid',
 *   environment: 'production'
 * });
 *
 * // Store the key securely!
 * console.log('API Key:', apiKey.key);
 * ```
 */
export class ApiKeysResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all API keys
   *
   * @param requestOptions - Request options
   * @returns List of API keys (without secrets)
   *
   * @example
   * ```typescript
   * const { data: keys } = await client.apiKeys.list();
   * keys.forEach(key => {
   *   console.log(`${key.name}: ${key.key_prefix}...`);
   * });
   * ```
   */
  async list(requestOptions?: RequestOptions): Promise<{ data: ApiKey[] }> {
    return this.http.get<{ data: ApiKey[] }>(
      '/api-keys',
      undefined,
      requestOptions
    );
  }

  /**
   * Get a specific API key
   *
   * @param id - API Key UUID
   * @param requestOptions - Request options
   * @returns API key details (without secret)
   *
   * @example
   * ```typescript
   * const { data: key } = await client.apiKeys.get('key-uuid');
   * console.log(`Last used: ${key.last_used_at}`);
   * ```
   */
  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<ApiKey>> {
    return this.http.get<SingleResponse<ApiKey>>(
      `/api-keys/${id}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create a new API key
   *
   * Important: The full key is only returned once during creation.
   * Store it securely - you won't be able to retrieve it again.
   *
   * @param input - API key configuration
   * @param requestOptions - Request options
   * @returns Created API key with full key value
   *
   * @example
   * ```typescript
   * const { data: apiKey } = await client.apiKeys.create({
   *   name: 'Production Integration',
   *   company_id: 'company-uuid',
   *   environment: 'production',
   *   permissions: ['invoices:write', 'signatures:write']
   * });
   *
   * // IMPORTANT: Store this key securely!
   * // You won't be able to see it again.
   * console.log('Save this key:', apiKey.key);
   * ```
   */
  async create(
    input: CreateApiKeyInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<ApiKeyWithSecret>> {
    return this.http.post<MessageWithDataResponse<ApiKeyWithSecret>>(
      '/api-keys',
      input,
      requestOptions
    );
  }

  /**
   * Delete an API key
   *
   * Warning: This will immediately revoke the key and all
   * requests using it will fail.
   *
   * @param id - API Key UUID
   * @param requestOptions - Request options
   * @returns Deletion confirmation
   *
   * @example
   * ```typescript
   * await client.apiKeys.delete('key-uuid');
   * console.log('API key revoked');
   * ```
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/api-keys/${id}`, requestOptions);
  }
}

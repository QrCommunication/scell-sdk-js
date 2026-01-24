/**
 * Scell HTTP Client
 *
 * @packageDocumentation
 */

import {
  parseApiError,
  ScellNetworkError,
  ScellTimeoutError,
} from './errors.js';
import { withRetry, type RetryOptions } from './utils/retry.js';

/**
 * Authentication mode
 */
export type AuthMode = 'bearer' | 'api-key';

/**
 * Client configuration options
 */
export interface ClientConfig {
  /** Base URL for the API (default: https://api.scell.io/api/v1) */
  baseUrl?: string | undefined;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number | undefined;
  /** Retry configuration */
  retry?: RetryOptions | undefined;
  /** Enable automatic retries (default: true) */
  enableRetry?: boolean | undefined;
  /** Custom fetch implementation */
  fetch?: typeof fetch | undefined;
}

/**
 * Request options for individual requests
 */
export interface RequestOptions {
  /** Override timeout for this request */
  timeout?: number | undefined;
  /** Skip retry for this request */
  skipRetry?: boolean | undefined;
  /** Additional headers */
  headers?: Record<string, string> | undefined;
  /** Abort signal */
  signal?: AbortSignal | undefined;
}

/**
 * Internal request configuration
 */
interface InternalRequestConfig extends RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

/**
 * HTTP client for Scell API
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryOptions: RetryOptions;
  private readonly enableRetry: boolean;
  private readonly fetchFn: typeof fetch;
  private readonly authMode: AuthMode;
  private readonly authToken: string;

  constructor(
    authMode: AuthMode,
    authToken: string,
    config: ClientConfig = {}
  ) {
    this.authMode = authMode;
    this.authToken = authToken;
    this.baseUrl = config.baseUrl ?? 'https://api.scell.io/api/v1';
    this.timeout = config.timeout ?? 30000;
    this.retryOptions = config.retry ?? {};
    this.enableRetry = config.enableRetry ?? true;
    this.fetchFn = config.fetch ?? fetch;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(path, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Build headers for request
   */
  private buildHeaders(
    additionalHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...additionalHeaders,
    };

    if (this.authMode === 'bearer') {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    } else {
      headers['X-API-Key'] = this.authToken;
    }

    return headers;
  }

  /**
   * Execute HTTP request
   */
  private async executeRequest<T>(config: InternalRequestConfig): Promise<T> {
    const { method, path, body, query, headers, timeout, signal } = config;

    const url = this.buildUrl(path, query);
    const requestHeaders = this.buildHeaders(headers);
    const requestTimeout = timeout ?? this.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    // Combine signals if provided
    const combinedSignal = signal
      ? new AbortController().signal
      : controller.signal;

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: combinedSignal,
      };

      if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await this.fetchFn(url, fetchOptions);

      clearTimeout(timeoutId);

      // Parse response body
      const contentType = response.headers.get('Content-Type') ?? '';
      let responseBody: unknown;

      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        parseApiError(response.status, responseBody, response.headers);
      }

      return responseBody as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        // Handle abort/timeout
        if (error.name === 'AbortError') {
          throw new ScellTimeoutError(
            `Request timed out after ${requestTimeout}ms`
          );
        }

        // Handle network errors
        if (
          error.name === 'TypeError' &&
          error.message.includes('fetch')
        ) {
          throw new ScellNetworkError('Network request failed', error);
        }
      }

      throw error;
    }
  }

  /**
   * Execute request with optional retry
   */
  private async request<T>(config: InternalRequestConfig): Promise<T> {
    const shouldRetry = this.enableRetry && !config.skipRetry;

    if (shouldRetry) {
      return withRetry(
        () => this.executeRequest<T>(config),
        this.retryOptions
      );
    }

    return this.executeRequest<T>(config);
  }

  /**
   * GET request
   */
  async get<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    options?: RequestOptions
  ): Promise<T> {
    const config: InternalRequestConfig = {
      method: 'GET',
      path,
      ...options,
    };
    if (query !== undefined) {
      config.query = query;
    }
    return this.request<T>(config);
  }

  /**
   * POST request
   */
  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'POST',
      path,
      body,
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'PUT',
      path,
      body,
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>({
      method: 'PATCH',
      path,
      body,
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({
      method: 'DELETE',
      path,
      ...options,
    });
  }

  /**
   * GET request that returns raw binary data as ArrayBuffer
   *
   * Use this for downloading files (PDF, XML, etc.)
   *
   * @param path - API endpoint path
   * @param query - Query parameters
   * @param options - Request options
   * @returns ArrayBuffer containing the file content
   */
  async getRaw(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    options?: RequestOptions
  ): Promise<ArrayBuffer> {
    const url = this.buildUrl(path, query);
    const requestHeaders = this.buildHeaders(options?.headers);
    const requestTimeout = options?.timeout ?? this.timeout;

    // Remove JSON content-type for raw requests
    delete requestHeaders['Content-Type'];
    requestHeaders['Accept'] = '*/*';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const response = await this.fetchFn(url, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error as JSON
        const contentType = response.headers.get('Content-Type') ?? '';
        let responseBody: unknown;

        if (contentType.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }

        parseApiError(response.status, responseBody, response.headers);
      }

      return response.arrayBuffer();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ScellTimeoutError(
            `Request timed out after ${requestTimeout}ms`
          );
        }

        if (
          error.name === 'TypeError' &&
          error.message.includes('fetch')
        ) {
          throw new ScellNetworkError('Network request failed', error);
        }
      }

      throw error;
    }
  }
}

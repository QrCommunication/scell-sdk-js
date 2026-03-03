/**
 * Retry utility with exponential backoff and jitter
 *
 * @packageDocumentation
 */

import { ScellRateLimitError, ScellServerError } from '../errors.js';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number | undefined;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number | undefined;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelay?: number | undefined;
  /** Jitter factor (0-1, default: 0.1) */
  jitterFactor?: number | undefined;
  /** Custom function to determine if error is retryable */
  isRetryable?: ((error: unknown) => boolean) | undefined;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'isRetryable'>> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  jitterFactor: 0.1,
};

/**
 * Check if an error is retryable (429 or 5xx)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ScellRateLimitError) {
    return true;
  }
  if (error instanceof ScellServerError) {
    return true;
  }
  // Network errors are also retryable
  if (error instanceof Error && error.name === 'ScellNetworkError') {
    return true;
  }
  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1)
 * @param retryAfter - Optional retry-after header value in seconds
 * @returns Delay in milliseconds
 */
export function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitterFactor: number,
  retryAfter?: number
): number {
  // If we have a retry-after header, use it
  if (retryAfter !== undefined && retryAfter > 0) {
    return retryAfter * 1000;
  }

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: delay * (1 +/- jitterFactor * random)
  const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Result of the function
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => client.invoices.create(data),
 *   { maxRetries: 5 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_RETRY_OPTIONS.maxRetries;
  const baseDelay = options.baseDelay ?? DEFAULT_RETRY_OPTIONS.baseDelay;
  const maxDelay = options.maxDelay ?? DEFAULT_RETRY_OPTIONS.maxDelay;
  const jitterFactor = options.jitterFactor ?? DEFAULT_RETRY_OPTIONS.jitterFactor;
  const isRetryable = options.isRetryable ?? isRetryableError;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Get retry-after header if available
      const retryAfter: number | undefined =
        error instanceof ScellRateLimitError ? error.retryAfter : undefined;

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        baseDelay,
        maxDelay,
        jitterFactor,
        retryAfter
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retry wrapper with pre-configured options
 *
 * @example
 * ```typescript
 * const retry = createRetryWrapper({ maxRetries: 5 });
 * const result = await retry(() => client.invoices.create(data));
 * ```
 */
export function createRetryWrapper(
  defaultOptions: RetryOptions = {}
): <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T> {
  return <T>(fn: () => Promise<T>, options: RetryOptions = {}) =>
    withRetry(fn, { ...defaultOptions, ...options });
}

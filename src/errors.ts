/**
 * Scell SDK Error Classes
 *
 * @packageDocumentation
 */

import type { ApiErrorResponse } from './types/common.js';

/**
 * Base error class for all Scell API errors
 */
export class ScellError extends Error {
  /** HTTP status code */
  public readonly status: number;
  /** Error code from API */
  public readonly code: string | undefined;
  /** Original response body */
  public readonly body: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    body?: unknown
  ) {
    super(message);
    this.name = 'ScellError';
    this.status = status;
    this.code = code;
    this.body = body;

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when authentication fails (401)
 *
 * @example
 * ```typescript
 * try {
 *   await client.invoices.list();
 * } catch (error) {
 *   if (error instanceof ScellAuthenticationError) {
 *     console.log('Invalid or expired token');
 *   }
 * }
 * ```
 */
export class ScellAuthenticationError extends ScellError {
  constructor(message = 'Authentication failed', body?: unknown) {
    super(message, 401, 'AUTHENTICATION_ERROR', body);
    this.name = 'ScellAuthenticationError';
  }
}

/**
 * Error thrown when authorization fails (403)
 *
 * @example
 * ```typescript
 * try {
 *   await client.admin.users();
 * } catch (error) {
 *   if (error instanceof ScellAuthorizationError) {
 *     console.log('Insufficient permissions');
 *   }
 * }
 * ```
 */
export class ScellAuthorizationError extends ScellError {
  constructor(message = 'Access denied', body?: unknown) {
    super(message, 403, 'AUTHORIZATION_ERROR', body);
    this.name = 'ScellAuthorizationError';
  }
}

/**
 * Error thrown when validation fails (422)
 *
 * @example
 * ```typescript
 * try {
 *   await client.invoices.create(invalidData);
 * } catch (error) {
 *   if (error instanceof ScellValidationError) {
 *     console.log('Validation errors:', error.errors);
 *   }
 * }
 * ```
 */
export class ScellValidationError extends ScellError {
  /** Field-level validation errors */
  public readonly errors: Record<string, string[]>;

  constructor(
    message: string,
    errors: Record<string, string[]> = {},
    body?: unknown
  ) {
    super(message, 422, 'VALIDATION_ERROR', body);
    this.name = 'ScellValidationError';
    this.errors = errors;
  }

  /**
   * Get all error messages as a flat array
   */
  getAllMessages(): string[] {
    return Object.values(this.errors).flat();
  }

  /**
   * Get error messages for a specific field
   */
  getFieldErrors(field: string): string[] {
    return this.errors[field] ?? [];
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldError(field: string): boolean {
    const fieldErrors = this.errors[field];
    return fieldErrors !== undefined && fieldErrors.length > 0;
  }
}

/**
 * Error thrown when a sub-tenant has no SuperPDP access_token available
 * to call `superpdp-status/refresh`. Returned as 422 with
 * `code: 'MISSING_ACCESS_TOKEN'`. The body carries a fresh
 * `authorize_url` + `state` the partner UI can redirect the sub-tenant to.
 *
 * @example
 * ```typescript
 * try {
 *   await client.subTenants.refreshSuperPDPStatus(id);
 * } catch (e) {
 *   if (e instanceof SubTenantMissingAccessTokenError) {
 *     redirectTo(e.authorizeUrl);
 *   }
 * }
 * ```
 */
export class SubTenantMissingAccessTokenError extends ScellError {
  public readonly authorizeUrl: string;
  public readonly state: string;

  constructor(
    message: string,
    authorizeUrl: string,
    state: string,
    body?: unknown
  ) {
    super(message, 422, 'MISSING_ACCESS_TOKEN', body);
    this.name = 'SubTenantMissingAccessTokenError';
    this.authorizeUrl = authorizeUrl;
    this.state = state;
  }
}

/**
 * Error thrown when deleting a sub-tenant that still owns Companies but
 * has no fiscal entries. Retry with `?cascade=true` to delete the
 * Companies along with the sub-tenant.
 *
 * @example
 * ```typescript
 * try {
 *   await client.subTenants.delete(id);
 * } catch (e) {
 *   if (e instanceof DeleteSubTenantHasCompaniesError) {
 *     await client.subTenants.delete(id, { cascade: true });
 *   }
 * }
 * ```
 */
export class DeleteSubTenantHasCompaniesError extends ScellError {
  public readonly companiesCount: number;

  constructor(message: string, companiesCount: number, body?: unknown) {
    super(message, 422, 'SUB_TENANT_HAS_COMPANIES', body);
    this.name = 'DeleteSubTenantHasCompaniesError';
    this.companiesCount = companiesCount;
  }
}

/**
 * Error thrown when deleting a sub-tenant that has fiscal entries
 * (Invoice / CreditNote already issued). ISCA compliance forbids
 * removing fiscally-locked entities. This error is final — no
 * `cascade` flag can override it.
 */
export class DeleteSubTenantFiscalLockedError extends ScellError {
  constructor(message: string, body?: unknown) {
    super(message, 422, 'SUB_TENANT_HAS_FISCAL_ENTRIES', body);
    this.name = 'DeleteSubTenantFiscalLockedError';
  }
}

/**
 * Error thrown when rate limit is exceeded (429)
 *
 * @example
 * ```typescript
 * try {
 *   await client.invoices.create(data);
 * } catch (error) {
 *   if (error instanceof ScellRateLimitError) {
 *     console.log(`Retry after ${error.retryAfter} seconds`);
 *   }
 * }
 * ```
 */
export class ScellRateLimitError extends ScellError {
  /** Seconds to wait before retrying */
  public readonly retryAfter: number | undefined;

  constructor(
    message = 'Rate limit exceeded',
    retryAfter?: number,
    body?: unknown
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', body);
    this.name = 'ScellRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when a resource is not found (404)
 */
export class ScellNotFoundError extends ScellError {
  constructor(message = 'Resource not found', body?: unknown) {
    super(message, 404, 'NOT_FOUND', body);
    this.name = 'ScellNotFoundError';
  }
}

/**
 * Error thrown when the API returns a server error (5xx)
 */
export class ScellServerError extends ScellError {
  constructor(
    message = 'Internal server error',
    status = 500,
    body?: unknown
  ) {
    super(message, status, 'SERVER_ERROR', body);
    this.name = 'ScellServerError';
  }
}

/**
 * Error thrown when insufficient balance for an operation
 */
export class ScellInsufficientBalanceError extends ScellError {
  constructor(message = 'Insufficient balance', body?: unknown) {
    super(message, 402, 'INSUFFICIENT_BALANCE', body);
    this.name = 'ScellInsufficientBalanceError';
  }
}

/**
 * Error thrown for network-related issues
 */
export class ScellNetworkError extends ScellError {
  public readonly originalError: Error;

  constructor(message: string, originalError: Error) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'ScellNetworkError';
    this.originalError = originalError;
  }
}

/**
 * Error thrown when request times out
 */
export class ScellTimeoutError extends ScellError {
  constructor(message = 'Request timed out') {
    super(message, 0, 'TIMEOUT');
    this.name = 'ScellTimeoutError';
  }
}

/**
 * Parse API error response and throw appropriate error
 */
export function parseApiError(
  status: number,
  body: unknown,
  headers?: Headers
): never {
  const errorBody = body as ApiErrorResponse | undefined;
  const message = errorBody?.message ?? 'Unknown error';
  const errors = errorBody?.errors ?? {};
  const code = errorBody?.code;

  switch (status) {
    case 401:
      throw new ScellAuthenticationError(message, body);
    case 402:
      throw new ScellInsufficientBalanceError(message, body);
    case 403:
      throw new ScellAuthorizationError(message, body);
    case 404:
      throw new ScellNotFoundError(message, body);
    case 422: {
      // Sub-tenant specific codes (since v2.9.0). These extend ScellError,
      // not ScellValidationError, because they carry structured fields
      // (authorize_url, state, companies_count) rather than per-field
      // validation messages.
      const errorBodyTyped = errorBody as
        | { code?: string; authorize_url?: string; state?: string; companies_count?: number }
        | undefined;
      if (code === 'MISSING_ACCESS_TOKEN' && errorBodyTyped) {
        throw new SubTenantMissingAccessTokenError(
          message,
          errorBodyTyped.authorize_url ?? '',
          errorBodyTyped.state ?? '',
          body
        );
      }
      if (code === 'SUB_TENANT_HAS_COMPANIES' && errorBodyTyped) {
        throw new DeleteSubTenantHasCompaniesError(
          message,
          errorBodyTyped.companies_count ?? 0,
          body
        );
      }
      if (code === 'SUB_TENANT_HAS_FISCAL_ENTRIES') {
        throw new DeleteSubTenantFiscalLockedError(message, body);
      }
      throw new ScellValidationError(message, errors, body);
    }
    case 429: {
      const retryAfter = headers?.get('Retry-After');
      throw new ScellRateLimitError(
        message,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
        body
      );
    }
    default:
      if (status >= 500) {
        throw new ScellServerError(message, status, body);
      }
      throw new ScellError(message, status, code, body);
  }
}

/**
 * Common types used across the SDK
 */

/**
 * Environment mode for API operations
 */
export type Environment = 'sandbox' | 'production';

/**
 * ISO 8601 date string (YYYY-MM-DD)
 */
export type DateString = string;

/**
 * ISO 8601 datetime string
 */
export type DateTimeString = string;

/**
 * UUID string
 */
export type UUID = string;

/**
 * French SIRET number (14 digits)
 */
export type Siret = string;

/**
 * French SIREN number (9 digits)
 */
export type Siren = string;

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = string;

/**
 * Address structure
 */
export interface Address {
  line1: string;
  line2?: string | undefined;
  postal_code: string;
  city: string;
  country?: string | undefined;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Single item response wrapper
 */
export interface SingleResponse<T> {
  data: T;
}

/**
 * Message response
 */
export interface MessageResponse {
  message: string;
}

/**
 * Message with data response
 */
export interface MessageWithDataResponse<T> {
  message: string;
  data: T;
}

/**
 * Pagination options for list requests
 */
export interface PaginationOptions {
  page?: number | undefined;
  per_page?: number | undefined;
}

/**
 * Date range filter options
 */
export interface DateRangeOptions {
  from?: DateString | undefined;
  to?: DateString | undefined;
}

/**
 * API error response structure
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]> | undefined;
  code?: string | undefined;
}

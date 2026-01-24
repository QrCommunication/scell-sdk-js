import type {
  CurrencyCode,
  DateRangeOptions,
  DateTimeString,
  PaginationOptions,
  UUID,
} from './common.js';

/**
 * Transaction type
 */
export type TransactionType = 'credit' | 'debit';

/**
 * Transaction service
 */
export type TransactionService = 'invoice' | 'signature' | 'manual' | 'admin';

/**
 * Balance entity
 */
export interface Balance {
  amount: number;
  currency: CurrencyCode;
  auto_reload_enabled: boolean;
  auto_reload_threshold: number | null;
  auto_reload_amount: number | null;
  low_balance_alert_threshold: number;
  critical_balance_alert_threshold: number;
}

/**
 * Transaction entity
 */
export interface Transaction {
  id: UUID;
  type: TransactionType;
  service: TransactionService;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_type: string | null;
  reference_id: UUID | null;
  created_at: DateTimeString;
}

/**
 * Balance reload input
 */
export interface ReloadBalanceInput {
  /** Amount to reload (10-10000 EUR) */
  amount: number;
}

/**
 * Balance reload response
 */
export interface ReloadBalanceResponse {
  message: string;
  transaction: {
    id: UUID;
    amount: number;
    balance_after: number;
  };
}

/**
 * Balance settings update input
 */
export interface UpdateBalanceSettingsInput {
  auto_reload_enabled?: boolean | undefined;
  auto_reload_threshold?: number | undefined;
  auto_reload_amount?: number | undefined;
  low_balance_alert_threshold?: number | undefined;
  critical_balance_alert_threshold?: number | undefined;
}

/**
 * Transaction list filter options
 */
export interface TransactionListOptions
  extends PaginationOptions,
    DateRangeOptions {
  type?: TransactionType | undefined;
  service?: TransactionService | undefined;
}

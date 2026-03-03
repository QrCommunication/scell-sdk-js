/**
 * Balance Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageWithDataResponse,
  PaginatedResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  Balance,
  ReloadBalanceInput,
  ReloadBalanceResponse,
  Transaction,
  TransactionListOptions,
  UpdateBalanceSettingsInput,
} from '../types/balance.js';

/**
 * Balance API resource
 *
 * @example
 * ```typescript
 * // Check balance
 * const balance = await client.balance.get();
 * console.log(`Current balance: ${balance.amount} ${balance.currency}`);
 *
 * // Reload balance
 * await client.balance.reload({ amount: 100 });
 *
 * // View transactions
 * const transactions = await client.balance.transactions({
 *   type: 'debit',
 *   service: 'invoice'
 * });
 * ```
 */
export class BalanceResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get current balance and settings
   *
   * @param requestOptions - Request options
   * @returns Current balance details
   *
   * @example
   * ```typescript
   * const { data: balance } = await client.balance.get();
   * console.log(`Balance: ${balance.amount} ${balance.currency}`);
   *
   * if (balance.amount < balance.low_balance_alert_threshold) {
   *   console.log('Warning: Low balance!');
   * }
   * ```
   */
  async get(requestOptions?: RequestOptions): Promise<SingleResponse<Balance>> {
    return this.http.get<SingleResponse<Balance>>(
      '/balance',
      undefined,
      requestOptions
    );
  }

  /**
   * Reload balance
   *
   * Note: This is a simulation endpoint. In production, use Stripe integration.
   *
   * @param input - Reload amount (10-10000 EUR)
   * @param requestOptions - Request options
   * @returns Reload transaction details
   *
   * @example
   * ```typescript
   * const { transaction } = await client.balance.reload({ amount: 100 });
   * console.log(`New balance: ${transaction.balance_after}`);
   * ```
   */
  async reload(
    input: ReloadBalanceInput,
    requestOptions?: RequestOptions
  ): Promise<ReloadBalanceResponse> {
    return this.http.post<ReloadBalanceResponse>(
      '/balance/reload',
      input,
      requestOptions
    );
  }

  /**
   * Update balance settings
   *
   * Configure auto-reload and alert thresholds.
   *
   * @param input - Settings to update
   * @param requestOptions - Request options
   * @returns Updated settings
   *
   * @example
   * ```typescript
   * await client.balance.updateSettings({
   *   auto_reload_enabled: true,
   *   auto_reload_threshold: 50,
   *   auto_reload_amount: 200,
   *   low_balance_alert_threshold: 100,
   *   critical_balance_alert_threshold: 25
   * });
   * ```
   */
  async updateSettings(
    input: UpdateBalanceSettingsInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Partial<Balance>>> {
    return this.http.put<MessageWithDataResponse<Partial<Balance>>>(
      '/balance/settings',
      input,
      requestOptions
    );
  }

  /**
   * List balance transactions
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of transactions
   *
   * @example
   * ```typescript
   * // List all invoice debits
   * const { data, meta } = await client.balance.transactions({
   *   type: 'debit',
   *   service: 'invoice',
   *   from: '2024-01-01',
   *   to: '2024-01-31'
   * });
   *
   * data.forEach(tx => {
   *   console.log(`${tx.description}: -${tx.amount} EUR`);
   * });
   * ```
   */
  async transactions(
    options: TransactionListOptions = {},
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Transaction>> {
    return this.http.get<PaginatedResponse<Transaction>>(
      '/balance/transactions',
      options as Record<string, string | number | boolean | undefined>,
      requestOptions
    );
  }
}

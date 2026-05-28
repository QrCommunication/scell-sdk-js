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
 * Balance API resource.
 *
 * @deprecated Since v2.24.0. The legacy `/balance/*` endpoints have been
 *   removed server-side (Wave B3 refactor, 2026-05-10). Any call against
 *   this resource will return HTTP 404 in production. The replacement
 *   surface lives on `ScellApiClient.billing` ({@link BillingResource}) :
 *
 *   - `client.balance.get()`             -> `client.billing.usage()`
 *   - `client.balance.reload({...})`     -> `client.billing.topUp({...})`
 *   - `client.balance.updateSettings()`  -> Use the dashboard UI; the
 *     auto-reload settings now live on the tenant profile, not the
 *     balance ledger.
 *   - `client.balance.transactions()`    -> `client.billing.transactions()`
 *
 *   The class is kept exported solely for backward compatibility and will
 *   be removed in v3.0.0.
 */
export class BalanceResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get current balance and settings.
   *
   * @deprecated Since v2.24.0 — backend endpoint `/balance` removed (404).
   *   Use {@link BillingResource.usage} instead :
   *   `await client.billing.usage()`.
   *
   * @param requestOptions - Request options
   * @returns Current balance details
   */
  async get(requestOptions?: RequestOptions): Promise<SingleResponse<Balance>> {
    return this.http.get<SingleResponse<Balance>>(
      '/balance',
      undefined,
      requestOptions
    );
  }

  /**
   * Reload balance.
   *
   * @deprecated Since v2.24.0 — backend endpoint `/balance/reload` removed
   *   (404). Use {@link BillingResource.topUp} instead :
   *   `await client.billing.topUp({ amount: 100 })`. The Stripe flow now
   *   returns a Payment Intent client secret that must be confirmed
   *   client-side.
   *
   * @param input - Reload amount (10-10000 EUR)
   * @param requestOptions - Request options
   * @returns Reload transaction details
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
   * Update balance settings.
   *
   * @deprecated Since v2.24.0 — backend endpoint `/balance/settings`
   *   removed (404). The auto-reload + alert threshold configuration now
   *   lives on the tenant profile. Manage it through the dashboard UI or
   *   via the (forthcoming) admin SDK ; there is no public REST equivalent
   *   for partner SDKs at this time.
   *
   * @param input - Settings to update
   * @param requestOptions - Request options
   * @returns Updated settings
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
   * List balance transactions.
   *
   * @deprecated Since v2.24.0 — backend endpoint `/balance/transactions`
   *   removed (404). Use {@link BillingResource.transactions} instead :
   *   `await client.billing.transactions({ type: 'debit' })`.
   *
   * @param options - Filter and pagination options
   * @param requestOptions - Request options
   * @returns Paginated list of transactions
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

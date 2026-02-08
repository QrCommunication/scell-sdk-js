/**
 * Billing Resource
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { MessageResponse, PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  BillingInvoice,
  BillingInvoiceListOptions,
  BillingTopUpConfirmInput,
  BillingTopUpInput,
  BillingTransaction,
  BillingTransactionListOptions,
  BillingUsage,
  BillingUsageOptions,
} from '../types/billing.js';

export class BillingResource {
  constructor(private readonly http: HttpClient) {}

  async invoices(options: BillingInvoiceListOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<BillingInvoice>> {
    return this.http.get<PaginatedResponse<BillingInvoice>>('/tenant/billing/invoices', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async showInvoice(invoiceId: string, requestOptions?: RequestOptions): Promise<SingleResponse<BillingInvoice>> {
    return this.http.get<SingleResponse<BillingInvoice>>(`/tenant/billing/invoices/${invoiceId}`, undefined, requestOptions);
  }

  async downloadInvoice(invoiceId: string, requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.getRaw(`/tenant/billing/invoices/${invoiceId}/download`, undefined, requestOptions);
  }

  async usage(options: BillingUsageOptions = {}, requestOptions?: RequestOptions): Promise<SingleResponse<BillingUsage>> {
    return this.http.get<SingleResponse<BillingUsage>>('/tenant/billing/usage', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async topUp(input: BillingTopUpInput, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/billing/top-up', input, requestOptions);
  }

  async confirmTopUp(input: BillingTopUpConfirmInput, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>('/tenant/billing/top-up/confirm', input, requestOptions);
  }

  async transactions(options: BillingTransactionListOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<BillingTransaction>> {
    return this.http.get<PaginatedResponse<BillingTransaction>>('/tenant/billing/transactions', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }
}

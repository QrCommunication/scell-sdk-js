/**
 * Credit Notes types (direct user / dashboard)
 *
 * @packageDocumentation
 */

import type {
  CurrencyCode,
  DateTimeString,
  PaginationOptions,
  UUID,
} from './common.js';

/**
 * Credit note item
 */
export interface CreditNoteItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

/**
 * Credit Note (direct user)
 */
export interface CreditNote {
  id: UUID;
  invoice_id: UUID;
  number: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  currency: CurrencyCode;
  reason: string;
  items: CreditNoteItem[];
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/**
 * Input for creating a credit note
 */
export interface CreateCreditNoteInput {
  invoice_id: UUID;
  reason: string;
  items: CreditNoteItem[];
  /**
   * Target a specific sub-tenant of the authenticated tenant. When
   * omitted, the credit note is created under the master tenant
   * directly. The server returns `404 SUB_TENANT_NOT_FOUND` if the
   * UUID does not belong to the current tenant (anti-IDOR).
   */
  sub_tenant_id?: UUID | undefined;
}

/**
 * List options for credit notes
 */
export interface CreditNoteListOptions extends PaginationOptions {
  sort?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
}

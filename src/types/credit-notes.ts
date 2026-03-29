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
}

/**
 * List options for credit notes
 */
export interface CreditNoteListOptions extends PaginationOptions {
  sort?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
}

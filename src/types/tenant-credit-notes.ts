/**
 * Tenant Credit Notes types
 *
 * @packageDocumentation
 */

import type {
  CurrencyCode,
  DateString,
  DateTimeString,
  PaginationOptions,
  Siret,
  UUID,
} from './common.js';

/**
 * Credit note status
 */
export type TenantCreditNoteStatus = 'draft' | 'sent' | 'cancelled';

/**
 * Credit note type
 */
export type TenantCreditNoteType = 'partial' | 'total';

/**
 * Credit note item
 */
export interface TenantCreditNoteItem {
  id: UUID;
  invoice_line_id?: UUID | undefined;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

/**
 * Tenant Credit Note
 */
export interface TenantCreditNote {
  id: UUID;
  credit_note_number: string;
  invoice_id: UUID;
  tenant_id: UUID;
  sub_tenant_id: UUID;
  status: TenantCreditNoteStatus;
  type: TenantCreditNoteType;
  reason: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: CurrencyCode;
  buyer_name?: string | undefined;
  buyer_siret?: Siret | undefined;
  seller_name?: string | undefined;
  seller_siret?: Siret | undefined;
  issue_date: DateString;
  created_at: DateTimeString;
  updated_at: DateTimeString;
  items?: TenantCreditNoteItem[] | undefined;
}

/**
 * Credit note item input for creation
 */
export interface TenantCreditNoteItemInput {
  invoice_line_id: UUID;
  quantity?: number | undefined;
}

/**
 * Input for creating a tenant credit note
 */
export interface CreateTenantCreditNoteInput {
  invoice_id: UUID;
  reason: string;
  type: TenantCreditNoteType;
  items?: TenantCreditNoteItemInput[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Line item remaining creditable information
 */
export interface RemainingCreditableLine {
  invoice_line_id: UUID;
  description: string;
  original_quantity: number;
  credited_quantity: number;
  remaining_quantity: number;
  unit_price: number;
}

/**
 * Remaining creditable information for an invoice
 */
export interface RemainingCreditable {
  invoice_id: UUID;
  invoice_total: number;
  credited_total: number;
  remaining_total: number;
  lines: RemainingCreditableLine[];
}

/**
 * List options for tenant credit notes
 */
export interface TenantCreditNoteListOptions extends PaginationOptions {
  status?: TenantCreditNoteStatus | undefined;
  date_from?: DateString | undefined;
  date_to?: DateString | undefined;
}

/**
 * Invoice Template types — personnalisation des factures et avoirs.
 *
 * Resolution cascade : explicit > sub_tenant default > tenant default > system default.
 *
 * @since 1.15.0
 */

import type { DateTimeString, UUID } from './common';

export type InvoiceTemplateScope = 'system' | 'tenant' | 'sub_tenant';

export type InvoiceTemplateLogoPosition = 'top-left' | 'top-center' | 'top-right';

/**
 * Invoice Template entity (output API)
 */
export interface InvoiceTemplate {
  id: UUID;
  scope: InvoiceTemplateScope;
  tenant_id: UUID | null;
  sub_tenant_id: UUID | null;
  name: string;
  description: string | null;
  is_default: boolean;
  is_available_to_subtenants: boolean;
  logo_url: string | null;
  logo_position: InvoiceTemplateLogoPosition;
  primary_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  background_color: string | null;
  header_text: string | null;
  footer_text: string | null;
  custom_mentions: string | null;
  advanced_options: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: DateTimeString | null;
  updated_at: DateTimeString | null;
}

/**
 * Input for creating a template (system scope is reserved to Scell.io).
 */
export interface CreateInvoiceTemplateInput {
  scope: 'tenant' | 'sub_tenant';
  sub_tenant_id?: UUID | undefined;
  name: string;
  description?: string | undefined;
  is_default?: boolean | undefined;
  is_available_to_subtenants?: boolean | undefined;
  logo_url?: string | undefined;
  logo_position?: InvoiceTemplateLogoPosition | undefined;
  primary_color?: string | undefined;
  accent_color?: string | undefined;
  text_color?: string | undefined;
  background_color?: string | undefined;
  header_text?: string | undefined;
  footer_text?: string | undefined;
  custom_mentions?: string | undefined;
  advanced_options?: Record<string, unknown> | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Input for partial update (PATCH).
 */
export type UpdateInvoiceTemplateInput = Partial<
  Omit<CreateInvoiceTemplateInput, 'scope' | 'sub_tenant_id'>
>;

/**
 * List filter options.
 */
export interface InvoiceTemplateListOptions {
  scope?: InvoiceTemplateScope | undefined;
  is_default?: boolean | undefined;
  per_page?: number | undefined;
  page?: number | undefined;
}

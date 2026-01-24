import type { DateTimeString, Environment, UUID } from './common.js';

/**
 * Available webhook events
 */
export type WebhookEvent =
  // Invoice events (outgoing)
  | 'invoice.created'
  | 'invoice.validated'
  | 'invoice.transmitted'
  | 'invoice.accepted'
  | 'invoice.rejected'
  | 'invoice.error'
  // Invoice events (incoming)
  | 'invoice.incoming.received'
  | 'invoice.incoming.validated'
  | 'invoice.incoming.accepted'
  | 'invoice.incoming.rejected'
  | 'invoice.incoming.disputed'
  // Signature events
  | 'signature.created'
  | 'signature.waiting'
  | 'signature.signed'
  | 'signature.completed'
  | 'signature.refused'
  | 'signature.expired'
  | 'signature.error'
  // Balance events
  | 'balance.low'
  | 'balance.critical';

/**
 * Webhook entity
 */
export interface Webhook {
  id: UUID;
  company_id: UUID | null;
  url: string;
  events: WebhookEvent[];
  is_active: boolean;
  environment: Environment;
  retry_count: number;
  timeout_seconds: number;
  failure_count: number;
  last_triggered_at: DateTimeString | null;
  last_success_at: DateTimeString | null;
  last_failure_at: DateTimeString | null;
  created_at: DateTimeString;
}

/**
 * Webhook with secret (returned on creation)
 */
export interface WebhookWithSecret extends Webhook {
  secret: string;
}

/**
 * Webhook creation input
 */
export interface CreateWebhookInput {
  url: string;
  events: WebhookEvent[];
  environment: Environment;
  headers?: Record<string, string> | undefined;
  retry_count?: number | undefined;
  timeout_seconds?: number | undefined;
}

/**
 * Webhook update input
 */
export interface UpdateWebhookInput {
  url?: string | undefined;
  events?: WebhookEvent[] | undefined;
  is_active?: boolean | undefined;
  headers?: Record<string, string> | undefined;
  retry_count?: number | undefined;
  timeout_seconds?: number | undefined;
}

/**
 * Webhook list filter options
 */
export interface WebhookListOptions {
  company_id?: UUID | undefined;
}

/**
 * Webhook test response
 */
export interface WebhookTestResponse {
  success: boolean;
  status_code?: number | undefined;
  response_time_ms?: number | undefined;
  error?: string | undefined;
}

/**
 * Webhook log entry
 */
export interface WebhookLog {
  id: UUID;
  event: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  response_time_ms: number | null;
  success: boolean;
  error_message: string | null;
  created_at: DateTimeString;
}

/**
 * Webhook payload structure (received by your endpoint)
 */
export interface WebhookPayload<T = unknown> {
  event: WebhookEvent;
  timestamp: DateTimeString;
  data: T;
}

/**
 * Invoice webhook payload data
 */
export interface InvoiceWebhookData {
  id: UUID;
  invoice_number: string;
  status: string;
  environment: Environment;
}

/**
 * Signature webhook payload data
 */
export interface SignatureWebhookData {
  id: UUID;
  title: string;
  status: string;
  environment: Environment;
  signer_id?: UUID | undefined;
  signer_email?: string | undefined;
}

/**
 * Balance webhook payload data
 */
export interface BalanceWebhookData {
  amount: number;
  currency: string;
  threshold: number;
}

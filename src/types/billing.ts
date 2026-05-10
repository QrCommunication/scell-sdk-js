/**
 * Billing Types
 *
 * Types for the tenant billing API.
 *
 * @packageDocumentation
 */

export interface BillingInvoice {
  id: string;
  invoice_number: string;
  period: string;
  total_ht: number;
  total_tax: number;
  total_ttc: number;
  status: string;
  currency: string;
  issued_at?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  lines?: BillingInvoiceLine[] | null;
}

export interface BillingInvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface BillingInvoiceListOptions {
  per_page?: number;
  page?: number;
}

export interface BillingUsage {
  period: string;
  invoices_count: number;
  credit_notes_count: number;
  signatures_count: number;
  total_cost: number;
  currency: string;
  breakdown?: Record<string, unknown> | null;
}

export interface BillingUsageOptions {
  period?: string;
}

export interface BillingTopUpInput {
  amount: number;
  payment_method?: string;
}

export interface BillingTopUpConfirmInput {
  payment_intent_id: string;
}

export interface BillingTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description?: string | null;
  reference?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export interface BillingTransactionListOptions {
  per_page?: number;
  page?: number;
}

/**
 * PaymentIntent — returned by `billing.payInvoice()`.
 *
 * Pass `clientSecret` to Stripe.js `confirmCardPayment()` to finalize
 * the payment on the client side.
 *
 * @since 2.2.0
 */
export interface PaymentIntent {
  /** Stripe PaymentIntent client_secret — pass to Stripe.js confirmCardPayment() */
  client_secret: string;
  /** Stripe PaymentIntent ID (pi_...) */
  payment_intent_id: string;
  /** Amount in smallest currency unit (e.g. cents for EUR) */
  amount: number;
  /** ISO 4217 currency code in lowercase (e.g. "eur") */
  currency: string;
  /** Stripe PaymentIntent status (e.g. "requires_payment_method", "succeeded") */
  status: string;
}

/**
 * Stats Types
 *
 * Types for the tenant statistics API.
 *
 * @packageDocumentation
 */

export interface StatsOverview {
  total_invoices: number;
  total_credit_notes: number;
  total_revenue: number;
  total_expenses: number;
  active_sub_tenants: number;
  currency: string;
  status_breakdown?: Record<string, number> | null;
  period_comparison?: Record<string, unknown> | null;
}

export interface StatsMonthly {
  month: string;
  invoices_count: number;
  credit_notes_count: number;
  revenue: number;
  expenses: number;
  daily_breakdown?: Record<string, unknown>[] | null;
}

export interface StatsOverviewOptions {
  period?: string;
  currency?: string;
}

export interface StatsMonthlyOptions {
  year?: number;
  month?: number;
}

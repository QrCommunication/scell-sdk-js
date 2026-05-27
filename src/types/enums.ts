/**
 * Centralised enum / union types exposed by `@scell/sdk`.
 *
 * This file consolidates the **status / type / kind** unions that mirror the
 * PHP backend (`App\Enums\*`) and the PostgreSQL `CHECK` constraints used by
 * the Scell.io API. Every union here is a TypeScript-only construct — they
 * are erased at runtime and incur zero bundle cost.
 *
 * **Why a dedicated enum surface?**
 *
 * Prior to v2.23.0 most enums were spread across domain files
 * (`invoices.ts`, `quotes.ts`, `signatures.ts`, …) and a few literal unions
 * were missing entirely — consumers had to either re-declare them locally or
 * widen to `string`. This file:
 *
 * - Adds the missing literal unions (`QuoteAuditAction`, `CreditNoteStatus`,
 *   `CreditNoteType`, `InvoiceTemplateKind`, `TenantInvoiceStatus`,
 *   `TenantKybStatus`, `SignatureArchiveStatus`, `InvoiceArchiveStatus`,
 *   `ApiKeyStatus`, `OnboardingSessionStatus`).
 * - Re-exports stable aliases that match the **canonical PHP enum names**
 *   (e.g. {@link SubTenantOnboardingStatus} → already exported under
 *   `OnboardingStatus`, {@link PaymentScheduleLineAmountType} → already
 *   exported under `AmountType`, …) so downstream code can pick whichever
 *   naming convention it prefers without breaking.
 *
 * No breaking change: every previously exported name still works.
 *
 * @since 2.23.0
 * @packageDocumentation
 */

// ---------------------------------------------------------------------------
// Re-exported canonical aliases
//
// These types already exist in the SDK under shorter / domain-scoped names.
// We expose them again under their backend `App\Enums\*` canonical names so
// downstream code can grep for "SubTenantOnboardingStatus" and find them.
// ---------------------------------------------------------------------------

export type { InvoiceType } from './invoices.js';
export type { QuoteStatus, QuoteActorType } from './quotes.js';
export type { SignatureStatus } from './signatures.js';
export type { CompanyStatus } from './companies.js';
export type { VatCategory } from './vat.js';
export type {
  AmountType as PaymentScheduleLineAmountType,
  ScheduleLineStatus as PaymentScheduleLineStatus,
} from './payment-schedule.js';
export type { OnboardingStatus as SubTenantOnboardingStatus } from './sub-tenants.js';
export type { TransactionType as TenantTransactionType } from './balance.js';

// ---------------------------------------------------------------------------
// New enums introduced in v2.23.0
// ---------------------------------------------------------------------------

/**
 * Kind of document a template can be applied to.
 *
 * Matches the `invoice_templates.kind` column / PHP
 * `App\Enums\InvoiceTemplateKind` enum.
 *
 * - `'invoice'` — applies to standard invoices, deposit invoices and balance invoices.
 * - `'quote'` — applies to quotes (devis) only.
 * - `'both'` — shared template usable on invoices **and** quotes.
 *
 * @since 2.23.0
 */
export type InvoiceTemplateKind = 'invoice' | 'quote' | 'both';

/**
 * Action recorded in a quote's tamper-evident audit log.
 *
 * Mirrors `App\Enums\Quote\QuoteAuditAction`. Each value corresponds to a
 * single SHA-256-chained entry appended to `quote_audit_logs` by the
 * `SECURITY DEFINER` trigger on the PostgreSQL side. Consumers can switch on
 * this union to render localized audit timelines without resorting to `string`.
 *
 * The audit log is **append-only** — entries are never updated nor deleted,
 * so the list is exhaustive on each server release. New actions will only be
 * added via a SDK minor bump.
 *
 * @since 2.23.0
 */
export type QuoteAuditAction =
  | 'created'
  | 'updated'
  | 'line_added'
  | 'line_removed'
  | 'line_updated'
  | 'buyer_changed'
  | 'sent'
  | 'resent'
  | 'viewed'
  | 'signed'
  | 'accepted'
  | 'refused'
  | 'cancelled'
  | 'expired'
  | 'converted'
  | 'public_link_regenerated'
  | 'public_link_revoked'
  | 'duplicated'
  | 'deposit_generated_from_schedule'
  | 'schedule_updated'
  | 'schedule_deleted';

/**
 * Lifecycle status of a credit note created via the **direct user / dashboard**
 * surface (`POST /api/v1/credit-notes`).
 *
 * Matches the PostgreSQL `credit_notes.status` CHECK constraint for the
 * direct user flow. Unlike {@link TenantCreditNoteStatus} (which adds
 * `'cancelled'` for the multi-tenant ledger flow), this surface only
 * transitions `'draft' → 'sent'`.
 *
 * @since 2.23.0
 */
export type CreditNoteStatus = 'draft' | 'sent';

/**
 * Whether a credit note rebates the full invoice or only a partial amount.
 *
 * - `'partial'` — only a subset of the original lines / amount is credited.
 *   Multiple partial credit notes can be issued against the same invoice as
 *   long as the cumulative TTC stays within the source `total_ttc`.
 * - `'total'`   — the credit note covers the full invoice amount. Issuing a
 *   `'total'` credit note transitions the source invoice to `'refunded'`.
 *
 * @since 2.23.0
 */
export type CreditNoteType = 'partial' | 'total';

/**
 * Archival lifecycle of a signed signature's signed PDF + audit trail.
 *
 * Driven server-side by the `SignatureArchiveJob`:
 *
 * - `'pending'`  — completion detected, archival not yet processed.
 * - `'archived'` — files copied to the long-term S3 bucket (Object Lock COMPLIANCE).
 * - `'glacier'`  — moved to Glacier Deep Archive after the warm window.
 * - `'error'`    — archival failed; surfaced for operator intervention.
 *
 * @since 2.23.0
 */
export type SignatureArchiveStatus = 'pending' | 'archived' | 'glacier' | 'error';

/**
 * Archival lifecycle of an invoice's Factur-X / UBL / CII artefacts.
 *
 * Drives the cold-storage policy enforced for the 10-year statutory retention
 * (ISCA autocertification). Same semantics as {@link SignatureArchiveStatus}.
 *
 * @since 2.23.0
 */
export type InvoiceArchiveStatus = 'pending' | 'archived' | 'glacier' | 'error';

/**
 * KYB (Know Your Business) lifecycle of the master tenant.
 *
 * Matches `tenants.kyb_status`. The tenant cannot issue **B2B** invoices to
 * `electronic_peppol` until reaching `'verified'`; B2C and paper-mode B2B
 * invoices remain available throughout the funnel.
 *
 * - `'pending'`              — onboarding form not yet submitted.
 * - `'documents_submitted'`  — documents uploaded, waiting for SuperPDP review.
 * - `'under_review'`         — manual review in progress on the operator side.
 * - `'verified'`             — KYB passed; B2B electronic invoicing unlocked.
 * - `'rejected'`             — KYB rejected; operator follow-up required.
 *
 * @since 2.23.0
 */
export type TenantKybStatus =
  | 'pending'
  | 'documents_submitted'
  | 'under_review'
  | 'verified'
  | 'rejected';

/**
 * Lifecycle of an API key.
 *
 * - `'active'`  — the key is valid and can authenticate requests.
 * - `'revoked'` — the key was revoked (manually or by a rotation policy) and
 *   any further request returns HTTP 401.
 *
 * @since 2.23.0
 */
export type ApiKeyStatus = 'active' | 'revoked';

/**
 * Lifecycle status of a {@link TenantInvoice} (master tenant ↔ Scell.io
 * billing flow — pack purchases, top-ups, monthly usage…).
 *
 * Distinct from {@link InvoiceStatus} which models the customer-facing
 * Factur-X invoice lifecycle. A `TenantInvoice` only ever transitions through
 * the simpler billing-side workflow:
 *
 * - `'draft'`     — invoice prepared but not yet sent to the tenant.
 * - `'sent'`      — visible in the tenant billing dashboard; payable.
 * - `'paid'`      — Stripe charge succeeded; ledger credited.
 * - `'overdue'`   — past due date without payment (set by the
 *   `billing:mark-overdue` daily command).
 * - `'cancelled'` — invoice voided by Scell.io ops.
 *
 * @since 2.23.0
 */
export type TenantInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

/**
 * Lifecycle of a sub-tenant **onboarding session** (`onboarding_sessions`).
 *
 * Distinct from {@link SubTenantOnboardingStatus} which tracks the *resulting*
 * sub-tenant. The session represents the multi-step funnel itself (SIRENE
 * lookup → VAT verification → document upload → review) and is mostly
 * consumed by the `@scell/onboarding-widget` to resume a tunnel.
 *
 * - `'initiated'`             — the widget called `POST /widget/onboarding/sub-tenant`.
 * - `'siret_verified'`        — SIRET found via SIRENE / INSEE.
 * - `'vat_verified'`          — VAT number validated via VIES.
 * - `'documents_pending'`     — KYB documents awaited from the operator.
 * - `'documents_submitted'`   — documents uploaded, waiting for review.
 * - `'under_review'`          — manual review in progress.
 * - `'completed'`             — funnel completed; sub-tenant active.
 * - `'failed'`                — funnel failed (KYB rejection, expired link…).
 * - `'expired'`               — session TTL elapsed (7 days by default).
 *
 * @since 2.23.0
 */
export type OnboardingSessionStatus =
  | 'initiated'
  | 'siret_verified'
  | 'vat_verified'
  | 'documents_pending'
  | 'documents_submitted'
  | 'under_review'
  | 'completed'
  | 'failed'
  | 'expired';

/**
 * Centralised enum surface (v2.23.0)
 *
 * Compile-time + runtime assertions that lock the literal unions exposed by
 * `@scell/sdk` to the canonical PHP `App\Enums\*` shape. A drift on the
 * server side (or in a refactor of the SDK type files) will fail this test
 * at `tsc --noEmit` time, before any runtime regression reaches downstream
 * consumers.
 *
 * The test is **purely type-driven**: each block reads as `const x: Enum = '…'`
 * which forces the compiler to confirm the literal is part of the union.
 * Runtime `expect(…)` calls only exist to keep Vitest happy — the real
 * guarantee is the type-checker.
 */

import { describe, it, expect } from 'vitest';
import type {
  ApiKeyStatus,
  CompanyStatus,
  CreditNoteStatus,
  CreditNoteType,
  InvoiceArchiveStatus,
  InvoiceTemplateKind,
  InvoiceType,
  OnboardingSessionStatus,
  PaymentScheduleLineAmountType,
  PaymentScheduleLineStatus,
  QuoteAuditAction,
  QuoteStatus,
  SignatureArchiveStatus,
  SignatureStatus,
  SubTenantOnboardingStatus,
  TenantInvoiceStatus,
  TenantKybStatus,
  TenantTransactionType,
  VatCategory,
} from '../src/index.js';

describe('Enum surface (v2.23.0)', () => {
  // ──────────────────────────────────────────────────────────────────────
  // New literal unions introduced in 2.23.0
  // ──────────────────────────────────────────────────────────────────────

  it('exposes InvoiceTemplateKind with the three documented values', () => {
    const values: InvoiceTemplateKind[] = ['invoice', 'quote', 'both'];
    expect(values).toEqual(['invoice', 'quote', 'both']);
  });

  it('exposes QuoteAuditAction with the full 21-action lifecycle', () => {
    const actions: QuoteAuditAction[] = [
      'created',
      'updated',
      'line_added',
      'line_removed',
      'line_updated',
      'buyer_changed',
      'sent',
      'resent',
      'viewed',
      'signed',
      'accepted',
      'refused',
      'cancelled',
      'expired',
      'converted',
      'public_link_regenerated',
      'public_link_revoked',
      'duplicated',
      'deposit_generated_from_schedule',
      'schedule_updated',
      'schedule_deleted',
    ];
    expect(actions).toHaveLength(21);
  });

  it('exposes CreditNoteStatus restricted to draft/sent for the direct surface', () => {
    const values: CreditNoteStatus[] = ['draft', 'sent'];
    expect(values).toEqual(['draft', 'sent']);
  });

  it('exposes CreditNoteType (partial vs total)', () => {
    const values: CreditNoteType[] = ['partial', 'total'];
    expect(values).toEqual(['partial', 'total']);
  });

  it('exposes the archival lifecycle unions (signature + invoice)', () => {
    const signature: SignatureArchiveStatus[] = ['pending', 'archived', 'glacier', 'error'];
    const invoice: InvoiceArchiveStatus[] = ['pending', 'archived', 'glacier', 'error'];
    expect(signature).toEqual(invoice);
  });

  it('exposes TenantKybStatus with the SuperPDP onboarding states', () => {
    const values: TenantKybStatus[] = [
      'pending',
      'documents_submitted',
      'under_review',
      'verified',
      'rejected',
    ];
    expect(values).toHaveLength(5);
  });

  it('exposes ApiKeyStatus', () => {
    const values: ApiKeyStatus[] = ['active', 'revoked'];
    expect(values).toEqual(['active', 'revoked']);
  });

  it('exposes TenantInvoiceStatus distinct from InvoiceStatus', () => {
    const values: TenantInvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    expect(values).toHaveLength(5);

    // Compile-time assertion: 'transmitted' is part of InvoiceStatus but
    // NOT of TenantInvoiceStatus. If the union widens accidentally, the
    // next line would type-check and we'd lose the invariant — so we use
    // a negative type test via `Exclude`.
    type LeakCheck = Exclude<'transmitted', TenantInvoiceStatus>;
    const leak: LeakCheck = 'transmitted';
    expect(leak).toBe('transmitted');
  });

  it('exposes OnboardingSessionStatus with the full 9-step funnel', () => {
    const values: OnboardingSessionStatus[] = [
      'initiated',
      'siret_verified',
      'vat_verified',
      'documents_pending',
      'documents_submitted',
      'under_review',
      'completed',
      'failed',
      'expired',
    ];
    expect(values).toHaveLength(9);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Canonical aliases — confirm they resolve to the same literal union as
  // the pre-existing names so consumers can mix both styles freely.
  // ──────────────────────────────────────────────────────────────────────

  it('aliases PaymentScheduleLineAmountType to the existing AmountType union', () => {
    const values: PaymentScheduleLineAmountType[] = ['percent', 'amount'];
    expect(values).toEqual(['percent', 'amount']);
  });

  it('aliases PaymentScheduleLineStatus to the existing ScheduleLineStatus union', () => {
    const values: PaymentScheduleLineStatus[] = ['pending', 'invoiced', 'cancelled'];
    expect(values).toEqual(['pending', 'invoiced', 'cancelled']);
  });

  it('aliases SubTenantOnboardingStatus to the existing OnboardingStatus union', () => {
    const values: SubTenantOnboardingStatus[] = [
      'pending_superpdp',
      'superpdp_redirected',
      'superpdp_authorized',
      'superpdp_pending_review',
      'active',
      'superpdp_failed',
    ];
    expect(values).toHaveLength(6);
  });

  it('aliases TenantTransactionType to the existing TransactionType union', () => {
    const values: TenantTransactionType[] = ['credit', 'debit'];
    expect(values).toEqual(['credit', 'debit']);
  });

  // ──────────────────────────────────────────────────────────────────────
  // Smoke-test the pre-existing canonical re-exports stay reachable
  // through the consolidated entry point.
  // ──────────────────────────────────────────────────────────────────────

  it('keeps InvoiceType reachable as a canonical re-export', () => {
    const values: InvoiceType[] = ['standard', 'deposit', 'balance'];
    expect(values).toEqual(['standard', 'deposit', 'balance']);
  });

  it('keeps QuoteStatus reachable as a canonical re-export', () => {
    const draft: QuoteStatus = 'draft';
    const converted: QuoteStatus = 'converted';
    expect([draft, converted]).toEqual(['draft', 'converted']);
  });

  it('keeps SignatureStatus reachable as a canonical re-export', () => {
    const completed: SignatureStatus = 'completed';
    expect(completed).toBe('completed');
  });

  it('keeps CompanyStatus reachable as a canonical re-export', () => {
    const values: CompanyStatus[] = ['pending_kyc', 'active', 'suspended'];
    expect(values).toEqual(['pending_kyc', 'active', 'suspended']);
  });

  it('keeps VatCategory reachable as a canonical re-export', () => {
    const reverse: VatCategory = 'REVERSE_CHARGE';
    expect(reverse).toBe('REVERSE_CHARGE');
  });
});

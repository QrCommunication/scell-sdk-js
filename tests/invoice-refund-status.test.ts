/**
 * Invoice refund status types (v2.22.0)
 *
 * Compile-time + runtime assertions covering the new fields exposed by the
 * Scell.io API on 2026-05-27:
 *  - InvoiceStatus extended with 'refunded' | 'partially_refunded' and the
 *    intermediate processing states ('validating', 'converting', 'transmitting',
 *    'received', 'completed') aligned on the PostgreSQL CHECK constraint.
 *  - RefundStatus union ('none' | 'partial' | 'full').
 *  - Invoice.refund_status?: RefundStatus and Invoice.total_refunded?: number.
 *
 * The tests intentionally lean on TypeScript's structural typing to catch any
 * future drift between the server contract and the SDK union literals.
 */

import { describe, it, expect } from 'vitest';
import type { Invoice, InvoiceStatus, RefundStatus } from '../src/index.js';

describe('Invoice refund status (v2.22.0)', () => {
  it('accepts the new "refunded" and "partially_refunded" InvoiceStatus values', () => {
    const refunded: InvoiceStatus = 'refunded';
    const partial: InvoiceStatus = 'partially_refunded';
    const fullyPaid: InvoiceStatus = 'paid';
    const completed: InvoiceStatus = 'completed';
    const received: InvoiceStatus = 'received';

    expect(refunded).toBe('refunded');
    expect(partial).toBe('partially_refunded');
    expect(fullyPaid).toBe('paid');
    expect(completed).toBe('completed');
    expect(received).toBe('received');
  });

  it('exposes RefundStatus with the three documented values', () => {
    const none: RefundStatus = 'none';
    const partial: RefundStatus = 'partial';
    const full: RefundStatus = 'full';

    expect<RefundStatus[]>([none, partial, full]).toEqual(['none', 'partial', 'full']);
  });

  it('allows refund_status + total_refunded on the Invoice payload', () => {
    // Structural assertion: the literal must satisfy the Invoice type without
    // requiring any cast. If a future refactor renames/removes the fields the
    // compiler will fail this test at build time.
    const invoice: Pick<Invoice, 'id' | 'status' | 'refund_status' | 'total_refunded'> = {
      id: '00000000-0000-0000-0000-000000000001',
      status: 'partially_refunded',
      refund_status: 'partial',
      total_refunded: 42.5,
    };

    expect(invoice.refund_status).toBe('partial');
    expect(invoice.total_refunded).toBe(42.5);
    expect(invoice.status).toBe('partially_refunded');
  });

  it('keeps refund_status and total_refunded optional for backward compatibility', () => {
    // Older API responses (pre-2026-05-27) MUST still be assignable.
    const legacy: Pick<Invoice, 'id' | 'status' | 'refund_status' | 'total_refunded'> = {
      id: '00000000-0000-0000-0000-000000000002',
      status: 'paid',
    };

    expect(legacy.refund_status).toBeUndefined();
    expect(legacy.total_refunded).toBeUndefined();
  });
});

/**
 * PaymentMeansCode + markPaid signature (v2.25.0)
 *
 * Covers the Factur-X BT-81 payment means code introduced in API 2026-05-28
 * via the backend enum `App\Enums\Invoice\PaymentMeansCode`. The 11 literal
 * UN/ECE 4461 codes are exposed as the `PaymentMeansCode` union, the FR/EN
 * label maps as frozen objects, and the `commonB2bFrance` helper as a frozen
 * tuple.
 *
 * The tests rely on TypeScript's structural typing to catch any future drift
 * between the server contract (FormRequest validation) and the SDK union.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScellApiClient } from '../src/index.js';
import {
  PAYMENT_MEANS_LABELS_FR,
  PAYMENT_MEANS_LABELS_EN,
  commonB2bFrance,
} from '../src/index.js';
import type {
  CreditNote,
  Invoice,
  MarkPaidInput,
  PaymentMeansCode,
} from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('PaymentMeansCode (v2.25.0)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  // -------------------------------------------------------------------------
  // Enum literal coverage
  // -------------------------------------------------------------------------

  it('accepts all 11 UN/ECE 4461 codes mirrored from the PHP enum', () => {
    // Compile-time : every literal must satisfy PaymentMeansCode without cast.
    // If a code is renamed/removed server-side, this test fails at build.
    const codes: PaymentMeansCode[] = [
      '1',  // INSTRUMENT_NOT_DEFINED
      '10', // IN_CASH
      '20', // CHEQUE
      '30', // CREDIT_TRANSFER
      '42', // PAYMENT_TO_BANK_ACCOUNT
      '48', // BANK_CARD
      '49', // DIRECT_DEBIT
      '57', // STANDING_AGREEMENT
      '58', // SEPA_CREDIT_TRANSFER
      '59', // SEPA_DIRECT_DEBIT
      '97', // CLEARING_BETWEEN_PARTNERS
    ];

    expect(codes).toHaveLength(11);
    expect(new Set(codes).size).toBe(11);
  });

  it('exposes a French label for every code (mirrors PaymentMeansCode::label())', () => {
    expect(Object.keys(PAYMENT_MEANS_LABELS_FR).sort()).toEqual(
      ['1', '10', '20', '30', '42', '48', '49', '57', '58', '59', '97'].sort()
    );
    expect(PAYMENT_MEANS_LABELS_FR['30']).toBe('Virement');
    expect(PAYMENT_MEANS_LABELS_FR['58']).toBe('Virement SEPA');
    expect(PAYMENT_MEANS_LABELS_FR['48']).toBe('Carte bancaire');
    expect(PAYMENT_MEANS_LABELS_FR['20']).toBe('Chèque');
  });

  it('exposes an English label for every code (mirrors PaymentMeansCode::labelEn())', () => {
    expect(Object.keys(PAYMENT_MEANS_LABELS_EN).sort()).toEqual(
      ['1', '10', '20', '30', '42', '48', '49', '57', '58', '59', '97'].sort()
    );
    expect(PAYMENT_MEANS_LABELS_EN['30']).toBe('Credit transfer');
    expect(PAYMENT_MEANS_LABELS_EN['58']).toBe('SEPA credit transfer');
    expect(PAYMENT_MEANS_LABELS_EN['48']).toBe('Bank card');
  });

  it('exposes commonB2bFrance ordered subset (mirrors PaymentMeansCode::commonB2bFrance())', () => {
    expect(commonB2bFrance).toEqual(['58', '30', '20', '48', '59', '10']);
    // Frozen at runtime to avoid downstream mutation.
    expect(() => {
      // @ts-expect-error commonB2bFrance is readonly + Object.freeze'd
      commonB2bFrance.push('1');
    }).toThrow();
  });

  // -------------------------------------------------------------------------
  // Invoice / CreditNote payload fields
  // -------------------------------------------------------------------------

  it('allows payment_means_code + payment_means_text on Invoice payload', () => {
    const invoice: Pick<Invoice, 'id' | 'status' | 'payment_means_code' | 'payment_means_text'> = {
      id: '00000000-0000-0000-0000-000000000001',
      status: 'paid',
      payment_means_code: '58',
      payment_means_text: 'BNP Paribas',
    };

    expect(invoice.payment_means_code).toBe('58');
    expect(invoice.payment_means_text).toBe('BNP Paribas');
  });

  it('keeps payment_means_code + payment_means_text optional on Invoice (legacy responses)', () => {
    // Older API responses (pre-2026-05-28) MUST still be assignable.
    const legacy: Pick<Invoice, 'id' | 'status' | 'payment_means_code' | 'payment_means_text'> = {
      id: '00000000-0000-0000-0000-000000000002',
      status: 'draft',
    };

    expect(legacy.payment_means_code).toBeUndefined();
    expect(legacy.payment_means_text).toBeUndefined();
  });

  it('allows payment_means_code + payment_means_text on CreditNote payload', () => {
    const creditNote: Pick<
      CreditNote,
      'id' | 'invoice_id' | 'payment_means_code' | 'payment_means_text'
    > = {
      id: '00000000-0000-0000-0000-000000000010',
      invoice_id: '00000000-0000-0000-0000-000000000001',
      payment_means_code: '58',
      payment_means_text: 'BNP Paribas',
    };

    expect(creditNote.payment_means_code).toBe('58');
    expect(creditNote.payment_means_text).toBe('BNP Paribas');
  });

  // -------------------------------------------------------------------------
  // markPaid() signature
  // -------------------------------------------------------------------------

  it('happy path: markPaid sends payment_means_code + optional fields in body', async () => {
    const mockResponse = {
      data: {
        id: 'invoice-uuid',
        invoice_number: 'FACT-2026-042',
        status: 'paid',
        paid_at: '2026-05-28T10:30:00Z',
        payment_reference: 'VIR-2026-0042',
        payment_means_code: '58',
        payment_means_text: 'BNP Paribas',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(mockResponse),
    });

    const client = new ScellApiClient('sk_live_test');
    const opts: MarkPaidInput = {
      payment_means_code: '58',
      payment_means_text: 'BNP Paribas',
      payment_reference: 'VIR-2026-0042',
      paid_at: '2026-05-28T10:30:00Z',
      note: 'Payment received via SEPA',
    };
    const result = await client.invoices.markPaid('invoice-uuid', opts);

    expect(result.data.status).toBe('paid');
    expect(result.data.payment_means_code).toBe('58');
    expect(result.data.payment_means_text).toBe('BNP Paribas');

    // The body must carry the payment_means_code (would 422 server-side otherwise).
    const [, requestInit] = mockFetch.mock.calls[0]!;
    const body = JSON.parse((requestInit as RequestInit).body as string);
    expect(body).toMatchObject({
      payment_means_code: '58',
      payment_means_text: 'BNP Paribas',
      payment_reference: 'VIR-2026-0042',
      paid_at: '2026-05-28T10:30:00Z',
      note: 'Payment received via SEPA',
    });
  });

  it('compile-time: markPaid({ payment_means_code }) — minimal valid payload', async () => {
    const mockResponse = {
      data: {
        id: 'invoice-uuid',
        invoice_number: 'FACT-2026-043',
        status: 'paid',
        payment_means_code: '30',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(mockResponse),
    });

    const client = new ScellApiClient('sk_live_test');
    // No optional fields — only the required payment_means_code.
    const result = await client.invoices.markPaid('invoice-uuid', {
      payment_means_code: '30',
    });

    expect(result.data.payment_means_code).toBe('30');
  });

  it('compile-time: every PaymentMeansCode literal is accepted by markPaid()', () => {
    // This test never calls the API — it is purely a TypeScript surface check
    // ensuring that every UN/ECE 4461 code we expose can flow into MarkPaidInput
    // without `as PaymentMeansCode` casts.
    const allInputs: MarkPaidInput[] = (
      ['1', '10', '20', '30', '42', '48', '49', '57', '58', '59', '97'] as const
    ).map((code) => ({ payment_means_code: code }));

    expect(allInputs).toHaveLength(11);
    expect(allInputs[0]!.payment_means_code).toBe('1');
    expect(allInputs[10]!.payment_means_code).toBe('97');
  });

  it('compile-time: payment_means_code is REQUIRED (TS would fail without it)', () => {
    // The following must NOT compile:
    //   const bad: MarkPaidInput = { payment_reference: 'X' };  // missing payment_means_code
    //
    // Runtime equivalent: assert that omitting payment_means_code from the
    // typed input is impossible without a cast.
    const valid: MarkPaidInput = { payment_means_code: '58' };
    expect(valid.payment_means_code).toBe('58');

    // @ts-expect-error payment_means_code is required since v2.25.0
    const bad: MarkPaidInput = { payment_reference: 'NO-MEANS' };
    // Runtime won't actually throw — TS catches it at build time.
    expect(bad).toBeDefined();
  });
});

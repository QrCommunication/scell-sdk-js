/**
 * PaymentScheduleResource Tests (v2.13.0)
 *
 * Covers all 7 methods:
 *  - get()
 *  - set()
 *  - patch()
 *  - delete()
 *  - summary()
 *  - convertLine()
 *  - presets()
 *
 * Also covers error mapping for 409/422 codes:
 *  - QUOTE_NOT_EDITABLE
 *  - SCHEDULE_LINE_ALREADY_INVOICED
 *  - SCHEDULE_SUM_EXCEEDS_TOTAL
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScellApiClient,
  QuoteNotEditableError,
  ScheduleLineAlreadyInvoicedError,
  ScheduleSumExceedsTotalError,
} from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const QUOTE_ID = '00000000-0000-0000-0000-00000000aaaa';
const LINE_ID = '00000000-0000-0000-0000-00000000bbbb';
const BASE_URL = 'https://api.scell.io/api/v1';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const SAMPLE_LINE = {
  id: LINE_ID,
  quote_id: QUOTE_ID,
  order: 0,
  amount_type: 'percent' as const,
  amount_value: '30.00',
  amount_ttc_snapshot: null,
  due_date: '2026-06-01',
  milestone_label: 'Acompte',
  description: null,
  auto_generate: true,
  status: 'pending' as const,
  invoice_id: null,
  invoiced_at: null,
  locked_at: null,
};

const SAMPLE_SCHEDULE_RESPONSE = {
  data: [SAMPLE_LINE],
  meta: {
    total_count: 1,
    pending_count: 1,
    invoiced_count: 0,
    total_percent: 30,
  },
};

const SAMPLE_SUMMARY = {
  schedule: {
    total_lines: 2,
    pending_lines: 1,
    invoiced_lines: 1,
    total_percent: 100,
    total_amount_ttc: 1200,
  },
  invoiced: {
    gross_ttc: 360,
    credit_notes_ttc: 0,
    net_ttc: 360,
    remaining_ttc: 840,
  },
  next_due: {
    line_id: LINE_ID,
    due_date: '2026-07-01',
    amount_ttc: 840,
    milestone_label: 'Solde',
  },
  overdue: [],
  superpdp_status: {
    transmitted: 1,
    failed: 0,
    pending: 0,
  },
};

describe('PaymentScheduleResource', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  // ──────────────────────────────────────────────
  // get()
  // ──────────────────────────────────────────────

  describe('get()', () => {
    it('fetches the payment schedule for a quote via GET', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_SCHEDULE_RESPONSE));

      const result = await client.quotes.paymentSchedule.get(QUOTE_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/quotes/${QUOTE_ID}/payment-schedule`);
      expect(init.method).toBe('GET');
      expect(result.data[0]?.id).toBe(LINE_ID);
      expect(result.data[0]?.amount_type).toBe('percent');
      expect(result.meta.total_count).toBe(1);
    });
  });

  // ──────────────────────────────────────────────
  // set()
  // ──────────────────────────────────────────────

  describe('set()', () => {
    it('creates the payment schedule via POST with lines', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(201, SAMPLE_SCHEDULE_RESPONSE));

      const lines = [
        { amount_type: 'percent' as const, amount_value: 30, milestone_label: 'Acompte' },
        { amount_type: 'percent' as const, amount_value: 70, milestone_label: 'Solde' },
      ];
      const result = await client.quotes.paymentSchedule.set(QUOTE_ID, lines);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/quotes/${QUOTE_ID}/payment-schedule`);
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.lines).toHaveLength(2);
      expect(body.lines[0].amount_value).toBe(30);
      expect(result.data).toHaveLength(1);
    });

    it('throws ScheduleSumExceedsTotalError on 422 SCHEDULE_SUM_EXCEEDS_TOTAL', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(422, {
          message: 'Schedule lines sum exceeds 100%.',
          code: 'SCHEDULE_SUM_EXCEEDS_TOTAL',
        })
      );

      await expect(
        client.quotes.paymentSchedule.set(QUOTE_ID, [
          { amount_type: 'percent', amount_value: 60, milestone_label: 'A' },
          { amount_type: 'percent', amount_value: 60, milestone_label: 'B' },
        ])
      ).rejects.toThrow(ScheduleSumExceedsTotalError);
    });

    it('throws QuoteNotEditableError on 409 QUOTE_NOT_EDITABLE', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, {
          message: 'Quote is accepted and its payment schedule is locked.',
          code: 'QUOTE_NOT_EDITABLE',
        })
      );

      await expect(
        client.quotes.paymentSchedule.set(QUOTE_ID, [])
      ).rejects.toThrow(QuoteNotEditableError);
    });
  });

  // ──────────────────────────────────────────────
  // patch()
  // ──────────────────────────────────────────────

  describe('patch()', () => {
    it('partially updates the schedule via PATCH', async () => {
      const updatedLine = { ...SAMPLE_LINE, due_date: '2026-07-15' };
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { ...SAMPLE_SCHEDULE_RESPONSE, data: [updatedLine] })
      );

      const result = await client.quotes.paymentSchedule.patch(QUOTE_ID, {
        update: [{ id: LINE_ID, due_date: '2026-07-15' }],
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/quotes/${QUOTE_ID}/payment-schedule`);
      expect(init.method).toBe('PATCH');

      const body = JSON.parse(init.body as string);
      expect(body.update[0].id).toBe(LINE_ID);
      expect(body.update[0].due_date).toBe('2026-07-15');
      expect(result.data[0]?.due_date).toBe('2026-07-15');
    });

    it('throws ScheduleLineAlreadyInvoicedError on 422 SCHEDULE_LINE_ALREADY_INVOICED', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(422, {
          message: 'Cannot remove a line that has already been invoiced.',
          code: 'SCHEDULE_LINE_ALREADY_INVOICED',
        })
      );

      await expect(
        client.quotes.paymentSchedule.patch(QUOTE_ID, { remove: [LINE_ID] })
      ).rejects.toThrow(ScheduleLineAlreadyInvoicedError);
    });
  });

  // ──────────────────────────────────────────────
  // delete()
  // ──────────────────────────────────────────────

  describe('delete()', () => {
    it('deletes the schedule via DELETE', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { message: 'Payment schedule deleted.' })
      );

      const result = await client.quotes.paymentSchedule.delete(QUOTE_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/quotes/${QUOTE_ID}/payment-schedule`);
      expect(init.method).toBe('DELETE');
      expect(result.message).toBe('Payment schedule deleted.');
    });
  });

  // ──────────────────────────────────────────────
  // summary()
  // ──────────────────────────────────────────────

  describe('summary()', () => {
    it('fetches payment summary via GET /payment-summary', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_SUMMARY));

      const summary = await client.quotes.paymentSchedule.summary(QUOTE_ID);

      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toBe(`${BASE_URL}/quotes/${QUOTE_ID}/payment-summary`);
      expect(summary.schedule.total_lines).toBe(2);
      expect(summary.invoiced.net_ttc).toBe(360);
      expect(summary.invoiced.remaining_ttc).toBe(840);
      expect(summary.overdue).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────
  // convertLine()
  // ──────────────────────────────────────────────

  describe('convertLine()', () => {
    it('converts a schedule line to a deposit invoice via POST', async () => {
      const mockInvoice = {
        id: '00000000-0000-0000-0000-00000000cccc',
        invoice_number: 'FAC-2026-0001',
        invoice_type: 'deposit',
        schedule_line_id: LINE_ID,
      };
      mockFetch.mockResolvedValueOnce(
        jsonResponse(201, { message: 'Deposit invoice created.', data: mockInvoice })
      );

      const result = await client.quotes.paymentSchedule.convertLine(QUOTE_ID, LINE_ID, {
        send_email: true,
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        `${BASE_URL}/quotes/${QUOTE_ID}/payment-schedule/lines/${LINE_ID}/convert`
      );
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.send_email).toBe(true);
      expect(result.data.invoice_number).toBe('FAC-2026-0001');
      expect(result.data.invoice_type).toBe('deposit');
    });

    it('works without options (default empty body)', async () => {
      const mockInvoice = { id: 'inv-uuid', invoice_number: 'FAC-2026-0002', invoice_type: 'deposit' };
      mockFetch.mockResolvedValueOnce(
        jsonResponse(201, { message: 'Done.', data: mockInvoice })
      );

      await client.quotes.paymentSchedule.convertLine(QUOTE_ID, LINE_ID);

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      // No extra keys should be present
      expect(Object.keys(body)).toHaveLength(0);
    });

    it('throws ScheduleLineAlreadyInvoicedError when line already converted', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(422, {
          message: 'This line has already been invoiced.',
          code: 'SCHEDULE_LINE_ALREADY_INVOICED',
        })
      );

      await expect(
        client.quotes.paymentSchedule.convertLine(QUOTE_ID, LINE_ID)
      ).rejects.toThrow(ScheduleLineAlreadyInvoicedError);
    });
  });

  // ──────────────────────────────────────────────
  // presets()
  // ──────────────────────────────────────────────

  describe('presets()', () => {
    it('fetches available presets via GET /payment-schedule/presets', async () => {
      const mockPresets = [
        {
          id: 'preset-30-70',
          label: 'Acompte 30% + Solde 70%',
          description: 'Standard 30/70 split',
          lines_count: 2,
          lines: [
            { amount_type: 'percent', amount_value: 30, milestone_label: 'Acompte', due_date: null, auto_generate: true },
            { amount_type: 'percent', amount_value: 70, milestone_label: 'Solde', due_date: null, auto_generate: false },
          ],
        },
      ];
      mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: mockPresets }));

      const { data: presets } = await client.quotes.paymentSchedule.presets();

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/payment-schedule/presets`);
      expect(init.method).toBe('GET');
      expect(presets).toHaveLength(1);
      expect(presets[0]?.label).toBe('Acompte 30% + Solde 70%');
      expect(presets[0]?.lines).toHaveLength(2);
    });
  });

  // ──────────────────────────────────────────────
  // Error class properties verification
  // ──────────────────────────────────────────────

  describe('Error class properties', () => {
    it('QuoteNotEditableError has status=409 and correct code', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(409, { message: 'Quote locked.', code: 'QUOTE_NOT_EDITABLE' })
      );

      try {
        await client.quotes.paymentSchedule.delete(QUOTE_ID);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(QuoteNotEditableError);
        expect((e as QuoteNotEditableError).status).toBe(409);
        expect((e as QuoteNotEditableError).code).toBe('QUOTE_NOT_EDITABLE');
        expect((e as QuoteNotEditableError).name).toBe('QuoteNotEditableError');
      }
    });

    it('ScheduleLineAlreadyInvoicedError has status=422 and correct code', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(422, {
          message: 'Already invoiced.',
          code: 'SCHEDULE_LINE_ALREADY_INVOICED',
        })
      );

      try {
        await client.quotes.paymentSchedule.patch(QUOTE_ID, { remove: [LINE_ID] });
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ScheduleLineAlreadyInvoicedError);
        expect((e as ScheduleLineAlreadyInvoicedError).status).toBe(422);
        expect((e as ScheduleLineAlreadyInvoicedError).code).toBe('SCHEDULE_LINE_ALREADY_INVOICED');
      }
    });

    it('ScheduleSumExceedsTotalError has status=422 and correct code', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(422, {
          message: 'Sum > 100%.',
          code: 'SCHEDULE_SUM_EXCEEDS_TOTAL',
        })
      );

      try {
        await client.quotes.paymentSchedule.set(QUOTE_ID, []);
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ScheduleSumExceedsTotalError);
        expect((e as ScheduleSumExceedsTotalError).status).toBe(422);
      }
    });
  });
});

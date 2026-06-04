/**
 * Recurring Invoices Resource Tests (v2.33.0 surface)
 *
 * Covers CRUD (list / get / create / update / delete), occurrences listing,
 * lifecycle controls (pause / activate / cancel) and runNow on both
 * ScellClient (Bearer) and ScellApiClient (X-API-Key).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellApiClient, ScellClient } from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const PROFILE_ID = '00000000-0000-0000-0000-00000000rec0';
const OCCURRENCE_ID = '00000000-0000-0000-0000-0000000occ0';
const BASE = 'https://api.scell.io/api/v1';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const sampleProfile = {
  id: PROFILE_ID,
  title: 'Abonnement mensuel — Acme',
  status: 'active',
  emission_mode: 'auto_send',
  environment: 'sandbox',
  tenant_id: '00000000-0000-0000-0000-00000000tnt0',
  sub_tenant_id: null,
  company_id: '00000000-0000-0000-0000-00000000cmp0',
  buyer_id: '00000000-0000-0000-0000-00000000buy0',
  buyer_name: 'Acme SAS',
  currency: 'EUR',
  output_format: 'facturx',
  payment_terms: null,
  recurrence: {
    interval_unit: 'month',
    interval_count: 1,
    day_of_month: 1,
    day_of_week: null,
    human: 'Tous les mois le 1er',
  },
  start_date: '2026-07-01',
  end_mode: 'never',
  end_date: null,
  max_occurrences: null,
  notify_before_days: 3,
  next_run_at: '2026-07-01T00:00:00Z',
  occurrences_count: 0,
  last_emitted_on: null,
  lines: [
    {
      description: 'Licence SaaS',
      quantity: 1,
      unit_price: 49,
      vat_rate: 20,
      unit: null,
      discount: null,
      category: null,
      total_ht: 49,
      total_tax: 9.8,
      total_ttc: 58.8,
    },
  ],
  totals: { total_ht: 49, total_tax: 9.8, total_ttc: 58.8 },
  created_at: '2026-06-04T10:00:00Z',
  updated_at: '2026-06-04T10:00:00Z',
};

const sampleOccurrence = {
  id: OCCURRENCE_ID,
  recurring_profile_id: PROFILE_ID,
  occurrence_number: 1,
  occurrence_date: '2026-07-01',
  status: 'emitted',
  invoice_id: '00000000-0000-0000-0000-00000000inv0',
  invoice_number: 'ACME-202607-00001',
  attempts: 1,
  last_error: null,
  emitted_at: '2026-07-01T00:05:00Z',
  failed_at: null,
  created_at: '2026-07-01T00:00:00Z',
};

describe('RecurringInvoicesResource', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('lists profiles with query params', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: [sampleProfile],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.recurringInvoices.list({
      status: 'active',
      sub_tenant_id: '00000000-0000-0000-0000-00000000sub0',
      per_page: 25,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.title).toBe('Abonnement mensuel — Acme');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${BASE}/recurring-invoices`);
    expect(url).toContain('status=active');
    expect(url).toContain('sub_tenant_id=00000000-0000-0000-0000-00000000sub0');
    expect(url).toContain('per_page=25');
    expect(init.method).toBe('GET');
  });

  it('gets a profile by id and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleProfile }));

    const client = new ScellApiClient('sk_test_xxx');
    const profile = await client.recurringInvoices.get(PROFILE_ID);

    expect(profile.id).toBe(PROFILE_ID);
    expect(profile.recurrence.human).toBe('Tous les mois le 1er');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}`);
    expect(init.method).toBe('GET');
  });

  it('creates a profile and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(201, { data: sampleProfile }));

    const client = new ScellApiClient('sk_test_xxx');
    const profile = await client.recurringInvoices.create({
      title: 'Abonnement mensuel — Acme',
      buyer_id: '00000000-0000-0000-0000-00000000buy0',
      currency: 'EUR',
      output_format: 'facturx',
      lines: [{ description: 'Licence SaaS', quantity: 1, unit_price: 49, vat_rate: 20 }],
      recurrence: { interval_unit: 'month', interval_count: 1, day_of_month: 1 },
      start_date: '2026-07-01',
      end_mode: 'never',
      emission_mode: 'auto_send',
      notify_before_days: 3,
    });

    expect(profile.id).toBe(PROFILE_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices`);
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body as string);
    expect(sent.title).toBe('Abonnement mensuel — Acme');
    expect(sent.recurrence.interval_unit).toBe('month');
    expect(sent.lines).toHaveLength(1);
  });

  it('updates a profile via PUT and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleProfile, notify_before_days: 7 } })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const profile = await client.recurringInvoices.update(PROFILE_ID, {
      notify_before_days: 7,
    });

    expect(profile.notify_before_days).toBe(7);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}`);
    expect(init.method).toBe('PUT');
  });

  it('deletes a profile and returns the message', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { message: 'Recurring invoice profile deleted' })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.recurringInvoices.delete(PROFILE_ID);

    expect(result.message).toBe('Recurring invoice profile deleted');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}`);
    expect(init.method).toBe('DELETE');
  });

  it('lists occurrences for a profile', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: [sampleOccurrence],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.recurringInvoices.occurrences(PROFILE_ID, { per_page: 50 });

    expect(result.data[0]!.invoice_number).toBe('ACME-202607-00001');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${BASE}/recurring-invoices/${PROFILE_ID}/occurrences`);
    expect(url).toContain('per_page=50');
    expect(init.method).toBe('GET');
  });

  it('pauses, activates and cancels a profile (POST + unwrap)', async () => {
    const client = new ScellApiClient('sk_test_xxx');

    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleProfile, status: 'paused' } })
    );
    const paused = await client.recurringInvoices.pause(PROFILE_ID);
    expect(paused.status).toBe('paused');
    let [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}/pause`);
    expect(init.method).toBe('POST');

    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleProfile, status: 'active' } })
    );
    const active = await client.recurringInvoices.activate(PROFILE_ID);
    expect(active.status).toBe('active');
    [url, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}/activate`);
    expect(init.method).toBe('POST');

    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleProfile, status: 'cancelled' } })
    );
    const cancelled = await client.recurringInvoices.cancel(PROFILE_ID);
    expect(cancelled.status).toBe('cancelled');
    [url, init] = mockFetch.mock.calls[2] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}/cancel`);
    expect(init.method).toBe('POST');
  });

  it('triggers runNow and returns the message (202)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(202, { message: 'Emission enqueued' })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.recurringInvoices.runNow(PROFILE_ID);

    expect(result.message).toBe('Emission enqueued');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/recurring-invoices/${PROFILE_ID}/run-now`);
    expect(init.method).toBe('POST');
  });

  it('is exposed on ScellClient (Bearer) as well', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleProfile }));

    const client = new ScellClient('bearer-token');
    expect(client.recurringInvoices).toBeDefined();

    const profile = await client.recurringInvoices.get(PROFILE_ID);
    expect(profile.id).toBe(PROFILE_ID);
  });
});

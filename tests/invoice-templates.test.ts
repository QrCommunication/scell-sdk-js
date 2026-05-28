/**
 * InvoiceTemplatesResource Tests (v2.24.0)
 *
 * Covers wiring of `InvoiceTemplatesResource` on both `ScellClient`
 * (Bearer auth) and `ScellApiClient` (X-API-Key auth) — previously the
 * resource existed in source but was orphan (not instantiated).
 *
 * Covers:
 *  - client.invoiceTemplates.list()
 *  - client.invoiceTemplates.create()
 *  - client.invoiceTemplates.delete()
 *  - Wiring on both ScellClient + ScellApiClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellClient, ScellApiClient } from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'https://api.scell.io/api/v1';
const TEMPLATE_ID = '00000000-0000-0000-0000-000000000aaa';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const SAMPLE_TEMPLATE = {
  id: TEMPLATE_ID,
  scope: 'tenant' as const,
  tenant_id: '00000000-0000-0000-0000-00000000bbbb',
  sub_tenant_id: null,
  name: 'Template par defaut',
  description: 'Mon template tenant',
  is_default: true,
  is_available_to_subtenants: false,
  logo_url: null,
  logo_position: 'top-left' as const,
  primary_color: '#1A73E8',
  accent_color: null,
  text_color: null,
  background_color: null,
  header_text: null,
  footer_text: 'Footer custom',
  custom_mentions: null,
  advanced_options: null,
  metadata: null,
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-28T00:00:00Z',
};

describe('InvoiceTemplatesResource — wiring', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('is exposed on ScellClient (Bearer)', () => {
    const client = new ScellClient('test-bearer-token');
    expect(client.invoiceTemplates).toBeDefined();
    expect(typeof client.invoiceTemplates.list).toBe('function');
    expect(typeof client.invoiceTemplates.create).toBe('function');
    expect(typeof client.invoiceTemplates.update).toBe('function');
    expect(typeof client.invoiceTemplates.delete).toBe('function');
    expect(typeof client.invoiceTemplates.markDefault).toBe('function');
    expect(typeof client.invoiceTemplates.uploadLogo).toBe('function');
  });

  it('is exposed on ScellApiClient (X-API-Key)', () => {
    const client = new ScellApiClient('sk_test_xxx');
    expect(client.invoiceTemplates).toBeDefined();
    expect(typeof client.invoiceTemplates.list).toBe('function');
  });
});

describe('InvoiceTemplatesResource — operations', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  it('lists templates via GET /invoice-templates', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: [SAMPLE_TEMPLATE],
        meta: { current_page: 1, per_page: 25, last_page: 1, total: 1 },
      }),
    );

    const result = await client.invoiceTemplates.list({ scope: 'tenant' });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/invoice-templates?scope=tenant`);
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('sk_test_xxx');
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe('Template par defaut');
  });

  it('creates a template via POST /invoice-templates', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(201, { data: SAMPLE_TEMPLATE }),
    );

    const created = await client.invoiceTemplates.create({
      scope: 'tenant',
      name: 'Template par defaut',
      primary_color: '#1A73E8',
      footer_text: 'Footer custom',
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/invoice-templates`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.scope).toBe('tenant');
    expect(body.name).toBe('Template par defaut');
    expect(body.primary_color).toBe('#1A73E8');
    expect(created.id).toBe(TEMPLATE_ID);
    expect(created.primary_color).toBe('#1A73E8');
  });

  it('deletes a template via DELETE /invoice-templates/{id}', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(204, ''));

    await client.invoiceTemplates.delete(TEMPLATE_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/invoice-templates/${TEMPLATE_ID}`);
    expect(init.method).toBe('DELETE');
  });
});

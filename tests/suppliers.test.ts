/**
 * Suppliers Resource Tests (v3.0.0 surface)
 *
 * **v3 breaking change**: Suppliers are derived from received invoices.
 * `create()` and `delete()` have been removed from the API (HTTP 405).
 *
 * This suite covers:
 * - list() / get() (unchanged)
 * - update() — enrichment-only (email, phone, notes, metadata); identity
 *   fields must NOT be forwarded to the server
 * - Both ScellClient (Bearer) and ScellApiClient (X-API-Key) exposure
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellApiClient, ScellClient } from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const SUPPLIER_ID = '00000000-0000-0000-0000-0000000005up';
const BASE = 'https://api.scell.io/api/v1';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const sampleSupplier = {
  id: SUPPLIER_ID,
  tenant_id: '00000000-0000-0000-0000-00000000tnt0',
  sub_tenant_id: null,
  name: 'Fournitures Express SARL',
  is_individual: false,
  siret: '98765432109876',
  vat_number: 'FR12987654321',
  legal_id: null,
  legal_id_scheme: null,
  email: 'contact@fournitures.fr',
  phone: '+33123456789',
  country: 'FR',
  billing_address: {
    line1: '5 Rue du Commerce',
    postal_code: '75015',
    city: 'Paris',
    country: 'FR',
  },
  metadata: null,
  notes: null,
  created_at: '2026-05-28T10:00:00Z',
  updated_at: '2026-05-28T10:00:00Z',
};

describe('SuppliersResource', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('lists suppliers with query params', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: [sampleSupplier],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.suppliers.list({ q: 'Express', is_individual: false, per_page: 25 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Fournitures Express SARL');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${BASE}/suppliers`);
    expect(url).toContain('q=Express');
    expect(url).toContain('is_individual=false');
    expect(url).toContain('per_page=25');
    expect(init.method).toBe('GET');
  });

  it('gets a supplier by id and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleSupplier }));

    const client = new ScellApiClient('sk_test_xxx');
    const supplier = await client.suppliers.get(SUPPLIER_ID);

    expect(supplier.id).toBe(SUPPLIER_ID);
    expect(supplier.siret).toBe('98765432109876');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/suppliers/${SUPPLIER_ID}`);
    expect(init.method).toBe('GET');
  });

  it('updates a supplier via PATCH and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleSupplier, notes: 'Preferred vendor' } })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const supplier = await client.suppliers.update(SUPPLIER_ID, { notes: 'Preferred vendor' });

    expect(supplier.notes).toBe('Preferred vendor');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/suppliers/${SUPPLIER_ID}`);
    expect(init.method).toBe('PATCH');
  });

  it('update() only sends enrichment fields — not identity fields', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          ...sampleSupplier,
          email: 'newemail@fournitures.fr',
          phone: '+33987654321',
          notes: 'Updated note',
          metadata: { crm_id: 'C-001' },
        },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const supplier = await client.suppliers.update(SUPPLIER_ID, {
      email: 'newemail@fournitures.fr',
      phone: '+33987654321',
      notes: 'Updated note',
      metadata: { crm_id: 'C-001' },
    });

    expect(supplier.email).toBe('newemail@fournitures.fr');
    expect(supplier.notes).toBe('Updated note');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/suppliers/${SUPPLIER_ID}`);
    expect(init.method).toBe('PATCH');

    const sent = JSON.parse(init.body as string);
    // Only enrichment fields are accepted
    expect(sent).toHaveProperty('email', 'newemail@fournitures.fr');
    expect(sent).toHaveProperty('phone', '+33987654321');
    expect(sent).toHaveProperty('notes', 'Updated note');
    expect(sent).toHaveProperty('metadata');
    // Identity fields must never be sent (they are read-only / derived from invoices)
    expect(sent).not.toHaveProperty('name');
    expect(sent).not.toHaveProperty('siret');
    expect(sent).not.toHaveProperty('vat_number');
    expect(sent).not.toHaveProperty('country');
    expect(sent).not.toHaveProperty('billing_address');
    expect(sent).not.toHaveProperty('is_individual');
  });

  it('does not expose create() on the suppliers resource', () => {
    const client = new ScellApiClient('sk_test_xxx');
    // @ts-expect-error — create() was removed in v3.0.0 (API returns 405)
    expect(typeof client.suppliers.create).toBe('undefined');
  });

  it('does not expose delete() on the suppliers resource', () => {
    const client = new ScellApiClient('sk_test_xxx');
    // @ts-expect-error — delete() was removed in v3.0.0 (API returns 405)
    expect(typeof client.suppliers.delete).toBe('undefined');
  });

  it('is exposed on ScellClient (Bearer) as well', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleSupplier }));

    const client = new ScellClient('bearer-token');
    expect(client.suppliers).toBeDefined();

    const supplier = await client.suppliers.get(SUPPLIER_ID);
    expect(supplier.id).toBe(SUPPLIER_ID);
  });
});

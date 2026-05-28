/**
 * CreditPacksResource Tests (v2.24.0)
 *
 * Covers:
 *  - client.creditPacks.list() -> GET /packs/public
 *  - client.creditPacks.get(slug) -> client-side filter on list()
 *  - Wiring on both ScellClient + ScellApiClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellClient, ScellApiClient } from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'https://api.scell.io/api/v1';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const SAMPLE_PACKS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    slug: 'starter',
    name: 'Starter',
    description: 'Pack de demarrage',
    amount_eur: 100,
    amount_euros: 100,
    credits_eur: 100,
    credits_euros: 100,
    bonus_eur: 0,
    bonus_euros: 0,
    bonus_percent: 0,
    currency: 'EUR',
    position: 1,
    is_recommended: false,
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    slug: 'pro',
    name: 'Pro',
    description: 'Pack recommande',
    amount_eur: 500,
    amount_euros: 500,
    credits_eur: 550,
    credits_euros: 550,
    bonus_eur: 50,
    bonus_euros: 50,
    bonus_percent: 10,
    currency: 'EUR',
    position: 2,
    is_recommended: true,
  },
];

describe('CreditPacksResource — wiring', () => {
  it('is exposed on ScellClient (Bearer)', () => {
    const client = new ScellClient('test-token');
    expect(client.creditPacks).toBeDefined();
    expect(typeof client.creditPacks.list).toBe('function');
    expect(typeof client.creditPacks.get).toBe('function');
  });

  it('is exposed on ScellApiClient (X-API-Key)', () => {
    const client = new ScellApiClient('sk_test_xxx');
    expect(client.creditPacks).toBeDefined();
  });
});

describe('CreditPacksResource — operations', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  it('lists active packs via GET /packs/public', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: SAMPLE_PACKS }));

    const packs = await client.creditPacks.list();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/packs/public`);
    expect(init.method).toBe('GET');
    expect(packs).toHaveLength(2);
    expect(packs[0]?.slug).toBe('starter');
    expect(packs[1]?.is_recommended).toBe(true);
  });

  it('get(slug) returns the matching pack', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: SAMPLE_PACKS }));

    const pack = await client.creditPacks.get('pro');

    expect(pack.slug).toBe('pro');
    expect(pack.amount_euros).toBe(500);
    expect(pack.bonus_percent).toBe(10);
  });

  it('get(slug) throws on unknown slug', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: SAMPLE_PACKS }));

    await expect(client.creditPacks.get('unicorn')).rejects.toThrow(
      /not found in active catalogue/,
    );
  });
});

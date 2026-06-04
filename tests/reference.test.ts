/**
 * ReferenceResource Tests (v2.29.0)
 *
 * Covers:
 *  - client.reference.countries() -> GET /reference/countries
 *  - client.reference.country(code) -> GET /reference/countries/{CODE} (uppercased)
 *  - Wiring on ScellClient, ScellApiClient and ScellPublicClient
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellClient, ScellApiClient, ScellPublicClient } from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const FR = {
  code: 'FR',
  name: 'France',
  known: true,
  is_eu: true,
  currency: 'EUR',
  vat: {
    label: 'Numéro de TVA intracommunautaire',
    example: 'FR12345678901',
    regex: '^FR[A-Z0-9]{2}\\d{9}$',
    vies_checkable: true,
  },
  national_id: {
    label: 'SIREN / SIRET',
    scheme: '0002',
    example: '12345678901234',
    regex: '^(\\d{9}|\\d{14})$',
    required_for_b2b: true,
  },
  legal_forms: [{ code: 'SAS', label: 'SAS — Société par actions simplifiée' }],
};

describe('ReferenceResource', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('lists countries via GET /reference/countries', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: [FR], meta: { count: 1 } }),
    );

    const client = new ScellClient('sk_test_x');
    const countries = await client.reference.countries();

    expect(countries).toHaveLength(1);
    expect(countries[0].code).toBe('FR');
    expect(countries[0].national_id.scheme).toBe('0002');
    expect(countries[0].legal_forms[0].code).toBe('SAS');

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/reference/countries');
  });

  it('fetches a single country and uppercases the code', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: FR }));

    const client = new ScellApiClient('sk_test_x');
    const fr = await client.reference.country('fr');

    expect(fr.code).toBe('FR');
    expect(fr.vat.vies_checkable).toBe(true);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/reference/countries/FR');
  });

  it('is wired on the public client', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: FR }));

    const client = new ScellPublicClient('pk_test_x');
    const fr = await client.reference.country('FR');

    expect(fr.known).toBe(true);
  });
});

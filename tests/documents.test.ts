/**
 * DocumentsResource Tests (v3.2.0)
 *
 * Covers:
 *  - documents.preview() — POST /documents/preview returning raw HTML text
 *  - Wiring on both ScellClient + ScellApiClient
 *  - 422 validation error mapping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScellClient,
  ScellApiClient,
  ScellValidationError,
} from '../src/index.js';

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

function htmlResponse(status: number, html: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'text/html; charset=UTF-8' }),
    text: () => Promise.resolve(html),
  };
}

describe('DocumentsResource — wiring', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('is exposed on ScellClient (Bearer)', () => {
    const client = new ScellClient('test-bearer-token');
    expect(client.documents).toBeDefined();
    expect(typeof client.documents.preview).toBe('function');
  });

  it('is exposed on ScellApiClient (X-API-Key)', () => {
    const client = new ScellApiClient('sk_test_xxx');
    expect(client.documents).toBeDefined();
    expect(typeof client.documents.preview).toBe('function');
  });
});

describe('DocumentsResource.preview()', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  it('renders a live HTML preview via POST /documents/preview', async () => {
    const html = '<html><body>Facture FAC-2026-0001 — ACME SAS</body></html>';
    mockFetch.mockResolvedValueOnce(htmlResponse(200, html));

    const result = await client.documents.preview({
      type: 'invoice',
      document_number: 'FAC-2026-0001',
      buyer: {
        name: 'ACME SAS',
        siret: '12345678900012',
        is_individual: false,
        address: { line1: '1 rue de la Paix', postal_code: '75001', city: 'Paris', country: 'FR' },
      },
      lines: [
        { description: 'Consulting', quantity: 2, unit_price: 800, tax_rate: 20 },
      ],
      issue_date: '2026-06-11',
      due_date: '2026-07-11',
      currency: 'EUR',
      notes: 'Merci de votre confiance.',
      payment_terms: 'Paiement à 30 jours.',
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/documents/preview`);
    expect(init.method).toBe('POST');

    // Body is JSON, response is raw text (HTML)
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Accept']).toBe('text/html');
    expect(headers['X-API-Key']).toBe('sk_test_xxx');

    const body = JSON.parse(init.body as string);
    expect(body.type).toBe('invoice');
    expect(body.document_number).toBe('FAC-2026-0001');
    expect(body.buyer.name).toBe('ACME SAS');
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0].unit_price).toBe(800);
    expect(body.currency).toBe('EUR');

    expect(result).toBe(html);
  });

  it('works with only the required type field (quote)', async () => {
    const html = '<html><body>Devis</body></html>';
    mockFetch.mockResolvedValueOnce(htmlResponse(200, html));

    const result = await client.documents.preview({ type: 'quote' });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/documents/preview`);
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ type: 'quote' });
    expect(result).toBe(html);
  });

  it('supports the credit_note type', async () => {
    mockFetch.mockResolvedValueOnce(htmlResponse(200, '<html>Avoir</html>'));

    await client.documents.preview({ type: 'credit_note' });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.type).toBe('credit_note');
  });

  it('throws ScellValidationError on 422', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'The lines field must not have more than 200 items.',
        errors: { lines: ['The lines field must not have more than 200 items.'] },
      })
    );

    await expect(
      client.documents.preview({ type: 'invoice', lines: [] })
    ).rejects.toThrow(ScellValidationError);
  });
});

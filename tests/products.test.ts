/**
 * Products & ProductCategories Resource Tests (v2.38.0)
 *
 * Mirror of buyers/suppliers test suites: asserts request URL, method and
 * payload of the scoped product catalog (tenant + sub_tenant), plus exposure
 * on both ScellClient (Bearer) and ScellApiClient (X-API-Key).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellApiClient, ScellClient } from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const PRODUCT_ID = '00000000-0000-0000-0000-0000000prod0';
const CATEGORY_ID = '00000000-0000-0000-0000-00000000cat0';
const BASE = 'https://api.scell.io/api/v1';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const sampleCategory = {
  id: CATEGORY_ID,
  tenant_id: '00000000-0000-0000-0000-00000000tnt0',
  sub_tenant_id: null,
  name: 'Conseil',
  color: '#0066FF',
  description: 'Prestations de conseil',
  position: 1,
  products_count: 4,
  metadata: null,
  created_at: '2026-06-07T10:00:00Z',
  updated_at: '2026-06-07T10:00:00Z',
};

const sampleProduct = {
  id: PRODUCT_ID,
  tenant_id: '00000000-0000-0000-0000-00000000tnt0',
  sub_tenant_id: null,
  product_category_id: CATEGORY_ID,
  name: 'Prestation de conseil',
  description: 'Accompagnement strategique',
  sku: 'CONSEIL-01',
  revenue_category: 'service',
  revenue_category_label: 'Prestation de services',
  unit: 'HUR',
  unit_price_ht: 800,
  default_tax_rate: 20,
  default_discount_rate: 5,
  currency: 'EUR',
  is_active: true,
  product_category: sampleCategory,
  metadata: { ref: 'P-001' },
  notes: 'Tarif horaire negociable',
  created_at: '2026-06-07T10:00:00Z',
  updated_at: '2026-06-07T10:00:00Z',
};

describe('ProductsResource', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('lists products with query params', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: [sampleProduct],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.products.list({
      q: 'Conseil',
      revenue_category: 'service',
      product_category_id: CATEGORY_ID,
      is_active: true,
      per_page: 25,
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Prestation de conseil');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${BASE}/products`);
    expect(url).toContain('q=Conseil');
    expect(url).toContain('revenue_category=service');
    expect(url).toContain(`product_category_id=${CATEGORY_ID}`);
    expect(url).toContain('is_active=true');
    expect(url).toContain('per_page=25');
    expect(init.method).toBe('GET');
  });

  it('gets a product by id and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleProduct }));

    const client = new ScellApiClient('sk_test_xxx');
    const product = await client.products.get(PRODUCT_ID);

    expect(product.id).toBe(PRODUCT_ID);
    expect(product.unit_price_ht).toBe(800);
    expect(product.product_category?.name).toBe('Conseil');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/products/${PRODUCT_ID}`);
    expect(init.method).toBe('GET');
  });

  it('creates a product via POST and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(201, { data: sampleProduct }));

    const client = new ScellApiClient('sk_test_xxx');
    const product = await client.products.create({
      name: 'Prestation de conseil',
      unit_price_ht: 800,
      default_tax_rate: 20,
    });

    expect(product.id).toBe(PRODUCT_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/products`);
    expect(init.method).toBe('POST');

    const sent = JSON.parse(init.body as string);
    expect(sent).toHaveProperty('name', 'Prestation de conseil');
    expect(sent).toHaveProperty('unit_price_ht', 800);
    expect(sent).toHaveProperty('default_tax_rate', 20);
  });

  it('updates a product via PATCH', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleProduct, name: 'Nouveau libelle' } })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const product = await client.products.update(PRODUCT_ID, { name: 'Nouveau libelle' });

    expect(product.name).toBe('Nouveau libelle');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/products/${PRODUCT_ID}`);
    expect(init.method).toBe('PATCH');
  });

  it('replaces a product via PUT', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleProduct, unit_price_ht: 900 } })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const product = await client.products.replace(PRODUCT_ID, {
      name: 'Prestation de conseil',
      unit_price_ht: 900,
    });

    expect(product.unit_price_ht).toBe(900);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/products/${PRODUCT_ID}`);
    expect(init.method).toBe('PUT');
  });

  it('deletes a product via DELETE', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(204, null));

    const client = new ScellApiClient('sk_test_xxx');
    await client.products.delete(PRODUCT_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/products/${PRODUCT_ID}`);
    expect(init.method).toBe('DELETE');
  });

  it('is exposed on ScellClient (Bearer) as well', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleProduct }));

    const client = new ScellClient('bearer-token');
    expect(client.products).toBeDefined();

    const product = await client.products.get(PRODUCT_ID);
    expect(product.id).toBe(PRODUCT_ID);
  });
});

describe('ProductCategoriesResource', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('lists categories with query params', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        data: [sampleCategory],
        meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.productCategories.list({ q: 'Conseil', per_page: 25 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.name).toBe('Conseil');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(`${BASE}/product-categories`);
    expect(url).toContain('q=Conseil');
    expect(url).toContain('per_page=25');
    expect(init.method).toBe('GET');
  });

  it('gets a category by id and unwraps data', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleCategory }));

    const client = new ScellApiClient('sk_test_xxx');
    const category = await client.productCategories.get(CATEGORY_ID);

    expect(category.id).toBe(CATEGORY_ID);
    expect(category.color).toBe('#0066FF');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/product-categories/${CATEGORY_ID}`);
    expect(init.method).toBe('GET');
  });

  it('creates a category via POST', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(201, { data: sampleCategory }));

    const client = new ScellApiClient('sk_test_xxx');
    const category = await client.productCategories.create({ name: 'Conseil', color: '#0066FF' });

    expect(category.id).toBe(CATEGORY_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/product-categories`);
    expect(init.method).toBe('POST');

    const sent = JSON.parse(init.body as string);
    expect(sent).toHaveProperty('name', 'Conseil');
    expect(sent).toHaveProperty('color', '#0066FF');
  });

  it('updates a category via PATCH', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleCategory, name: 'Conseil strategique' } })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const category = await client.productCategories.update(CATEGORY_ID, {
      name: 'Conseil strategique',
    });

    expect(category.name).toBe('Conseil strategique');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/product-categories/${CATEGORY_ID}`);
    expect(init.method).toBe('PATCH');
  });

  it('replaces a category via PUT', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { data: { ...sampleCategory, position: 3 } })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const category = await client.productCategories.replace(CATEGORY_ID, {
      name: 'Conseil',
      position: 3,
    });

    expect(category.position).toBe(3);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/product-categories/${CATEGORY_ID}`);
    expect(init.method).toBe('PUT');
  });

  it('deletes a category via DELETE', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(204, null));

    const client = new ScellApiClient('sk_test_xxx');
    await client.productCategories.delete(CATEGORY_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE}/product-categories/${CATEGORY_ID}`);
    expect(init.method).toBe('DELETE');
  });

  it('is exposed on ScellClient (Bearer) as well', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { data: sampleCategory }));

    const client = new ScellClient('bearer-token');
    expect(client.productCategories).toBeDefined();

    const category = await client.productCategories.get(CATEGORY_ID);
    expect(category.id).toBe(CATEGORY_ID);
  });
});

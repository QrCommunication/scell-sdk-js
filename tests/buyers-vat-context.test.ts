/**
 * BuyersResource.vatContext() Tests (v2.20.0)
 *
 * Covers:
 *  - Mode 1 (buyer_id) — FR → FR standard rate
 *  - Mode 1 (buyer_id) — FR → DE B2B reverse-charge
 *  - Mode 2 (inline buyer) — FR → US out-of-scope
 *  - Mode 2 (inline buyer) — art. 259-A CGI override via place_of_supply
 *  - Line context forwarded in payload (category, place_of_supply)
 *  - Warnings surfaced in response
 *  - InvoiceLineBuilder — basic build with computed totals
 *  - InvoiceLineBuilder — category setter updates tax_rate + metadata
 *  - InvoiceLineBuilder — placeOfSupply sets metadata.place_of_supply
 *  - InvoiceLineBuilder — taxRate() override wins over category default
 *  - InvoiceLineBuilder — build() throws when description is missing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellApiClient, ScellClient } from '../src/index.js';
import {
  createInvoiceLine,
  InvoiceLineBuilder,
  VAT_DEFAULT_RATES,
} from '../src/index.js';
import type { VatContextResponse } from '../src/index.js';

// ─── Fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'https://api.scell.io/api/v1';
const BUYER_ID = '019cb416-b6db-730c-b3a5-f8b7a4512eb1';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

// ─── Fixture responses ────────────────────────────────────────────────────────

const STANDARD_RESPONSE: VatContextResponse = {
  resolution: {
    rate: 20,
    category: 'STANDARD',
    en16931_code: 'S',
    exemption_reason: null,
    justification: null,
    is_auto_resolved: true,
    rule: 'FR_TO_FR_STANDARD',
  },
  warnings: [],
};

const REVERSE_CHARGE_RESPONSE: VatContextResponse = {
  resolution: {
    rate: 0,
    category: 'REVERSE_CHARGE',
    en16931_code: 'AE',
    exemption_reason: 'reverse_charge',
    justification:
      "Auto-liquidation intracommunautaire (art. 283-2 CGI) — TVA due par l'acheteur assujetti.",
    is_auto_resolved: true,
    rule: 'FR_TO_EU_B2B_VALID_VAT',
  },
  warnings: [],
};

const OUT_OF_SCOPE_RESPONSE: VatContextResponse = {
  resolution: {
    rate: 0,
    category: 'OUT_OF_SCOPE',
    en16931_code: 'O',
    exemption_reason: 'out_of_scope',
    justification: 'Hors champ TVA — acheteur situé hors UE.',
    is_auto_resolved: true,
    rule: 'FR_TO_NON_EU',
  },
  warnings: [],
};

const ART_259A_RESPONSE: VatContextResponse = {
  resolution: {
    rate: 20,
    category: 'STANDARD',
    en16931_code: 'S',
    exemption_reason: null,
    justification:
      'TVA française appliquée (art. 259 A CGI — lieu de taxation FR pour services numériques B2C).',
    is_auto_resolved: false,
    rule: 'ART_259A_DIGITAL_SERVICES_FR',
  },
  warnings: [
    {
      severity: 'medium',
      message: "Le lieu de taxation a été surchargé manuellement vers 'FR'.",
      rule: 'PLACE_OF_SUPPLY_OVERRIDE',
    },
  ],
};

// ─── BuyersResource.vatContext() ──────────────────────────────────────────────

describe('BuyersResource.vatContext()', () => {
  let apiClient: ScellApiClient;
  let dashClient: ScellClient;

  beforeEach(() => {
    mockFetch.mockReset();
    apiClient = new ScellApiClient('sk_test_xxx');
    dashClient = new ScellClient('bearer-token-xxx');
  });

  // ── Mode 1 — buyer_id ────────────────────────────────────────────────────

  describe('Mode 1 — buyer_id from registry', () => {
    it('FR → FR: returns STANDARD 20% for a domestic buyer', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, STANDARD_RESPONSE));

      const result = await apiClient.buyers.vatContext(BUYER_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/tenant/buyers/vat-context`);
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.buyer_id).toBe(BUYER_ID);
      expect(body.buyer).toBeUndefined();

      expect(result.resolution.rate).toBe(20);
      expect(result.resolution.category).toBe('STANDARD');
      expect(result.resolution.en16931_code).toBe('S');
      expect(result.resolution.exemption_reason).toBeNull();
      expect(result.warnings).toHaveLength(0);
    });

    it('FR → DE B2B: returns REVERSE_CHARGE 0% when buyer has valid VAT', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, REVERSE_CHARGE_RESPONSE));

      const result = await apiClient.buyers.vatContext(BUYER_ID, {
        category: 'STANDARD',
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.buyer_id).toBe(BUYER_ID);
      expect(body.line.category).toBe('STANDARD');

      expect(result.resolution.rate).toBe(0);
      expect(result.resolution.category).toBe('REVERSE_CHARGE');
      expect(result.resolution.en16931_code).toBe('AE');
      expect(result.resolution.exemption_reason).toBe('reverse_charge');
      expect(result.resolution.justification).toContain('Auto-liquidation');
      expect(result.resolution.is_auto_resolved).toBe(true);
    });

    it('also works with ScellClient (Bearer auth)', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, STANDARD_RESPONSE));

      const result = await dashClient.buyers.vatContext(BUYER_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/tenant/buyers/vat-context`);
      expect((init.headers as Record<string, string>)['Authorization']).toMatch(
        /^Bearer /
      );
      expect(result.resolution.category).toBe('STANDARD');
    });

    it('omits "line" key from payload when no line context is passed', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, STANDARD_RESPONSE));

      await apiClient.buyers.vatContext(BUYER_ID);

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.line).toBeUndefined();
    });
  });

  // ── Mode 2 — inline buyer ─────────────────────────────────────────────────

  describe('Mode 2 — inline VatBuyerContext', () => {
    it('FR → US: returns OUT_OF_SCOPE 0% for a non-EU buyer', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, OUT_OF_SCOPE_RESPONSE));

      const result = await apiClient.buyers.vatContext({
        country: 'US',
        is_individual: false,
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/tenant/buyers/vat-context`);
      const body = JSON.parse(init.body as string);
      expect(body.buyer_id).toBeUndefined();
      expect(body.buyer.country).toBe('US');
      expect(body.buyer.is_individual).toBe(false);

      expect(result.resolution.rate).toBe(0);
      expect(result.resolution.category).toBe('OUT_OF_SCOPE');
      expect(result.resolution.en16931_code).toBe('O');
      expect(result.resolution.exemption_reason).toBe('out_of_scope');
    });

    it('art. 259-A override: returns STANDARD 20% when place_of_supply=FR for digital services', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, ART_259A_RESPONSE));

      const result = await apiClient.buyers.vatContext(
        {
          country: 'DE',
          is_individual: true, // B2C
        },
        {
          category: 'STANDARD',
          place_of_supply: 'FR',
          service_nature: 'digital_service',
        }
      );

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.buyer.country).toBe('DE');
      expect(body.buyer.is_individual).toBe(true);
      expect(body.line.place_of_supply).toBe('FR');
      expect(body.line.service_nature).toBe('digital_service');

      expect(result.resolution.rate).toBe(20);
      expect(result.resolution.category).toBe('STANDARD');
      expect(result.resolution.is_auto_resolved).toBe(false);
      expect(result.resolution.justification).toContain('259 A');

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].severity).toBe('medium');
      expect(result.warnings[0].rule).toBe('PLACE_OF_SUPPLY_OVERRIDE');
    });

    it('forwards vat_number and vat_number_valid in the buyer payload', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, REVERSE_CHARGE_RESPONSE));

      await apiClient.buyers.vatContext({
        country: 'DE',
        is_individual: false,
        vat_number: 'DE123456789',
        vat_number_valid: true,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.buyer.vat_number).toBe('DE123456789');
      expect(body.buyer.vat_number_valid).toBe(true);
    });

    it('omits "line" key from payload when no line context is passed', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, OUT_OF_SCOPE_RESPONSE));

      await apiClient.buyers.vatContext({ country: 'US', is_individual: false });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.line).toBeUndefined();
    });
  });
});

// ─── InvoiceLineBuilder ───────────────────────────────────────────────────────

describe('InvoiceLineBuilder', () => {
  describe('createInvoiceLine() factory', () => {
    it('returns an InvoiceLineBuilder instance', () => {
      expect(createInvoiceLine()).toBeInstanceOf(InvoiceLineBuilder);
    });

    it('accepts an initial category', () => {
      const line = createInvoiceLine({ category: 'REDUCED' })
        .description('Livres')
        .unitPrice(50)
        .build();
      expect(line.tax_rate).toBe(5.5);
    });
  });

  describe('build() — computed totals', () => {
    it('computes totals correctly for a standard 20% line', () => {
      const line = createInvoiceLine({ category: 'STANDARD' })
        .description('Consulting')
        .unitPrice(1000)
        .quantity(1)
        .build();

      expect(line.description).toBe('Consulting');
      expect(line.unit_price).toBe(1000);
      expect(line.quantity).toBe(1);
      expect(line.tax_rate).toBe(20);
      expect(line.total_ht).toBe(1000);
      expect(line.total_tax).toBe(200);
      expect(line.total_ttc).toBe(1200);
    });

    it('computes totals for quantity > 1', () => {
      const line = createInvoiceLine({ category: 'STANDARD' })
        .description('Service')
        .unitPrice(500)
        .quantity(2)
        .build();

      expect(line.total_ht).toBe(1000);
      expect(line.total_tax).toBe(200);
      expect(line.total_ttc).toBe(1200);
    });

    it('computes totals for a zero-rate line (REVERSE_CHARGE)', () => {
      const line = createInvoiceLine({ category: 'REVERSE_CHARGE' })
        .description('Conseil')
        .unitPrice(1000)
        .build();

      expect(line.tax_rate).toBe(0);
      expect(line.total_ht).toBe(1000);
      expect(line.total_tax).toBe(0);
      expect(line.total_ttc).toBe(1000);
    });

    it('rounds totals to 2 decimal places', () => {
      const line = createInvoiceLine({ category: 'REDUCED' })
        .description('Produit')
        .unitPrice(99.99)
        .quantity(3)
        .build();

      // 299.97 HT * 5.5% = 16.4983... → 16.50
      expect(line.total_ht).toBe(299.97);
      expect(line.total_tax).toBe(16.5);
      expect(line.total_ttc).toBe(316.47);
    });
  });

  describe('category() setter', () => {
    it('sets tax_rate from VAT_DEFAULT_RATES', () => {
      const categories: Array<[import('../src/index.js').VatCategory, number]> = [
        ['STANDARD', 20],
        ['INTERMEDIATE', 10],
        ['REDUCED', 5.5],
        ['SUPER_REDUCED', 2.1],
        ['ZERO_RATED', 0],
        ['EXEMPT', 0],
        ['REVERSE_CHARGE', 0],
        ['OUT_OF_SCOPE', 0],
      ];

      for (const [cat, expected] of categories) {
        const line = createInvoiceLine()
          .description('Test')
          .unitPrice(100)
          .category(cat)
          .build();
        expect(line.tax_rate).toBe(expected);
      }
    });

    // Depuis v2.33.0 : les champs de pilotage TVA sont TOP-LEVEL (lus par la
    // résolution autoritaire serveur), plus dans metadata.* — c'est ce qui fait
    // enfin émettre le code AE/K + la mention.
    it('sets top-level vat_category', () => {
      const line = createInvoiceLine({ category: 'REVERSE_CHARGE' })
        .description('Test')
        .unitPrice(100)
        .build();

      expect(line.vat_category).toBe('REVERSE_CHARGE');
      expect(line.metadata).toBeUndefined();
    });

    it('does NOT emit exemption_reason (server computes it)', () => {
      const line = createInvoiceLine({ category: 'REVERSE_CHARGE' })
        .description('Test')
        .unitPrice(100)
        .build();

      expect(line.vat_category).toBe('REVERSE_CHARGE');
      expect(line.metadata).toBeUndefined();
    });

    it('supports the new goods/franchise/export categories', () => {
      const goods = createInvoiceLine({ category: 'INTRACOM_GOODS' })
        .description('Matériel')
        .unitPrice(100)
        .supplyType('goods')
        .build();
      expect(goods.vat_category).toBe('INTRACOM_GOODS');
      expect(goods.supply_type).toBe('goods');
      expect(goods.tax_rate).toBe(0);

      const fr = createInvoiceLine({ category: 'FRANCHISE_BASE' })
        .description('Prestation AE')
        .unitPrice(100)
        .build();
      expect(fr.vat_category).toBe('FRANCHISE_BASE');
      expect(fr.tax_rate).toBe(0);
    });
  });

  describe('placeOfSupply() / overrideReason() setters', () => {
    it('sets top-level place_of_supply (uppercased)', () => {
      const line = createInvoiceLine({ category: 'STANDARD' })
        .description('Service numérique')
        .unitPrice(200)
        .placeOfSupply('fr')
        .build();

      expect(line.place_of_supply).toBe('FR');
      expect(line.metadata).toBeUndefined();
    });

    it('combines place_of_supply with vat_category top-level', () => {
      const line = createInvoiceLine({ category: 'REVERSE_CHARGE' })
        .description('Conseil EU')
        .unitPrice(500)
        .supplyType('services')
        .placeOfSupply('DE')
        .build();

      expect(line.vat_category).toBe('REVERSE_CHARGE');
      expect(line.supply_type).toBe('services');
      expect(line.place_of_supply).toBe('DE');
    });

    it('overrideReason() sets top-level vat_override_reason', () => {
      const line = createInvoiceLine()
        .description('Prestation')
        .unitPrice(1000)
        .taxRate(20)
        .overrideReason('Numéro TVA acheteur invalide à la date d\'émission')
        .build();

      expect(line.tax_rate).toBe(20);
      expect(line.vat_override_reason).toBe(
        'Numéro TVA acheteur invalide à la date d\'émission'
      );
    });
  });

  describe('taxRate() override', () => {
    it('overrides the category default rate', () => {
      const line = createInvoiceLine({ category: 'STANDARD' })
        .description('Service')
        .unitPrice(100)
        .taxRate(10) // override from 20 → 10
        .build();

      expect(line.tax_rate).toBe(10);
      expect(line.total_tax).toBe(10);
      expect(line.total_ttc).toBe(110);
    });
  });

  describe('meta() helper', () => {
    it('merges arbitrary fields into metadata', () => {
      const line = createInvoiceLine({ category: 'STANDARD' })
        .description('Service')
        .unitPrice(100)
        .meta({ purchase_order: 'PO-2026-001', cost_centre: 'IT' })
        .build();

      expect(line.metadata?.purchase_order).toBe('PO-2026-001');
      expect(line.metadata?.cost_centre).toBe('IT');
    });
  });

  describe('no metadata when no category/placeOfSupply', () => {
    it('omits metadata key entirely when built without category or placeOfSupply', () => {
      const line = createInvoiceLine()
        .description('Service')
        .unitPrice(100)
        .build();

      // Default tax_rate comes from STANDARD
      expect(line.tax_rate).toBe(VAT_DEFAULT_RATES['STANDARD']);
      expect(line.metadata).toBeUndefined();
    });
  });

  describe('build() validations', () => {
    it('throws when description is empty', () => {
      expect(() => createInvoiceLine().unitPrice(100).build()).toThrow(
        'description() is required'
      );
    });
  });
});

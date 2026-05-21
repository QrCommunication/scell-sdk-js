/**
 * BrandingResource Tests (v2.13.0)
 *
 * Covers:
 *  - branding.tenant.get()
 *  - branding.tenant.update()
 *  - branding.tenant.uploadLogo()
 *  - branding.subTenants.get()
 *  - branding.subTenants.update()
 *  - branding.subTenants.uploadLogo()
 *
 * Also covers:
 *  - BuyerHasNoEmailError mapping (via invoices.sendByEmail())
 *  - InvoiceBrandingIncompleteError mapping (via invoices.sendByEmail())
 *  - invoices.sendByEmail() method
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScellApiClient,
  BuyerHasNoEmailError,
  InvoiceBrandingIncompleteError,
} from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const BASE_URL = 'https://api.scell.io/api/v1';
const SUB_TENANT_ID = '00000000-0000-0000-0000-00000000dddd';
const INVOICE_ID = '00000000-0000-0000-0000-00000000eeee';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const SAMPLE_BRANDING = {
  scope: 'tenant' as const,
  brand_logo_url: 'https://cdn.example.com/logo.png',
  brand_primary_color: '#1A73E8',
  brand_email_footer: 'Société XYZ — SIRET 123 456 789 00012',
  brand_email_signature: "L'équipe Société XYZ",
  is_complete: true,
  missing_fields: [],
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-21T00:00:00Z',
};

const INCOMPLETE_BRANDING = {
  ...SAMPLE_BRANDING,
  brand_logo_url: null,
  is_complete: false,
  missing_fields: ['brand_logo_url', 'brand_email_footer'],
};

describe('BrandingResource — tenant scope', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  describe('tenant.get()', () => {
    it('fetches tenant branding via GET /tenant/branding', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_BRANDING));

      const branding = await client.branding.tenant.get();

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/tenant/branding`);
      expect(init.method).toBe('GET');
      expect(branding.scope).toBe('tenant');
      expect(branding.is_complete).toBe(true);
      expect(branding.brand_primary_color).toBe('#1A73E8');
    });

    it('exposes missing_fields when branding is incomplete', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, INCOMPLETE_BRANDING));

      const branding = await client.branding.tenant.get();

      expect(branding.is_complete).toBe(false);
      expect(branding.missing_fields).toContain('brand_logo_url');
      expect(branding.missing_fields).toContain('brand_email_footer');
    });
  });

  describe('tenant.update()', () => {
    it('updates tenant branding via PATCH /tenant/branding', async () => {
      const updatedBranding = {
        ...SAMPLE_BRANDING,
        brand_primary_color: '#0D47A1',
        brand_email_footer: 'Nouvelle mention légale...',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, updatedBranding));

      const result = await client.branding.tenant.update({
        brand_primary_color: '#0D47A1',
        brand_email_footer: 'Nouvelle mention légale...',
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/tenant/branding`);
      expect(init.method).toBe('PATCH');

      const body = JSON.parse(init.body as string);
      expect(body.brand_primary_color).toBe('#0D47A1');
      expect(body.brand_email_footer).toBe('Nouvelle mention légale...');
      expect(result.brand_primary_color).toBe('#0D47A1');
    });

    it('allows clearing a field by sending null', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { ...SAMPLE_BRANDING, brand_email_signature: null })
      );

      await client.branding.tenant.update({ brand_email_signature: null });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.brand_email_signature).toBeNull();
    });
  });

  describe('tenant.uploadLogo()', () => {
    it('requests a pre-signed upload URL via POST /tenant/branding/logo-upload-url', async () => {
      const mockResponse = {
        upload_url: 'https://s3.example.com/upload?signed=abc123',
        public_url: 'https://cdn.example.com/logos/tenant-uuid-logo.png',
        expires_at: '2026-05-21T01:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, mockResponse));

      const result = await client.branding.tenant.uploadLogo('image/png');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/tenant/branding/logo-upload-url`);
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.mime_type).toBe('image/png');
      expect(result.upload_url).toContain('s3.example.com');
      expect(result.public_url).toContain('cdn.example.com');
    });

    it('works with SVG mime type', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, {
          upload_url: 'https://s3.example.com/upload?signed=def456',
          public_url: 'https://cdn.example.com/logos/logo.svg',
          expires_at: '2026-05-21T01:00:00Z',
        })
      );

      await client.branding.tenant.uploadLogo('image/svg+xml');

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.mime_type).toBe('image/svg+xml');
    });
  });
});

describe('BrandingResource — subTenants scope', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  describe('subTenants.get()', () => {
    it('fetches sub-tenant branding via GET /sub-tenants/{id}/branding', async () => {
      const subTenantBranding = { ...SAMPLE_BRANDING, scope: 'sub_tenant' as const };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, subTenantBranding));

      const branding = await client.branding.subTenants.get(SUB_TENANT_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/sub-tenants/${SUB_TENANT_ID}/branding`);
      expect(init.method).toBe('GET');
      expect(branding.scope).toBe('sub_tenant');
    });
  });

  describe('subTenants.update()', () => {
    it('updates sub-tenant branding via PATCH /sub-tenants/{id}/branding', async () => {
      const updatedBranding = {
        ...SAMPLE_BRANDING,
        scope: 'sub_tenant' as const,
        brand_primary_color: '#2E7D32',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, updatedBranding));

      const result = await client.branding.subTenants.update(SUB_TENANT_ID, {
        brand_primary_color: '#2E7D32',
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/sub-tenants/${SUB_TENANT_ID}/branding`);
      expect(init.method).toBe('PATCH');

      const body = JSON.parse(init.body as string);
      expect(body.brand_primary_color).toBe('#2E7D32');
      expect(result.brand_primary_color).toBe('#2E7D32');
    });
  });

  describe('subTenants.uploadLogo()', () => {
    it('requests upload URL via POST /sub-tenants/{id}/branding/logo-upload-url', async () => {
      const mockResponse = {
        upload_url: 'https://s3.example.com/upload?signed=xyz789',
        public_url: 'https://cdn.example.com/logos/sub-tenant-logo.png',
        expires_at: '2026-05-21T01:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, mockResponse));

      const result = await client.branding.subTenants.uploadLogo(SUB_TENANT_ID, 'image/png');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        `${BASE_URL}/sub-tenants/${SUB_TENANT_ID}/branding/logo-upload-url`
      );
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.mime_type).toBe('image/png');
      expect(result.public_url).toContain('cdn.example.com');
    });
  });
});

// ──────────────────────────────────────────────
// Invoice sendByEmail + email-related errors
// ──────────────────────────────────────────────

describe('InvoicesResource.sendByEmail()', () => {
  let client: ScellApiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ScellApiClient('sk_test_xxx');
  });

  it('sends invoice by email via POST /invoices/{id}/send-by-email', async () => {
    const mockResponse = {
      sent_to: 'client@example.com',
      sent_at: '2026-05-21T10:00:00Z',
      message_id: 'msg-abc123',
      cc: ['copy@example.com'],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(200, mockResponse));

    const result = await client.invoices.sendByEmail(INVOICE_ID, {
      recipient_email: 'client@example.com',
      cc: ['copy@example.com'],
      message: 'Veuillez trouver ci-joint votre facture.',
    });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/invoices/${INVOICE_ID}/send-by-email`);
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.recipient_email).toBe('client@example.com');
    expect(body.cc).toEqual(['copy@example.com']);
    expect(body.message).toBe('Veuillez trouver ci-joint votre facture.');
    expect(result.sent_to).toBe('client@example.com');
    expect(result.message_id).toBe('msg-abc123');
  });

  it('works without options (uses buyer email from registry)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        sent_to: 'buyer@example.com',
        sent_at: '2026-05-21T10:00:00Z',
        message_id: 'msg-def456',
        cc: [],
      })
    );

    const result = await client.invoices.sendByEmail(INVOICE_ID);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/invoices/${INVOICE_ID}/send-by-email`);
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(Object.keys(body)).toHaveLength(0);
    expect(result.sent_to).toBe('buyer@example.com');
  });

  it('throws BuyerHasNoEmailError on 422 BUYER_HAS_NO_EMAIL', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'No email address could be resolved for this buyer.',
        code: 'BUYER_HAS_NO_EMAIL',
      })
    );

    await expect(client.invoices.sendByEmail(INVOICE_ID)).rejects.toThrow(
      BuyerHasNoEmailError
    );

    try {
      await client.invoices.sendByEmail(INVOICE_ID);
    } catch {
      // Expected — already tested above
    }

    // Verify error class properties
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'No email.',
        code: 'BUYER_HAS_NO_EMAIL',
      })
    );
    try {
      await client.invoices.sendByEmail(INVOICE_ID);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(BuyerHasNoEmailError);
      expect((e as BuyerHasNoEmailError).status).toBe(422);
      expect((e as BuyerHasNoEmailError).code).toBe('BUYER_HAS_NO_EMAIL');
      expect((e as BuyerHasNoEmailError).name).toBe('BuyerHasNoEmailError');
    }
  });

  it('throws InvoiceBrandingIncompleteError on 422 INVOICE_BRANDING_INCOMPLETE', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'Branding profile is incomplete. Missing: brand_logo_url.',
        code: 'INVOICE_BRANDING_INCOMPLETE',
      })
    );

    try {
      await client.invoices.sendByEmail(INVOICE_ID);
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(InvoiceBrandingIncompleteError);
      expect((e as InvoiceBrandingIncompleteError).status).toBe(422);
      expect((e as InvoiceBrandingIncompleteError).code).toBe('INVOICE_BRANDING_INCOMPLETE');
      expect((e as InvoiceBrandingIncompleteError).name).toBe('InvoiceBrandingIncompleteError');
    }
  });
});

/**
 * BrandingResource Tests (v2.13.0)
 *
 * Covers:
 *  - branding.tenant.get()
 *  - branding.tenant.update()
 *  - branding.tenant.uploadLogo()
 *  - branding.tenant.preview()
 *  - branding.subTenants.get()
 *  - branding.subTenants.update()
 *  - branding.subTenants.uploadLogo()
 *  - branding.subTenants.preview()
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

function htmlResponse(status: number, html: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'text/html; charset=UTF-8' }),
    text: () => Promise.resolve(html),
  };
}

const SAMPLE_BRANDING = {
  scope: 'tenant' as const,
  brand_logo_url: 'https://cdn.example.com/logo.png',
  brand_primary_color: '#1A73E8',
  brand_email_footer: 'Société XYZ — SIRET 123 456 789 00012',
  brand_email_signature: "L'équipe Société XYZ",
  brand_email_enabled: true,
  computed_email_footer: 'Société XYZ — 12 rue de la République, 75001 Paris — SIRET 123 456 789 00012',
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
    it('fetches tenant branding via GET /branding/tenant', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_BRANDING));

      const branding = await client.branding.tenant.get();

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/tenant`);
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
    it('updates tenant branding via PATCH /branding/tenant', async () => {
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
      expect(url).toBe(`${BASE_URL}/branding/tenant`);
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

    it('toggles brand_email_enabled (v3.2.0)', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, { ...SAMPLE_BRANDING, brand_email_enabled: false })
      );

      const result = await client.branding.tenant.update({
        brand_email_enabled: false,
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(init.body as string);
      expect(body.brand_email_enabled).toBe(false);
      expect(result.brand_email_enabled).toBe(false);
    });
  });

  describe('tenant.uploadLogo()', () => {
    it('requests a pre-signed upload URL via POST /branding/tenant/logo-upload-url', async () => {
      const mockResponse = {
        url: 'https://s3.example.com/upload?signed=abc123',
        public_url: 'https://cdn.example.com/logos/tenant-uuid-logo.png',
        expires_at: '2026-05-21T01:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, mockResponse));

      const result = await client.branding.tenant.uploadLogo('image/png');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/tenant/logo-upload-url`);
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.mime_type).toBe('image/png');
      expect(result.url).toContain('s3.example.com');
      expect(result.public_url).toContain('cdn.example.com');
    });

    it('works with SVG mime type', async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse(200, {
          url: 'https://s3.example.com/upload?signed=def456',
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

  describe('tenant.preview()', () => {
    it('fetches the rendered email preview via GET /branding/tenant/preview', async () => {
      const html = '<html><body>Branded preview</body></html>';
      mockFetch.mockResolvedValueOnce(htmlResponse(200, html));

      const result = await client.branding.tenant.preview();

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/tenant/preview`);
      expect(init.method).toBe('GET');
      // getText defaults Accept to text/html when caller doesn't override it
      expect((init.headers as Record<string, string>)['Accept']).toBe('text/html');
      expect(result).toBe(html);
    });

    it('honors a custom Accept header (e.g. application/pdf)', async () => {
      mockFetch.mockResolvedValueOnce(htmlResponse(200, '%PDF-1.4'));

      await client.branding.tenant.preview(undefined, {
        headers: { Accept: 'application/pdf' },
      });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Accept']).toBe('application/pdf');
    });

    it('serializes non-persisted overrides as query string (v3.2.0)', async () => {
      mockFetch.mockResolvedValueOnce(htmlResponse(200, '<html>draft</html>'));

      await client.branding.tenant.preview({
        brand_primary_color: '#FF5722',
        brand_email_signature: "L'équipe Nouvelle Marque",
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      const parsed = new URL(url);
      expect(parsed.pathname).toBe('/api/v1/branding/tenant/preview');
      expect(parsed.searchParams.get('brand_primary_color')).toBe('#FF5722');
      expect(parsed.searchParams.get('brand_email_signature')).toBe(
        "L'équipe Nouvelle Marque"
      );
      // Undefined keys must NOT be serialized
      expect(parsed.searchParams.has('brand_email_footer')).toBe(false);
      expect(parsed.searchParams.has('brand_logo_url')).toBe(false);
    });

    it('omits the query string entirely when no overrides are given', async () => {
      mockFetch.mockResolvedValueOnce(htmlResponse(200, '<html></html>'));

      await client.branding.tenant.preview();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/tenant/preview`);
    });
  });

  describe('tenant.uploadLogoFile() (v3.2.0)', () => {
    it('uploads the logo directly via POST /branding/tenant/logo (multipart, flat response)', async () => {
      const uploadedBranding = {
        ...SAMPLE_BRANDING,
        brand_logo_url: 'https://cdn.example.com/logos/direct-upload.png',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, uploadedBranding));

      const blob = new Blob(['fake-png-bytes'], { type: 'image/png' });
      const result = await client.branding.tenant.uploadLogoFile(blob, 'logo.png');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/tenant/logo`);
      expect(init.method).toBe('POST');

      // Body must be FormData with the file under the `logo` field
      expect(init.body).toBeInstanceOf(FormData);
      const formData = init.body as FormData;
      expect(formData.get('logo')).toBeInstanceOf(Blob);

      // Content-Type must NOT be forced (fetch sets the multipart boundary)
      const headers = init.headers as Record<string, string>;
      expect(headers['Content-Type']).toBeUndefined();
      expect(headers['X-API-Key']).toBe('sk_test_xxx');

      // Response is the FLAT branding object (no { data } unwrap)
      expect(result.brand_logo_url).toBe(
        'https://cdn.example.com/logos/direct-upload.png'
      );
      expect(result.is_complete).toBe(true);
    });

    it('accepts a Uint8Array (Node.js)', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_BRANDING));

      await client.branding.tenant.uploadLogoFile(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
        'logo.png'
      );

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const formData = init.body as FormData;
      expect(formData.get('logo')).toBeInstanceOf(Blob);
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
    it('fetches sub-tenant branding via GET /branding/sub-tenants/{id}', async () => {
      const subTenantBranding = { ...SAMPLE_BRANDING, scope: 'sub_tenant' as const };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, subTenantBranding));

      const branding = await client.branding.subTenants.get(SUB_TENANT_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/sub-tenants/${SUB_TENANT_ID}`);
      expect(init.method).toBe('GET');
      expect(branding.scope).toBe('sub_tenant');
    });
  });

  describe('subTenants.update()', () => {
    it('updates sub-tenant branding via PATCH /branding/sub-tenants/{id}', async () => {
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
      expect(url).toBe(`${BASE_URL}/branding/sub-tenants/${SUB_TENANT_ID}`);
      expect(init.method).toBe('PATCH');

      const body = JSON.parse(init.body as string);
      expect(body.brand_primary_color).toBe('#2E7D32');
      expect(result.brand_primary_color).toBe('#2E7D32');
    });
  });

  describe('subTenants.uploadLogo()', () => {
    it('requests upload URL via POST /branding/sub-tenants/{id}/logo-upload-url', async () => {
      const mockResponse = {
        url: 'https://s3.example.com/upload?signed=xyz789',
        public_url: 'https://cdn.example.com/logos/sub-tenant-logo.png',
        expires_at: '2026-05-21T01:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, mockResponse));

      const result = await client.branding.subTenants.uploadLogo(SUB_TENANT_ID, 'image/png');

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(
        `${BASE_URL}/branding/sub-tenants/${SUB_TENANT_ID}/logo-upload-url`
      );
      expect(init.method).toBe('POST');

      const body = JSON.parse(init.body as string);
      expect(body.mime_type).toBe('image/png');
      expect(result.url).toContain('s3.example.com');
      expect(result.public_url).toContain('cdn.example.com');
    });
  });

  describe('subTenants.preview()', () => {
    it('fetches the rendered preview via GET /branding/sub-tenants/{id}/preview', async () => {
      const html = '<html><body>Sub-tenant preview</body></html>';
      mockFetch.mockResolvedValueOnce(htmlResponse(200, html));

      const result = await client.branding.subTenants.preview(SUB_TENANT_ID);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/sub-tenants/${SUB_TENANT_ID}/preview`);
      expect(init.method).toBe('GET');
      expect(result).toBe(html);
    });

    it('serializes non-persisted overrides as query string (v3.2.0)', async () => {
      mockFetch.mockResolvedValueOnce(htmlResponse(200, '<html>draft</html>'));

      await client.branding.subTenants.preview(SUB_TENANT_ID, {
        brand_primary_color: '#2E7D32',
        brand_logo_url: 'https://cdn.example.com/draft-logo.png',
      });

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      const parsed = new URL(url);
      expect(parsed.pathname).toBe(
        `/api/v1/branding/sub-tenants/${SUB_TENANT_ID}/preview`
      );
      expect(parsed.searchParams.get('brand_primary_color')).toBe('#2E7D32');
      expect(parsed.searchParams.get('brand_logo_url')).toBe(
        'https://cdn.example.com/draft-logo.png'
      );
      expect(parsed.searchParams.has('brand_email_footer')).toBe(false);
    });
  });

  describe('subTenants.uploadLogoFile() (v3.2.0)', () => {
    it('uploads via POST /branding/sub-tenants/{id}/logo and returns the flat branding object', async () => {
      const uploadedBranding = {
        ...SAMPLE_BRANDING,
        scope: 'sub_tenant' as const,
        brand_logo_url: 'https://cdn.example.com/logos/sub-direct.png',
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(200, uploadedBranding));

      const blob = new Blob(['fake-png-bytes'], { type: 'image/png' });
      const result = await client.branding.subTenants.uploadLogoFile(
        SUB_TENANT_ID,
        blob,
        'logo.png'
      );

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE_URL}/branding/sub-tenants/${SUB_TENANT_ID}/logo`);
      expect(init.method).toBe('POST');
      expect(init.body).toBeInstanceOf(FormData);
      expect((init.body as FormData).get('logo')).toBeInstanceOf(Blob);

      expect(result.scope).toBe('sub_tenant');
      expect(result.brand_logo_url).toBe(
        'https://cdn.example.com/logos/sub-direct.png'
      );
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

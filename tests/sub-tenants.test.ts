/**
 * Sub-Tenants Resource Tests (v2.9.0 surface)
 *
 * Covers :
 *  - SubTenantsResource.delete() with `cascade` option
 *  - SubTenantsResource.superpdpAuthorize()
 *  - Error mapping for 422 codes : MISSING_ACCESS_TOKEN,
 *    SUB_TENANT_HAS_COMPANIES, SUB_TENANT_HAS_FISCAL_ENTRIES
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScellApiClient,
  SubTenantMissingAccessTokenError,
  DeleteSubTenantHasCompaniesError,
  DeleteSubTenantFiscalLockedError,
} from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const SUB_TENANT_ID = '00000000-0000-0000-0000-000000000abc';

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

describe('SubTenantsResource.delete', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('deletes without cascade by default and returns DeleteSubTenantResponse', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { message: 'Sub-tenant deleted.', companies_deleted: 0 })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.subTenants.delete(SUB_TENANT_ID);

    expect(result.message).toBe('Sub-tenant deleted.');
    expect(result.companies_deleted).toBe(0);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.scell.io/api/v1/tenant/sub-tenants/${SUB_TENANT_ID}`);
    expect(init.method).toBe('DELETE');
  });

  it('appends ?cascade=true when option is set', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { message: 'Sub-tenant + companies deleted.', companies_deleted: 3 })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.subTenants.delete(SUB_TENANT_ID, { cascade: true });

    expect(result.companies_deleted).toBe(3);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toBe(
      `https://api.scell.io/api/v1/tenant/sub-tenants/${SUB_TENANT_ID}?cascade=true`
    );
  });

  it('throws DeleteSubTenantHasCompaniesError on 422 SUB_TENANT_HAS_COMPANIES', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'Sub-tenant has companies.',
        code: 'SUB_TENANT_HAS_COMPANIES',
        companies_count: 2,
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    await expect(client.subTenants.delete(SUB_TENANT_ID)).rejects.toMatchObject({
      name: 'DeleteSubTenantHasCompaniesError',
      companiesCount: 2,
      code: 'SUB_TENANT_HAS_COMPANIES',
    });
  });

  it('exposes companiesCount on the thrown error instance', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'Sub-tenant has companies.',
        code: 'SUB_TENANT_HAS_COMPANIES',
        companies_count: 5,
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    try {
      await client.subTenants.delete(SUB_TENANT_ID);
      throw new Error('Should have thrown.');
    } catch (e) {
      expect(e).toBeInstanceOf(DeleteSubTenantHasCompaniesError);
      if (e instanceof DeleteSubTenantHasCompaniesError) {
        expect(e.companiesCount).toBe(5);
      }
    }
  });

  it('throws DeleteSubTenantFiscalLockedError on 422 SUB_TENANT_HAS_FISCAL_ENTRIES', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        message: 'Sub-tenant has fiscal entries (ISCA compliance).',
        code: 'SUB_TENANT_HAS_FISCAL_ENTRIES',
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    await expect(
      client.subTenants.delete(SUB_TENANT_ID, { cascade: true })
    ).rejects.toBeInstanceOf(DeleteSubTenantFiscalLockedError);
  });
});

describe('SubTenantsResource.superpdpAuthorize', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns { authorize_url, state }', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        authorize_url: 'https://oauth.superpdp.tech/authorize?client_id=xyz&state=abc123',
        state: 'abc123',
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    const result = await client.subTenants.superpdpAuthorize(SUB_TENANT_ID);

    expect(result.authorize_url).toContain('oauth.superpdp.tech');
    expect(result.state).toBe('abc123');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      `https://api.scell.io/api/v1/tenant/sub-tenants/${SUB_TENANT_ID}/superpdp-authorize`
    );
    expect(init.method).toBe('POST');
  });
});

describe('SubTenantsResource.refreshSuperPDPStatus error mapping', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('throws SubTenantMissingAccessTokenError on 422 MISSING_ACCESS_TOKEN', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(422, {
        error: 'Aucun access_token SuperPDP disponible pour ce sub-tenant.',
        message: 'Aucune connexion SuperPDP active...',
        code: 'MISSING_ACCESS_TOKEN',
        authorize_url: 'https://oauth.superpdp.tech/authorize?client_id=xyz&state=xyz',
        state: 'xyz',
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    try {
      await client.subTenants.refreshSuperPDPStatus(SUB_TENANT_ID);
      throw new Error('Should have thrown.');
    } catch (e) {
      expect(e).toBeInstanceOf(SubTenantMissingAccessTokenError);
      if (e instanceof SubTenantMissingAccessTokenError) {
        expect(e.authorizeUrl).toContain('oauth.superpdp.tech');
        expect(e.state).toBe('xyz');
        expect(e.code).toBe('MISSING_ACCESS_TOKEN');
      }
    }
  });
});

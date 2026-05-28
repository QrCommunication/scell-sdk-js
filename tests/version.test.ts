/**
 * client.version() helper Tests (v2.24.0)
 *
 * Covers the new top-level helper that calls `GET /api/v1/version`
 * (public endpoint, no auth) and returns the deployed API version,
 * commit SHA, environment, and runtime info.
 *
 * Wired on both `ScellClient` (Bearer) and `ScellApiClient` (X-API-Key).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellClient, ScellApiClient } from '../src/index.js';
import type { ApiVersionInfo } from '../src/index.js';

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

const SAMPLE_VERSION: ApiVersionInfo = {
  version: '1.0.0',
  commit_sha: '5c319847abc123def456789abcdef0123456789a',
  commit_short: '5c31984',
  committed_at: '2026-05-28T10:00:00Z',
  environment: 'production',
  php_version: '8.4.3',
  laravel_version: '13.0.0',
  resolved_at: '2026-05-28T12:00:00Z',
};

describe('client.version() helper', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('is exposed on ScellClient (Bearer)', () => {
    const client = new ScellClient('test-token');
    expect(typeof client.version).toBe('function');
  });

  it('is exposed on ScellApiClient (X-API-Key)', () => {
    const client = new ScellApiClient('sk_test_xxx');
    expect(typeof client.version).toBe('function');
  });

  it('calls GET /version and returns the manifest (ScellApiClient)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_VERSION));

    const client = new ScellApiClient('sk_test_xxx');
    const version = await client.version();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/version`);
    expect(init.method).toBe('GET');
    expect(version.version).toBe('1.0.0');
    expect(version.commit_short).toBe('5c31984');
    expect(version.environment).toBe('production');
    expect(version.php_version).toBe('8.4.3');
    expect(version.laravel_version).toBe('13.0.0');
  });

  it('calls GET /version (ScellClient — Bearer)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, SAMPLE_VERSION));

    const client = new ScellClient('test-token');
    const version = await client.version();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${BASE_URL}/version`);
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer test-token',
    );
    expect(version.version).toBe('1.0.0');
  });

  it('tolerates a null commit_sha (e.g. shallow clone or missing .git)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        ...SAMPLE_VERSION,
        commit_sha: null,
        commit_short: null,
        committed_at: null,
      }),
    );

    const client = new ScellApiClient('sk_test_xxx');
    const version = await client.version();
    expect(version.commit_sha).toBeNull();
    expect(version.commit_short).toBeNull();
    expect(version.version).toBe('1.0.0');
  });
});

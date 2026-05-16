/**
 * Signature Blocks Tests (v2.11.0)
 *
 * Covers:
 *  - Type-check: InitialsBlock, Mention, DateBlock are optional on CreateSignatureInput
 *  - Serialization: snake_case field names are preserved in the JSON payload
 *  - Optional fields: all new fields can be omitted (backward compat)
 *  - Full example: all three blocks together in a single create() call
 *  - Resource pass-through: SignaturesResource.create() forwards the blocks as-is
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScellApiClient } from '../src/index.js';
import type {
  CreateSignatureInput,
  DateBlock,
  InitialsBlock,
  Mention,
} from '../src/index.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'Content-Type': 'application/json' }),
    json: () => Promise.resolve(body),
  };
}

const SIGNATURE_ID = '00000000-0000-0000-0000-111111111111';

const BASE_PAYLOAD: CreateSignatureInput = {
  title: 'Test Contract',
  document: btoa('fake-pdf-content'),
  document_name: 'contract.pdf',
  signers: [
    {
      first_name: 'Alice',
      last_name: 'Durand',
      email: 'alice@example.com',
      auth_method: 'email',
    },
  ],
};

// ---------------------------------------------------------------------------
// Type-level assertions (compile-time, executed at runtime to confirm compat)
// ---------------------------------------------------------------------------

describe('CreateSignatureInput — backward compatibility', () => {
  it('accepts a payload without any of the three new blocks (legacy compat)', () => {
    // If this compiles and runs, the new fields are truly optional
    const input: CreateSignatureInput = { ...BASE_PAYLOAD };
    expect(input.initials_block).toBeUndefined();
    expect(input.mentions).toBeUndefined();
    expect(input.date_block).toBeUndefined();
  });

  it('accepts InitialsBlock with mode auto and signer_name source', () => {
    const block: InitialsBlock = {
      enabled: true,
      mode: 'auto',
      source: 'signer_name',
      pages: 'except_last',
      position: { x: 5, y: 90, unit: 'percent' },
      font_size: 10,
      color: '#1a1a1a',
    };
    const input: CreateSignatureInput = { ...BASE_PAYLOAD, initials_block: block };
    expect(input.initials_block?.mode).toBe('auto');
    expect(input.initials_block?.source).toBe('signer_name');
    expect(input.initials_block?.pages).toBe('except_last');
  });

  it('accepts InitialsBlock with custom_text and explicit page list', () => {
    const block: InitialsBlock = {
      mode: 'custom',
      custom_text: 'AD',
      pages: [1, 2, 3],
      color: '#0055aa',
    };
    const input: CreateSignatureInput = { ...BASE_PAYLOAD, initials_block: block };
    expect(input.initials_block?.custom_text).toBe('AD');
    expect(Array.isArray(input.initials_block?.pages)).toBe(true);
    expect((input.initials_block?.pages as number[])[0]).toBe(1);
  });

  it('accepts a Mention array with required and signer_index', () => {
    const mentions: Mention[] = [
      {
        label: "J'accepte les conditions generales d'utilisation",
        required: true,
        signer_index: 0,
        position: { page: 2, x: 10, y: 80, unit: 'percent' },
        font_size: 9,
        color: '#333333',
      },
      {
        label: "Je certifie avoir lu l'ensemble du document",
        required: false,
        position: { page: 1, x: 5, y: 75, w: 90, h: 5 },
        fallback_text: 'Lu et approuve',
      },
    ];
    const input: CreateSignatureInput = { ...BASE_PAYLOAD, mentions };
    expect(input.mentions).toHaveLength(2);
    expect(input.mentions?.[0].required).toBe(true);
    expect(input.mentions?.[1].fallback_text).toBe('Lu et approuve');
  });

  it('accepts DateBlock with page "last" and IANA timezone', () => {
    const block: DateBlock = {
      enabled: true,
      format: 'dd/MM/yyyy',
      timezone: 'Europe/Paris',
      position: { page: 'last', x: 70, y: 88, unit: 'percent' },
      font_size: 9,
      color: '#555555',
    };
    const input: CreateSignatureInput = { ...BASE_PAYLOAD, date_block: block };
    expect(input.date_block?.timezone).toBe('Europe/Paris');
    expect(input.date_block?.position?.page).toBe('last');
  });
});

// ---------------------------------------------------------------------------
// Serialization: snake_case names reach the HTTP layer intact
// ---------------------------------------------------------------------------

describe('SignaturesResource.create — snake_case serialization', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends initials_block, mentions, and date_block as snake_case keys', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(201, {
        message: 'Signature created.',
        data: { id: SIGNATURE_ID, status: 'waiting_signers', signers: [] },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    await client.signatures.create({
      ...BASE_PAYLOAD,
      initials_block: {
        enabled: true,
        mode: 'auto',
        source: 'signer_name',
        pages: 'except_last',
        position: { x: 5, y: 90, unit: 'percent' },
        color: '#000000',
      },
      mentions: [
        {
          label: 'Lu et approuve',
          required: true,
          signer_index: 0,
          position: { page: 1, x: 10, y: 80 },
        },
      ],
      date_block: {
        enabled: true,
        format: 'dd/MM/yyyy',
        timezone: 'Europe/Paris',
        position: { page: 'last', x: 70, y: 88 },
      },
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    // Top-level keys
    expect(body).toHaveProperty('initials_block');
    expect(body).toHaveProperty('mentions');
    expect(body).toHaveProperty('date_block');

    // InitialsBlock sub-keys
    const ib = body['initials_block'] as Record<string, unknown>;
    expect(ib['mode']).toBe('auto');
    expect(ib['source']).toBe('signer_name');
    expect(ib['pages']).toBe('except_last');
    expect((ib['position'] as Record<string, unknown>)['unit']).toBe('percent');

    // Mentions array sub-keys
    const mentionsList = body['mentions'] as Array<Record<string, unknown>>;
    expect(mentionsList).toHaveLength(1);
    expect(mentionsList[0]['label']).toBe('Lu et approuve');
    expect(mentionsList[0]['required']).toBe(true);
    expect(mentionsList[0]['signer_index']).toBe(0);
    expect((mentionsList[0]['position'] as Record<string, unknown>)['page']).toBe(1);

    // DateBlock sub-keys
    const db = body['date_block'] as Record<string, unknown>;
    expect(db['format']).toBe('dd/MM/yyyy');
    expect(db['timezone']).toBe('Europe/Paris');
    expect((db['position'] as Record<string, unknown>)['page']).toBe('last');
  });

  it('omits new block keys when not provided (no null pollution)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(201, {
        message: 'Signature created.',
        data: { id: SIGNATURE_ID, status: 'waiting_signers', signers: [] },
      })
    );

    const client = new ScellApiClient('sk_test_xxx');
    await client.signatures.create(BASE_PAYLOAD);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;

    expect(body).not.toHaveProperty('initials_block');
    expect(body).not.toHaveProperty('mentions');
    expect(body).not.toHaveProperty('date_block');
  });
});

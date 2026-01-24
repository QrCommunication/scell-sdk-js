/**
 * Scell SDK Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScellClient,
  ScellApiClient,
  ScellAuth,
  ScellWebhooks,
  ScellValidationError,
  ScellAuthenticationError,
  ScellRateLimitError,
  withRetry,
} from '../src/index.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ScellClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      const client = new ScellClient('test-token');
      expect(client).toBeDefined();
      expect(client.companies).toBeDefined();
      expect(client.balance).toBeDefined();
      expect(client.webhooks).toBeDefined();
    });

    it('should create client with custom config', () => {
      const client = new ScellClient('test-token', {
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
      });
      expect(client).toBeDefined();
    });
  });

  describe('companies.list', () => {
    it('should list companies', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Company 1', siret: '12345678901234' },
          { id: '2', name: 'Company 2', siret: '98765432109876' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ScellClient('test-token');
      const result = await client.companies.list();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Company 1');
    });

    it('should handle authentication error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve({ message: 'Unauthenticated' }),
      });

      const client = new ScellClient('invalid-token');

      await expect(client.companies.list()).rejects.toThrow(
        ScellAuthenticationError
      );
    });
  });

  describe('balance.get', () => {
    it('should get balance', async () => {
      const mockResponse = {
        data: {
          amount: 150.0,
          currency: 'EUR',
          auto_reload_enabled: false,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ScellClient('test-token');
      const result = await client.balance.get();

      expect(result.data.amount).toBe(150.0);
      expect(result.data.currency).toBe('EUR');
    });
  });
});

describe('ScellApiClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('invoices.create', () => {
    it('should create invoice', async () => {
      const mockResponse = {
        message: 'Facture creee avec succes',
        data: {
          id: 'invoice-uuid',
          invoice_number: 'FACT-2024-001',
          status: 'draft',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ScellApiClient('api-key');
      const result = await client.invoices.create({
        invoice_number: 'FACT-2024-001',
        direction: 'outgoing',
        output_format: 'facturx',
        issue_date: '2024-01-15',
        total_ht: 100,
        total_tax: 20,
        total_ttc: 120,
        seller_siret: '12345678901234',
        seller_name: 'My Company',
        seller_address: {
          line1: '1 Rue Test',
          postal_code: '75001',
          city: 'Paris',
        },
        buyer_siret: '98765432109876',
        buyer_name: 'Client',
        buyer_address: {
          line1: '2 Rue Client',
          postal_code: '75002',
          city: 'Paris',
        },
        lines: [
          {
            description: 'Service',
            quantity: 1,
            unit_price: 100,
            tax_rate: 20,
            total_ht: 100,
            total_tax: 20,
            total_ttc: 120,
          },
        ],
      });

      expect(result.data.id).toBe('invoice-uuid');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-Key': 'api-key',
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      const mockResponse = {
        message: 'The given data was invalid.',
        errors: {
          invoice_number: ['The invoice number is required.'],
          seller_siret: ['The seller siret must be 14 characters.'],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ScellApiClient('api-key');

      try {
        await client.invoices.create({} as never);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ScellValidationError);
        const validationError = error as ScellValidationError;
        expect(validationError.errors).toHaveProperty('invoice_number');
        expect(validationError.getFieldErrors('seller_siret')).toContain(
          'The seller siret must be 14 characters.'
        );
      }
    });
  });

  describe('signatures.create', () => {
    it('should create signature', async () => {
      const mockResponse = {
        message: 'Demande de signature creee',
        data: {
          id: 'signature-uuid',
          title: 'Contract',
          status: 'pending',
          signers: [
            {
              id: 'signer-1',
              email: 'john@example.com',
              signing_url: 'https://sign.example.com/abc',
            },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      });

      const client = new ScellApiClient('api-key');
      const result = await client.signatures.create({
        title: 'Contract',
        document: 'base64content',
        document_name: 'contract.pdf',
        signers: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            auth_method: 'email',
          },
        ],
      });

      expect(result.data.id).toBe('signature-uuid');
      expect(result.data.signers?.[0].signing_url).toBeDefined();
    });
  });
});

describe('ScellAuth', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should login', async () => {
    const mockResponse = {
      message: 'Connexion reussie',
      user: { id: '1', name: 'Test User', email: 'test@example.com' },
      token: 'jwt-token-here',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(mockResponse),
    });

    const result = await ScellAuth.login({
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.token).toBe('jwt-token-here');
    expect(result.user.email).toBe('test@example.com');
  });
});

describe('ScellWebhooks', () => {
  it('should verify valid signature', async () => {
    const secret = 'whsec_testsecret123456789012345678901';
    const payload = '{"event":"test","timestamp":"2024-01-15T10:00:00Z","data":{}}';
    const timestamp = Math.floor(Date.now() / 1000);

    // Compute expected signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(`${timestamp}.${payload}`);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const header = `t=${timestamp},v1=${signature}`;

    const isValid = await ScellWebhooks.verifySignature(
      payload,
      header,
      secret
    );

    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const isValid = await ScellWebhooks.verifySignature(
      '{"data":"test"}',
      't=1234567890,v1=invalidsignature',
      'whsec_secret'
    );

    expect(isValid).toBe(false);
  });

  it('should parse webhook payload', () => {
    const payload = '{"event":"invoice.validated","timestamp":"2024-01-15T10:00:00Z","data":{"id":"123"}}';
    const parsed = ScellWebhooks.parsePayload<{ id: string }>(payload);

    expect(parsed.event).toBe('invoice.validated');
    expect(parsed.data.id).toBe('123');
  });
});

describe('invoices.markPaid', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should mark invoice as paid with payment details', async () => {
    const mockResponse = {
      data: {
        id: 'invoice-uuid',
        invoice_number: 'FACT-2024-001',
        status: 'paid',
        paid_at: '2026-01-24T10:30:00Z',
        payment_reference: 'VIR-2026-0124',
        payment_note: 'Payment received via bank transfer',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(mockResponse),
    });

    const client = new ScellApiClient('api-key');
    const result = await client.invoices.markPaid('invoice-uuid', {
      payment_reference: 'VIR-2026-0124',
      paid_at: '2026-01-24T10:30:00Z',
      note: 'Payment received via bank transfer',
    });

    expect(result.data.status).toBe('paid');
    expect(result.data.paid_at).toBe('2026-01-24T10:30:00Z');
    expect(result.data.payment_reference).toBe('VIR-2026-0124');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/invoices/invoice-uuid/mark-paid'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'api-key',
        }),
      })
    );
  });

  it('should mark invoice as paid without payment details', async () => {
    const mockResponse = {
      data: {
        id: 'invoice-uuid',
        invoice_number: 'FACT-2024-001',
        status: 'paid',
        paid_at: '2026-01-24T12:00:00Z',
        payment_reference: null,
        payment_note: null,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(mockResponse),
    });

    const client = new ScellApiClient('api-key');
    const result = await client.invoices.markPaid('invoice-uuid');

    expect(result.data.status).toBe('paid');
    expect(result.data.paid_at).toBeDefined();
  });
});

describe('invoices.downloadFile', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should download PDF by default', async () => {
    const mockPdfContent = new ArrayBuffer(1024);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/pdf' }),
      arrayBuffer: () => Promise.resolve(mockPdfContent),
    });

    const client = new ScellApiClient('api-key');
    const result = await client.invoices.downloadFile('invoice-uuid');

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/invoices/invoice-uuid/download?format=pdf'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-Key': 'api-key',
        }),
      })
    );
  });

  it('should download XML when specified', async () => {
    const mockXmlContent = new ArrayBuffer(512);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/xml' }),
      arrayBuffer: () => Promise.resolve(mockXmlContent),
    });

    const client = new ScellApiClient('api-key');
    const result = await client.invoices.downloadFile('invoice-uuid', 'xml');

    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/invoices/invoice-uuid/download?format=xml'),
      expect.any(Object)
    );
  });

  it('should handle download errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve({ message: 'Invoice not found' }),
    });

    const client = new ScellApiClient('api-key');

    await expect(
      client.invoices.downloadFile('non-existent-uuid')
    ).rejects.toThrow();
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should retry on rate limit', async () => {
    let attempts = 0;

    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new ScellRateLimitError('Rate limit exceeded', 1);
      }
      return 'success';
    };

    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelay: 10,
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should not retry on validation error', async () => {
    let attempts = 0;

    const fn = async () => {
      attempts++;
      throw new ScellValidationError('Validation failed', { field: ['error'] });
    };

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelay: 10 })
    ).rejects.toThrow(ScellValidationError);

    expect(attempts).toBe(1);
  });
});

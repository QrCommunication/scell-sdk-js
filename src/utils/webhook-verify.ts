/**
 * Webhook signature verification utility
 *
 * @packageDocumentation
 */

import type { WebhookPayload } from '../types/webhooks.js';

/**
 * Signature verification options
 */
export interface VerifySignatureOptions {
  /** Tolerance in seconds for timestamp validation (default: 300 = 5 minutes) */
  tolerance?: number | undefined;
}

/**
 * Parse the X-Scell-Signature header
 *
 * @param header - The signature header value (format: "t=timestamp,v1=signature")
 * @returns Parsed timestamp and signature
 */
function parseSignatureHeader(header: string): {
  timestamp: number;
  signature: string;
} | null {
  const parts = header.split(',');
  let timestamp: number | undefined;
  let signature: string | undefined;

  for (const part of parts) {
    const splitIndex = part.indexOf('=');
    if (splitIndex === -1) continue;

    const key = part.substring(0, splitIndex);
    const value = part.substring(splitIndex + 1);

    if (key === 't') {
      timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      signature = value;
    }
  }

  if (timestamp === undefined || signature === undefined) {
    return null;
  }

  return { timestamp, signature };
}

/**
 * Compute HMAC-SHA256 signature
 *
 * @param payload - The payload string
 * @param timestamp - The timestamp
 * @param secret - The webhook secret
 * @returns Hex-encoded signature
 */
async function computeSignature(
  payload: string,
  timestamp: number,
  secret: string
): Promise<string> {
  const signedPayload = `${timestamp}.${payload}`;

  // Use Web Crypto API (works in Node.js 18+ and browsers)
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(signedPayload);

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

  // Convert to hex string
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Scell Webhook signature verification utilities
 *
 * @example
 * ```typescript
 * import { ScellWebhooks } from '@scell/sdk';
 *
 * // In your webhook endpoint
 * app.post('/webhooks/scell', async (req, res) => {
 *   const signature = req.headers['x-scell-signature'];
 *   const payload = JSON.stringify(req.body);
 *
 *   const isValid = await ScellWebhooks.verifySignature(
 *     payload,
 *     signature,
 *     process.env.WEBHOOK_SECRET
 *   );
 *
 *   if (!isValid) {
 *     return res.status(401).send('Invalid signature');
 *   }
 *
 *   // Process the webhook
 *   const event = ScellWebhooks.parsePayload(payload);
 *   console.log('Received event:', event.event);
 * });
 * ```
 */
export const ScellWebhooks = {
  /**
   * Verify webhook signature
   *
   * @param payload - Raw request body as string
   * @param signature - Value of X-Scell-Signature header
   * @param secret - Your webhook secret (whsec_...)
   * @param options - Verification options
   * @returns True if signature is valid
   *
   * @example
   * ```typescript
   * const isValid = await ScellWebhooks.verifySignature(
   *   rawBody,
   *   req.headers['x-scell-signature'],
   *   'whsec_abc123...'
   * );
   * ```
   */
  async verifySignature(
    payload: string,
    signature: string,
    secret: string,
    options: VerifySignatureOptions = {}
  ): Promise<boolean> {
    const { tolerance = 300 } = options;

    // Parse the signature header
    const parsed = parseSignatureHeader(signature);
    if (!parsed) {
      return false;
    }

    const { timestamp, signature: providedSignature } = parsed;

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Compute expected signature
    const expectedSignature = await computeSignature(payload, timestamp, secret);

    // Constant-time comparison
    return secureCompare(expectedSignature, providedSignature);
  },

  /**
   * Verify webhook signature synchronously using Node.js crypto
   * (Only works in Node.js environment)
   *
   * @param payload - Raw request body as string
   * @param signature - Value of X-Scell-Signature header
   * @param secret - Your webhook secret (whsec_...)
   * @param options - Verification options
   * @returns True if signature is valid
   */
  verifySignatureSync(
    payload: string,
    signature: string,
    secret: string,
    options: VerifySignatureOptions = {}
  ): boolean {
    const { tolerance = 300 } = options;

    // Parse the signature header
    const parsed = parseSignatureHeader(signature);
    if (!parsed) {
      return false;
    }

    const { timestamp, signature: providedSignature } = parsed;

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Use Node.js crypto for sync operation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto') as typeof import('crypto');
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Use Node.js timingSafeEqual
    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(providedSignature)
      );
    } catch {
      return false;
    }
  },

  /**
   * Parse webhook payload
   *
   * @param payload - Raw request body as string
   * @returns Parsed webhook payload
   *
   * @example
   * ```typescript
   * const event = ScellWebhooks.parsePayload<InvoiceWebhookData>(rawBody);
   * if (event.event === 'invoice.validated') {
   *   console.log('Invoice validated:', event.data.invoice_number);
   * }
   * ```
   */
  parsePayload<T = unknown>(payload: string): WebhookPayload<T> {
    return JSON.parse(payload) as WebhookPayload<T>;
  },

  /**
   * Construct a test webhook event for local testing
   *
   * @param event - Event type
   * @param data - Event data
   * @param secret - Webhook secret for signing
   * @returns Object with payload and headers for testing
   */
  async constructTestEvent<T>(
    event: string,
    data: T,
    secret: string
  ): Promise<{
    payload: string;
    headers: Record<string, string>;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const webhookPayload: WebhookPayload<T> = {
      event: event as WebhookPayload<T>['event'],
      timestamp: new Date().toISOString(),
      data,
    };

    const payload = JSON.stringify(webhookPayload);
    const signature = await computeSignature(payload, timestamp, secret);

    return {
      payload,
      headers: {
        'X-Scell-Signature': `t=${timestamp},v1=${signature}`,
        'X-Scell-Event': event,
        'X-Scell-Delivery': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
    };
  },
};

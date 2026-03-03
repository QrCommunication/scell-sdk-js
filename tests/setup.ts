/**
 * Vitest setup file
 *
 * This file configures the test environment to support Web Crypto API
 * which is used by the SDK for webhook signature verification.
 */

import { webcrypto } from 'node:crypto';

// Polyfill globalThis.crypto for Node.js 18 compatibility
// In Node.js 18, crypto.subtle is available but not exposed globally by default
// Node.js 20+ has this available globally
if (typeof globalThis.crypto === 'undefined') {
  // @ts-expect-error - webcrypto is compatible with Crypto interface
  globalThis.crypto = webcrypto;
} else if (typeof globalThis.crypto.subtle === 'undefined') {
  // @ts-expect-error - Adding subtle to existing crypto object
  globalThis.crypto.subtle = webcrypto.subtle;
}

// Ensure randomUUID is available
if (typeof globalThis.crypto.randomUUID === 'undefined') {
  globalThis.crypto.randomUUID = () => webcrypto.randomUUID();
}

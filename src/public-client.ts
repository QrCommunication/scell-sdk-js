/**
 * Scell Public Client
 *
 * Client for client-side / widget operations using X-Publishable-Key authentication.
 * Safe to use in browser environments.
 *
 * @packageDocumentation
 */

import { HttpClient, type ClientConfig } from './client.js';
import { OnboardingResource } from './resources/onboarding.js';

/**
 * Scell Public Client
 *
 * Use this client for partner onboarding widget integrations.
 * Authenticates with a publishable key (pk_live_* or pk_test_*) via X-Publishable-Key header.
 *
 * @example
 * ```typescript
 * import { ScellPublicClient } from '@scell/sdk';
 *
 * const client = new ScellPublicClient('pk_live_...');
 *
 * // Create a session
 * const { data: session } = await client.onboarding.createSession();
 *
 * // Get SuperPDP authorize URL
 * const { authorize_url, state } = await client.onboarding.getSuperPDPAuthorizeUrl(session.id);
 *
 * // Open popup
 * window.open(authorize_url, 'superpdp-onboarding', 'width=800,height=700');
 *
 * // Handle callback
 * const result = await client.onboarding.superpdpCallback(session.id, code, state);
 * if (result.success) {
 *   console.log('Tenant enrolled:', result.tenant.name);
 * }
 * ```
 */
export class ScellPublicClient {
  private readonly http: HttpClient;

  /** Onboarding resource (SuperPDP OAuth2 flow) */
  public readonly onboarding: OnboardingResource;

  /**
   * Create a new Scell Public Client
   *
   * @param publishableKey - Your publishable key (pk_live_* or pk_test_*)
   * @param config - Optional client configuration
   */
  constructor(publishableKey: string, config: ClientConfig = {}) {
    this.http = new HttpClient('publishable-key', publishableKey, config);
    this.onboarding = new OnboardingResource(this.http);
  }
}

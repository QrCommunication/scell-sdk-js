/**
 * Onboarding Resource
 *
 * SuperPDP OAuth2 Authorization Code onboarding flow.
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { SingleResponse } from '../types/common.js';
import type {
  OnboardingSession,
  SuperPDPAuthorizeResponse,
  SuperPDPCallbackResponse,
} from '../types/onboarding.js';

/**
 * Onboarding API resource
 *
 * Manages the SuperPDP OAuth2 Authorization Code flow for partner tenant onboarding.
 * The flow has 3 steps: connect → redirect → complete.
 *
 * @example
 * ```typescript
 * // 1. Create a session
 * const { data: session } = await client.onboarding.createSession();
 *
 * // 2. Get the SuperPDP authorization URL and open it in a popup
 * const { authorize_url, state } = await client.onboarding.getSuperPDPAuthorizeUrl(session.id);
 * window.open(authorize_url, 'superpdp-onboarding', 'width=800,height=600');
 *
 * // 3. Handle the OAuth2 callback (after user completes onboarding on SuperPDP)
 * const result = await client.onboarding.superpdpCallback(session.id, code, state);
 * if (result.success) {
 *   console.log('Tenant created:', result.tenant.name);
 * }
 * ```
 */
export class OnboardingResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new onboarding session
   *
   * @param requestOptions - Request options
   * @returns Created onboarding session
   *
   * @example
   * ```typescript
   * const { data: session } = await client.onboarding.createSession();
   * console.log('Session step:', session.step); // 'connect'
   * ```
   */
  async createSession(
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<OnboardingSession>> {
    return this.http.post<SingleResponse<OnboardingSession>>(
      '/onboarding/sessions',
      undefined,
      requestOptions
    );
  }

  /**
   * Get an existing onboarding session by ID
   *
   * @param sessionId - Onboarding session UUID
   * @param requestOptions - Request options
   * @returns Onboarding session
   *
   * @example
   * ```typescript
   * const { data: session } = await client.onboarding.getSession('session-uuid');
   * console.log('Current step:', session.step);
   * ```
   */
  async getSession(
    sessionId: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<OnboardingSession>> {
    return this.http.get<SingleResponse<OnboardingSession>>(
      `/onboarding/sessions/${sessionId}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get the SuperPDP OAuth2 authorization URL
   *
   * Returns a URL to open in a popup so the user can create their SuperPDP account.
   * After the user completes the flow, SuperPDP redirects back with a code and state.
   *
   * @param sessionId - Onboarding session UUID
   * @param requestOptions - Request options
   * @returns Authorization URL and CSRF state token
   *
   * @example
   * ```typescript
   * const { authorize_url, state } = await client.onboarding.getSuperPDPAuthorizeUrl(session.id);
   * window.open(authorize_url, '_blank', 'width=800,height=600');
   * ```
   */
  async getSuperPDPAuthorizeUrl(
    sessionId: string,
    requestOptions?: RequestOptions
  ): Promise<SuperPDPAuthorizeResponse> {
    return this.http.get<SuperPDPAuthorizeResponse>(
      `/onboarding/sessions/${sessionId}/superpdp/authorize`,
      undefined,
      requestOptions
    );
  }

  /**
   * Handle the SuperPDP OAuth2 callback
   *
   * Called after the user completes onboarding on SuperPDP and is redirected back.
   * Exchanges the authorization code for a tenant account on Scell.
   *
   * @param sessionId - Onboarding session UUID
   * @param code - Authorization code received from SuperPDP callback
   * @param state - CSRF state token received from SuperPDP callback
   * @param requestOptions - Request options
   * @returns Callback result with the created tenant
   *
   * @example
   * ```typescript
   * const result = await client.onboarding.superpdpCallback(
   *   session.id,
   *   callbackCode,
   *   callbackState
   * );
   * if (result.success) {
   *   console.log('Tenant created:', result.tenant.name, result.tenant.siret);
   * }
   * ```
   */
  async superpdpCallback(
    sessionId: string,
    code: string,
    state: string,
    requestOptions?: RequestOptions
  ): Promise<SuperPDPCallbackResponse> {
    return this.http.post<SuperPDPCallbackResponse>(
      `/onboarding/sessions/${sessionId}/superpdp/callback`,
      { code, state },
      requestOptions
    );
  }
}

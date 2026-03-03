/**
 * Auth Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { MessageResponse, SingleResponse } from '../types/common.js';
import type {
  AuthResponse,
  ForgotPasswordInput,
  LoginCredentials,
  RegisterInput,
  ResetPasswordInput,
  User,
} from '../types/auth.js';

/**
 * Auth API resource
 *
 * Note: Most auth endpoints are only used during initial setup.
 * After login, use the returned token to create a ScellClient.
 *
 * @example
 * ```typescript
 * // Login and get token
 * const auth = await ScellAuth.login({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 *
 * // Create client with token
 * const client = new ScellClient(auth.token);
 *
 * // Get current user
 * const user = await client.auth.me();
 * ```
 */
export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get current authenticated user
   *
   * @param requestOptions - Request options
   * @returns Current user details
   *
   * @example
   * ```typescript
   * const { data: user } = await client.auth.me();
   * console.log(`Logged in as: ${user.name} (${user.email})`);
   * ```
   */
  async me(requestOptions?: RequestOptions): Promise<SingleResponse<User>> {
    return this.http.get<SingleResponse<User>>(
      '/auth/me',
      undefined,
      requestOptions
    );
  }

  /**
   * Logout (revoke current token)
   *
   * @param requestOptions - Request options
   * @returns Logout confirmation
   *
   * @example
   * ```typescript
   * await client.auth.logout();
   * // Token is now invalid
   * ```
   */
  async logout(requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.post<MessageResponse>(
      '/auth/logout',
      undefined,
      requestOptions
    );
  }
}

/**
 * Static auth methods (don't require authentication)
 *
 * @example
 * ```typescript
 * import { ScellAuth } from '@scell/sdk';
 *
 * // Register new user
 * const auth = await ScellAuth.register({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'securepassword123',
 *   password_confirmation: 'securepassword123'
 * });
 *
 * // Login existing user
 * const auth = await ScellAuth.login({
 *   email: 'john@example.com',
 *   password: 'securepassword123'
 * });
 *
 * // Use the token
 * const client = new ScellClient(auth.token);
 * ```
 */
export const ScellAuth = {
  /**
   * Default base URL for auth requests
   */
  baseUrl: 'https://api.scell.io/api/v1',

  /**
   * Register a new user
   *
   * @param input - Registration data
   * @param baseUrl - Optional base URL override
   * @returns Auth response with token
   *
   * @example
   * ```typescript
   * const auth = await ScellAuth.register({
   *   name: 'Jane Doe',
   *   email: 'jane@example.com',
   *   password: 'MySecurePassword123!',
   *   password_confirmation: 'MySecurePassword123!'
   * });
   *
   * console.log('Welcome,', auth.user.name);
   * const client = new ScellClient(auth.token);
   * ```
   */
  async register(
    input: RegisterInput,
    baseUrl?: string
  ): Promise<AuthResponse> {
    const url = `${baseUrl ?? this.baseUrl}/auth/register`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });

    const body = await response.json();

    if (!response.ok) {
      const { parseApiError } = await import('../errors.js');
      parseApiError(response.status, body, response.headers);
    }

    return body as AuthResponse;
  },

  /**
   * Login an existing user
   *
   * @param credentials - Login credentials
   * @param baseUrl - Optional base URL override
   * @returns Auth response with token
   *
   * @example
   * ```typescript
   * const auth = await ScellAuth.login({
   *   email: 'user@example.com',
   *   password: 'password'
   * });
   *
   * // Store the token securely
   * localStorage.setItem('scell_token', auth.token);
   *
   * // Create client
   * const client = new ScellClient(auth.token);
   * ```
   */
  async login(
    credentials: LoginCredentials,
    baseUrl?: string
  ): Promise<AuthResponse> {
    const url = `${baseUrl ?? this.baseUrl}/auth/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const body = await response.json();

    if (!response.ok) {
      const { parseApiError } = await import('../errors.js');
      parseApiError(response.status, body, response.headers);
    }

    return body as AuthResponse;
  },

  /**
   * Request password reset email
   *
   * @param input - Email address
   * @param baseUrl - Optional base URL override
   * @returns Confirmation message
   *
   * @example
   * ```typescript
   * await ScellAuth.forgotPassword({
   *   email: 'user@example.com'
   * });
   * console.log('Check your email for reset link');
   * ```
   */
  async forgotPassword(
    input: ForgotPasswordInput,
    baseUrl?: string
  ): Promise<MessageResponse> {
    const url = `${baseUrl ?? this.baseUrl}/auth/forgot-password`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });

    const body = await response.json();

    if (!response.ok) {
      const { parseApiError } = await import('../errors.js');
      parseApiError(response.status, body, response.headers);
    }

    return body as MessageResponse;
  },

  /**
   * Reset password with token from email
   *
   * @param input - Reset password data
   * @param baseUrl - Optional base URL override
   * @returns Confirmation message
   *
   * @example
   * ```typescript
   * await ScellAuth.resetPassword({
   *   email: 'user@example.com',
   *   token: 'reset-token-from-email',
   *   password: 'NewSecurePassword123!',
   *   password_confirmation: 'NewSecurePassword123!'
   * });
   * ```
   */
  async resetPassword(
    input: ResetPasswordInput,
    baseUrl?: string
  ): Promise<MessageResponse> {
    const url = `${baseUrl ?? this.baseUrl}/auth/reset-password`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(input),
    });

    const body = await response.json();

    if (!response.ok) {
      const { parseApiError } = await import('../errors.js');
      parseApiError(response.status, body, response.headers);
    }

    return body as MessageResponse;
  },
};

import type { DateTimeString, UUID } from './common.js';

/**
 * User entity
 */
export interface User {
  id: UUID;
  name: string;
  email: string;
  email_verified_at: DateTimeString | null;
  is_admin: boolean;
  created_at: DateTimeString;
  updated_at: DateTimeString;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration input
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/**
 * Auth response with token
 */
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

/**
 * Password reset request input
 */
export interface ForgotPasswordInput {
  email: string;
}

/**
 * Password reset input
 */
export interface ResetPasswordInput {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}

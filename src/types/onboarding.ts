/**
 * Onboarding Types
 *
 * Types for the SuperPDP OAuth2 onboarding flow.
 *
 * @packageDocumentation
 */

/** Current step in the SuperPDP OAuth2 onboarding flow */
export type OnboardingStep = 'connect' | 'redirect' | 'complete';

/** An onboarding session */
export interface OnboardingSession {
  id: string;
  step: OnboardingStep;
  publishable_key: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/** Response from the SuperPDP authorize URL endpoint */
export interface SuperPDPAuthorizeResponse {
  authorize_url: string;
  state: string;
}

/** Tenant info returned after SuperPDP callback */
export interface SuperPDPCallbackTenant {
  id: string;
  name: string;
  siret: string;
  environment: string;
}

/** Response from the SuperPDP OAuth2 callback endpoint */
export interface SuperPDPCallbackResponse {
  success: boolean;
  authorization_code: string;
  tenant: SuperPDPCallbackTenant;
}

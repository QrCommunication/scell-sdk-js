import type { DateTimeString, Environment, UUID } from './common.js';

/**
 * Signer authentication method
 */
export type SignerAuthMethod = 'email' | 'sms' | 'both';

/**
 * Signer status
 */
export type SignerStatus = 'pending' | 'signed' | 'refused';

/**
 * Signature status
 */
export type SignatureStatus =
  | 'pending'
  | 'waiting_signers'
  | 'partially_signed'
  | 'completed'
  | 'refused'
  | 'expired'
  | 'error';

/**
 * Signature download file type
 */
export type SignatureDownloadType = 'original' | 'signed' | 'audit_trail';

/**
 * Signature position on document
 */
export interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * UI customization for signature page (white-label)
 */
export interface SignatureUIConfig {
  logo_url?: string | undefined;
  primary_color?: string | undefined;
  company_name?: string | undefined;
}

/**
 * Signer entity
 */
export interface Signer {
  id: UUID;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  auth_method: SignerAuthMethod;
  status: SignerStatus;
  signing_url: string | null;
  signed_at: DateTimeString | null;
  refused_at: DateTimeString | null;
}

/**
 * Signature entity
 */
export interface Signature {
  id: UUID;
  external_id: string | null;
  title: string;
  description: string | null;
  document_name: string;
  document_size: number;
  signers: Signer[] | null;
  status: SignatureStatus;
  status_message: string | null;
  environment: Environment;
  archive_enabled: boolean;
  amount_charged: number | null;
  expires_at: DateTimeString | null;
  created_at: DateTimeString;
  completed_at: DateTimeString | null;
}

/**
 * Signer input for creation
 */
export interface SignerInput {
  first_name: string;
  last_name: string;
  email?: string | undefined;
  phone?: string | undefined;
  auth_method: SignerAuthMethod;
}

/**
 * Signature creation input
 */
export interface CreateSignatureInput {
  /** Your external reference ID */
  external_id?: string | undefined;
  /** Document title */
  title: string;
  /** Document description */
  description?: string | undefined;
  /** Base64-encoded document content */
  document: string;
  /** Document filename */
  document_name: string;
  /** List of signers (1-10) */
  signers: SignerInput[];
  /** Signature positions on the document */
  signature_positions?: SignaturePosition[] | undefined;
  /** White-label UI customization */
  ui_config?: SignatureUIConfig | undefined;
  /** Redirect URL after completion */
  redirect_complete_url?: string | undefined;
  /** Redirect URL after cancellation */
  redirect_cancel_url?: string | undefined;
  /** Expiration date (default: 30 days) */
  expires_at?: DateTimeString | undefined;
  /** Enable 10-year archiving */
  archive_enabled?: boolean | undefined;
}

/**
 * Signature list filter options
 */
export interface SignatureListOptions {
  company_id?: UUID | undefined;
  status?: SignatureStatus | undefined;
  environment?: Environment | undefined;
  per_page?: number | undefined;
}

/**
 * Signature download response
 */
export interface SignatureDownloadResponse {
  url: string;
  expires_at: DateTimeString;
}

/**
 * Signature reminder response
 */
export interface SignatureRemindResponse {
  message: string;
  signers_reminded: number;
}

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
 * Signature position unit.
 * - `'percent'` (defaut) : coordonnees en pourcentage (0-100) de la page.
 * - `'pixel'` : coordonnees absolues en pixels @72dpi.
 */
export type SignaturePositionUnit = 'percent' | 'pixel';

/**
 * Signature position on document
 */
export interface SignaturePosition {
  /** Numero de page (1-indexe). */
  page: number;
  /** Coordonnee X. Unite definie par `unit`. */
  x: number;
  /** Coordonnee Y. Unite definie par `unit`. */
  y: number;
  /** Largeur de la zone (optionnel). */
  width?: number | undefined;
  /** Hauteur de la zone (optionnel). */
  height?: number | undefined;
  /** Unite des coordonnees. Defaut: 'percent' (0-100). 'pixel' = absolu. */
  unit?: SignaturePositionUnit | undefined;
  /** Largeur de la page en pixels @72dpi. Si absent : detection auto via parser PDF, fallback A4 (595). */
  page_width_px?: number | undefined;
  /** Hauteur de la page en pixels @72dpi. Si absent : detection auto via parser PDF, fallback A4 (842). */
  page_height_px?: number | undefined;
}

/**
 * Personnalisation visuelle de la page de signature.
 * Conforme a la spec OpenAPI.com EU-SES v1.0.17 (21 champs).
 * Toutes les couleurs sont en hexadecimal #RRGGBB.
 */
export interface SignatureUIConfig {
  // Sidebar
  sidebar_logo?: string | undefined;
  sidebar_background_color?: string | undefined;
  sidebar_title_color?: string | undefined;
  sidebar_text_color?: string | undefined;

  // Header
  header_background_color?: string | undefined;
  header_title_color?: string | undefined;
  header_subtitle_color?: string | undefined;

  // Footer
  footer_background_color?: string | undefined;

  // Boutons standards
  button_text_color?: string | undefined;
  button_text_color_hover?: string | undefined;
  button_background_color?: string | undefined;
  button_background_color_hover?: string | undefined;

  // Bouton "Signer"
  sign_button_text_color?: string | undefined;
  sign_button_text_color_hover?: string | undefined;
  sign_button_background_color?: string | undefined;
  sign_button_background_color_hover?: string | undefined;

  // Toggles d'affichage
  hide_sidebar?: boolean | undefined;
  hide_header?: boolean | undefined;
  hide_download_validated?: boolean | undefined;
  hide_download_signed?: boolean | undefined;

  // Iframe (max 20 URLs autorisees comme ancetres)
  iframe_ancestors?: string[] | undefined;
}

/**
 * Mode de saisie de la signature.
 * - `'typed'` : signature tapee au clavier uniquement.
 * - `'drawn'` : signature dessinee uniquement.
 * - `'both'` : laisse le signataire choisir.
 */
export type SignatureMode = 'typed' | 'drawn' | 'both';

/**
 * Champs modifiables par le signataire sur ses propres donnees.
 */
export interface SignerEditableData {
  name?: boolean | undefined;
  mobile?: boolean | undefined;
  email?: boolean | undefined;
}

/**
 * Comportement non-UI de la page de signature.
 */
export interface SignatureOptions {
  /** Mode de saisie. 'both' = laisse le signataire choisir. */
  signature_mode?: SignatureMode | undefined;
  /** Force le signataire a parcourir tout le document avant de signer. */
  signer_must_read?: boolean | undefined;
  /** Permet au signataire de modifier ses propres donnees de contact. */
  user_editable_data?: SignerEditableData | undefined;
  /** Identifiant IANA (ex: 'Europe/Paris'). */
  timezone?: string | undefined;
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
  /** Message custom envoye au signataire (max 500 chars). Supporte placeholder {OTP}. */
  message?: string | undefined;
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
  /** White-label UI customization (21 champs conformes OpenAPI.com EU-SES v1.0.17) */
  ui_config?: SignatureUIConfig | undefined;
  /** Comportement non-UI (mode signature, lecture forcee, timezone, editabilite des donnees) */
  signature_options?: SignatureOptions | undefined;
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
 *
 * All filters are scoped to the authenticated tenant. `sub_tenant_id`
 * additionally restricts results to a single sub-tenant belonging to
 * the current tenant (anti-IDOR is enforced server-side).
 */
export interface SignatureListOptions {
  company_id?: UUID | undefined;
  sub_tenant_id?: UUID | undefined;
  status?: SignatureStatus | undefined;
  environment?: Environment | undefined;
  /** Max 100. */
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

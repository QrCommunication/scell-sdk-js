import type { DateTimeString, Environment, UUID } from './common.js';

// ---------------------------------------------------------------------------
// v2.11.0 — Signature blocks (paraphe, mentions légales, date du jour)
// ---------------------------------------------------------------------------

/**
 * Unite des coordonnees d'un bloc de signature.
 * Identique a `SignaturePositionUnit` — reutilisee pour les blocs additionnels.
 */
export type SignatureBlockUnit = 'percent' | 'pixel';

/**
 * Position 2D d'un element flottant sur une page.
 */
export interface SignatureBlockPosition {
  /** Coordonnee X. Unite definie par le champ `unit` du bloc parent. */
  x: number;
  /** Coordonnee Y. Unite definie par le champ `unit` du bloc parent. */
  y: number;
  /** Unite des coordonnees. Defaut: `'percent'` (0-100). */
  unit?: SignatureBlockUnit | undefined;
}

/**
 * Bloc de paraphe (initiales) — appose automatiquement sur chaque page selectionnee.
 *
 * @example
 * ```typescript
 * const initials: InitialsBlock = {
 *   enabled: true,
 *   mode: 'auto',
 *   source: 'signer_name',
 *   pages: 'except_last',
 *   position: { x: 5, y: 90, unit: 'percent' },
 *   font_size: 10,
 *   color: '#1a1a1a',
 * };
 * ```
 */
export interface InitialsBlock {
  /**
   * Active ou desactive le bloc.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Mode de generation des initiales.
   * - `'auto'` : genere automatiquement depuis `source`.
   * - `'custom'` : utilise `custom_text`.
   * @default 'auto'
   */
  mode?: 'auto' | 'custom' | undefined;
  /**
   * Source des initiales en mode `'auto'`.
   * - `'signer_name'` : derive depuis `first_name` + `last_name` du signataire.
   * - `'custom'` : utilise `custom_text` (ignoree si `mode !== 'auto'`).
   * @default 'signer_name'
   */
  source?: 'signer_name' | 'custom' | undefined;
  /**
   * Texte d'initiales en mode `'custom'` ou quand `source === 'custom'`.
   * Maximum 8 caracteres.
   */
  custom_text?: string | undefined;
  /**
   * Pages sur lesquelles apposer le bloc.
   * - `'all'` : toutes les pages.
   * - `'except_last'` : toutes sauf la derniere (la signature principale occupant la derniere page).
   * - `number[]` : liste de numeros de page (1-indexes).
   * @default 'all'
   */
  pages?: 'all' | 'except_last' | number[] | undefined;
  /** Position du bloc sur chaque page concernee. */
  position?: SignatureBlockPosition | undefined;
  /** Taille de la police en points. */
  font_size?: number | undefined;
  /** Couleur du texte en hexadecimal (`#RRGGBB`). */
  color?: string | undefined;
}

/**
 * Position d'une mention legale sur une page du document.
 */
export interface MentionPosition {
  /** Numero de page (1-indexe). */
  page: number;
  /** Coordonnee X. */
  x: number;
  /** Coordonnee Y. */
  y: number;
  /** Largeur de la zone de rendu (optionnel). */
  w?: number | undefined;
  /** Hauteur de la zone de rendu (optionnel). */
  h?: number | undefined;
  /** Unite des coordonnees. Defaut: `'percent'`. */
  unit?: SignatureBlockUnit | undefined;
}

/**
 * Mention legale apposee sur le document a signer.
 *
 * Le signataire coche ou signe la mention pour la valider.
 * Chaque mention peut etre ciblee sur un signataire specifique (via `signer_index`).
 *
 * @example
 * ```typescript
 * const cguMention: Mention = {
 *   label: 'J\'accepte les conditions générales d\'utilisation',
 *   required: true,
 *   signer_index: 0,
 *   position: { page: 2, x: 10, y: 80, unit: 'percent' },
 *   font_size: 9,
 *   color: '#333333',
 * };
 * ```
 */
export interface Mention {
  /** Texte de la mention legale. */
  label: string;
  /**
   * Indique si la mention est obligatoire pour finaliser la signature.
   * @default false
   */
  required?: boolean | undefined;
  /**
   * Index du signataire cible (0-base). Si absent, la mention s'applique a tous les signataires.
   */
  signer_index?: number | undefined;
  /** Position du bloc de mention sur la page. */
  position: MentionPosition;
  /**
   * Texte de repli affiche si la mention ne peut etre calculee dynamiquement.
   */
  fallback_text?: string | undefined;
  /** Taille de la police en points. */
  font_size?: number | undefined;
  /** Couleur du texte en hexadecimal (`#RRGGBB`). */
  color?: string | undefined;
}

/**
 * Position du bloc date — identique a `MentionPosition` mais avec support
 * de la page `'last'` (commodite pour positionner sur la derniere page).
 */
export interface DateBlockPosition {
  /** Numero de page (1-indexe) ou `'last'` pour la derniere page du document. */
  page: number | 'last';
  /** Coordonnee X. */
  x: number;
  /** Coordonnee Y. */
  y: number;
  /** Unite des coordonnees. Defaut: `'percent'`. */
  unit?: SignatureBlockUnit | undefined;
}

/**
 * Bloc date du jour — appose automatiquement la date de signature.
 *
 * Le format suit la convention `date-fns` / `Intl.DateTimeFormat`.
 *
 * @example
 * ```typescript
 * const dateBlock: DateBlock = {
 *   enabled: true,
 *   format: 'dd/MM/yyyy',
 *   timezone: 'Europe/Paris',
 *   position: { page: 'last', x: 70, y: 88, unit: 'percent' },
 *   font_size: 9,
 *   color: '#555555',
 * };
 * ```
 */
export interface DateBlock {
  /**
   * Active ou desactive le bloc.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Format de la date (tokens `date-fns` : `dd/MM/yyyy`, `yyyy-MM-dd`, etc.).
   * @default 'dd/MM/yyyy'
   */
  format?: string | undefined;
  /**
   * Fuseau horaire IANA (ex: `'Europe/Paris'`).
   * @default 'UTC'
   */
  timezone?: string | undefined;
  /** Position du bloc date sur la page. */
  position?: DateBlockPosition | undefined;
  /** Taille de la police en points. */
  font_size?: number | undefined;
  /** Couleur du texte en hexadecimal (`#RRGGBB`). */
  color?: string | undefined;
}

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
  /**
   * Target a specific sub-tenant of the authenticated tenant. When
   * omitted, the signature is created under the master tenant directly.
   * The server returns `404 SUB_TENANT_NOT_FOUND` if the UUID does
   * not belong to the current tenant (anti-IDOR).
   */
  sub_tenant_id?: UUID | undefined;
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

  // --- v2.11.0 blocks ---

  /**
   * Bloc de paraphe (initiales) appose automatiquement sur les pages selectionnees.
   *
   * Permet de materialiser la lecture de chaque page par le signataire sans
   * exiger une signature complete sur chacune d'elles.
   *
   * @example
   * ```typescript
   * initials_block: {
   *   enabled: true,
   *   mode: 'auto',
   *   source: 'signer_name',
   *   pages: 'except_last',
   *   position: { x: 5, y: 90, unit: 'percent' },
   *   color: '#1a1a1a',
   * }
   * ```
   */
  initials_block?: InitialsBlock | undefined;

  /**
   * Tableau de mentions legales a apposer sur le document.
   *
   * Chaque mention peut etre obligatoire et ciblee sur un signataire specifique.
   * Utile pour les CGU, consentements RGPD, declarations sur l'honneur, etc.
   *
   * @example
   * ```typescript
   * mentions: [
   *   {
   *     label: "J'accepte les CGU",
   *     required: true,
   *     signer_index: 0,
   *     position: { page: 2, x: 10, y: 80, unit: 'percent' },
   *   }
   * ]
   * ```
   */
  mentions?: Mention[] | undefined;

  /**
   * Bloc date du jour — appose automatiquement la date de signature sur le document.
   *
   * @example
   * ```typescript
   * date_block: {
   *   enabled: true,
   *   format: 'dd/MM/yyyy',
   *   timezone: 'Europe/Paris',
   *   position: { page: 'last', x: 70, y: 88, unit: 'percent' },
   * }
   * ```
   */
  date_block?: DateBlock | undefined;
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

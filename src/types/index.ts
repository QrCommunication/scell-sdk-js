/**
 * Scell SDK Type Definitions
 *
 * @packageDocumentation
 */

// Common types
export type {
  Address,
  ApiErrorResponse,
  CurrencyCode,
  DateRangeOptions,
  DateString,
  DateTimeString,
  Environment,
  MessageResponse,
  MessageWithDataResponse,
  PaginatedResponse,
  PaginationMeta,
  PaginationOptions,
  SingleResponse,
  Siren,
  Siret,
  UUID,
} from './common.js';

// Invoice types
export type {
  AuditTrailEntry,
  AuditTrailResponse,
  ConvertInvoiceInput,
  CreateInvoiceInput,
  Invoice,
  InvoiceDirection,
  InvoiceDownloadResponse,
  InvoiceDownloadType,
  InvoiceFormat,
  InvoiceLine,
  InvoiceLineInput,
  InvoiceListOptions,
  InvoiceParty,
  InvoiceStatus,
} from './invoices.js';

// Signature types
export type {
  CreateSignatureInput,
  Signature,
  SignatureDownloadResponse,
  SignatureDownloadType,
  SignatureListOptions,
  SignaturePosition,
  SignatureRemindResponse,
  SignatureStatus,
  SignatureUIConfig,
  Signer,
  SignerAuthMethod,
  SignerInput,
  SignerStatus,
} from './signatures.js';

// Company types
export type {
  Company,
  CompanyStatus,
  CreateCompanyInput,
  KycInitiateResponse,
  KycStatusResponse,
  UpdateCompanyInput,
} from './companies.js';

// Balance types
export type {
  Balance,
  ReloadBalanceInput,
  ReloadBalanceResponse,
  Transaction,
  TransactionListOptions,
  TransactionService,
  TransactionType,
  UpdateBalanceSettingsInput,
} from './balance.js';

// Webhook types
export type {
  BalanceWebhookData,
  CreateWebhookInput,
  InvoiceWebhookData,
  SignatureWebhookData,
  UpdateWebhookInput,
  Webhook,
  WebhookEvent,
  WebhookListOptions,
  WebhookLog,
  WebhookPayload,
  WebhookTestResponse,
  WebhookWithSecret,
} from './webhooks.js';

// API Key types
export type {
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyInput,
} from './api-keys.js';

// Auth types
export type {
  AuthResponse,
  ForgotPasswordInput,
  LoginCredentials,
  RegisterInput,
  ResetPasswordInput,
  User,
} from './auth.js';

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
  AcceptInvoiceInput,
  AuditTrailEntry,
  AuditTrailResponse,
  ConvertInvoiceInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  DisputeInvoiceInput,
  DisputeType,
  IncomingInvoiceParams,
  Invoice,
  InvoiceDirection,
  InvoiceDownloadResponse,
  InvoiceDownloadType,
  InvoiceFileFormat,
  InvoiceFormat,
  InvoiceLine,
  InvoiceLineInput,
  InvoiceListOptions,
  InvoiceParty,
  InvoiceStatus,
  InvoiceType,
  MarkPaidInput,
  RefundStatus,
  RejectInvoiceInput,
  RejectionCode,
  // Invoice email delivery (since v2.13.0)
  SendInvoiceByEmailInput,
  SendInvoiceByEmailResponse,
} from './invoices.js';

// Quote types
export type {
  AcceptQuoteInput,
  ConvertToBalanceInput,
  ConvertToDepositInput,
  CreateQuoteInput,
  Quote,
  QuoteActorType,
  QuoteAuditEntry,
  QuoteLine,
  QuoteLineInput,
  QuoteListParams,
  QuoteListResponse,
  QuoteSignature,
  QuoteStatus,
  RefuseQuoteInput,
  SendQuoteInput,
  UpdateQuoteInput,
} from './quotes.js';

// Buyer types
export type {
  Buyer,
  CreateBuyerInput,
  ListBuyersInput,
  UpdateBuyerInput,
} from './buyers.js';

// Signature types
export type {
  CreateSignatureInput,
  DateBlock,
  DateBlockPosition,
  InitialsBlock,
  InitialsPosition,
  Mention,
  MentionPosition,
  Signature,
  SignatureAttachment,
  SignatureBlockPosition,
  SignatureBlockUnit,
  SignatureDownloadResponse,
  SignatureDownloadType,
  SignatureListOptions,
  SignatureMode,
  SignatureOptions,
  SignaturePosition,
  SignaturePositionUnit,
  SignatureRemindResponse,
  SignatureStatus,
  SignatureUIConfig,
  Signer,
  SignerAuthMethod,
  SignerEditableData,
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
  InvoiceIncomingPaidPayload,
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

// Credit Notes types (direct user)
export type {
  CreditNote,
  CreditNoteItem,
  CreateCreditNoteInput,
  CreditNoteListOptions,
} from './credit-notes.js';

// Tenant Credit Notes types
export type {
  CreateTenantCreditNoteInput,
  RemainingCreditable,
  RemainingCreditableLine,
  TenantCreditNote,
  TenantCreditNoteItem,
  TenantCreditNoteItemInput,
  TenantCreditNoteListOptions,
  TenantCreditNoteStatus,
  TenantCreditNoteType,
  UpdateTenantCreditNoteInput,
} from './tenant-credit-notes.js';

// Tenant Invoices types (multi-tenant)
export type {
  CreateIncomingInvoiceParams,
  CreateTenantDirectCreditNoteParams,
  CreateTenantDirectInvoiceParams,
  TenantCreditNoteFilters,
  TenantInvoice,
  TenantInvoiceBuyer,
  TenantInvoiceDirection,
  TenantInvoiceFilters,
  TenantInvoiceSeller,
  UpdateTenantCreditNoteParams,
  UpdateTenantInvoiceParams,
} from './tenant-invoices.js';

// Fiscal types
export type {
  FiscalAnchor,
  FiscalAnchorsOptions,
  FiscalAttestation,
  FiscalAttestationStatus,
  FiscalClosing,
  FiscalClosingOtsCalendar,
  FiscalClosingTotals,
  FiscalClosingsOptions,
  FiscalComplianceData,
  FiscalComplianceStatus,
  FiscalCreateRuleInput,
  FiscalDailyClosingInput,
  FiscalEntriesOptions,
  FiscalEntry,
  FiscalExportRulesOptions,
  FiscalFecExportOptions,
  FiscalFecExportResult,
  FiscalForensicExportOptions,
  FiscalForensicExportType,
  FiscalIncident,
  FiscalIntegrityCheck,
  FiscalIntegrityHistoryOptions,
  FiscalIntegrityOptions,
  FiscalIntegrityReport,
  FiscalKillSwitch,
  FiscalKillSwitchActivateInput,
  FiscalKillSwitchStatus,
  FiscalReplayRulesInput,
  FiscalRule,
  FiscalRuleCategory,
  FiscalRulesOptions,
  FiscalUpdateRuleInput,
} from './fiscal.js';

// Billing types
export type {
  BillingInvoice,
  BillingInvoiceLine,
  BillingInvoiceListOptions,
  BillingTopUpConfirmInput,
  BillingTopUpInput,
  BillingTransaction,
  BillingTransactionListOptions,
  BillingUsage,
  BillingUsageOptions,
  PaymentIntent,
} from './billing.js';

// Stats types
export type {
  StatsMonthly,
  StatsMonthlyOptions,
  StatsOverview,
  StatsOverviewOptions,
} from './stats.js';

// Sub-Tenant types
export type {
  CreateSubTenantInput,
  DeleteSubTenantOptions,
  DeleteSubTenantResponse,
  OnboardingStatus,
  RecommendedAction,
  SubTenant,
  SubTenantAddress,
  SubTenantListOptions,
  SubTenantResumeUrlResponse,
  SubTenantStatusResponse,
  SubTenantSummary,
  SubTenantSuperPDPAuthorizeResponse,
  SuperPDPCompanyVerificationStatus,
  SuperPDPUserIdentityVerificationStatus,
  UpdateSubTenantInput,
} from './sub-tenants.js';

// Tenant Profile types
export type {
  RegenerateKeyResult,
  TenantBalance,
  TenantProfile,
  TenantAddress,
  TenantQuickStats,
  UpdateTenantProfileInput,
} from './tenant-profile.js';

// Onboarding types
export type {
  CompanyData,
  CreateWidgetSubTenantInput,
  CreateWidgetSubTenantResponse,
  IdentityFormData,
  OnboardingSession,
  OnboardingStep,
  SireneLookupResponse,
  SuperPDPAuthorizeResponse,
  SuperPDPCallbackResponse,
  SuperPDPCallbackTenant,
} from './onboarding.js';

// Tenant incoming invoice input types
export type {
  AcceptIncomingInvoiceInput,
  RejectIncomingInvoiceInput,
  MarkPaidIncomingInvoiceInput,
} from '../resources/tenant-incoming-invoices.js';

// Tenant direct credit note remaining types
export type {
  DirectInvoiceRemainingCreditable,
  DirectInvoiceRemainingLine,
} from '../resources/tenant-direct-credit-notes.js';

// Tenant signatures (URL-nested, read-only)
export type {
  TenantSignatureListOptions,
} from '../resources/tenant-signatures.js';

// Payment schedule types (since v2.13.0)
export type {
  AmountType,
  ConvertScheduleLineInput,
  PatchPaymentScheduleInput,
  PaymentScheduleLine,
  PaymentScheduleLineInput,
  PaymentScheduleLineUpdateInput,
  PaymentScheduleResponse,
  PaymentSummary,
  ScheduleLineStatus,
  SchedulePreset,
} from './payment-schedule.js';

// Branding types (since v2.13.0)
export type {
  Branding,
  BrandingLogoUploadUrlInput,
  BrandingLogoUploadUrlResponse,
  UpdateBrandingInput,
} from './branding.js';
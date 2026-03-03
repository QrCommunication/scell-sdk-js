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
  MarkPaidInput,
  RejectInvoiceInput,
  RejectionCode,
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
  SubTenant,
  SubTenantAddress,
  SubTenantListOptions,
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
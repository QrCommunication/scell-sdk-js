# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.11.0] - 2026-04-04

### Changed

- **Onboarding**: Replace 4-step KYB flow with SuperPDP OAuth2 Authorization Code flow (3 steps: connect → redirect → complete)
  - `OnboardingStep` is now `'connect' | 'redirect' | 'complete'`

### Added

- **Onboarding Resource**: `OnboardingResource` on `ScellApiClient` (`client.onboarding`)
  - `createSession()` — Create a new onboarding session
  - `getSession(sessionId)` — Get an existing onboarding session
  - `getSuperPDPAuthorizeUrl(sessionId)` — Get the SuperPDP OAuth2 authorization URL to open in a popup
  - `superpdpCallback(sessionId, code, state)` — Handle the OAuth2 callback and create the Scell tenant

- **New Types**:
  - `OnboardingSession` — Onboarding session with `id`, `step`, `publishable_key`, timestamps
  - `OnboardingStep` — `'connect' | 'redirect' | 'complete'`
  - `SuperPDPAuthorizeResponse` — `{ authorize_url: string; state: string }`
  - `SuperPDPCallbackResponse` — `{ success: boolean; authorization_code: string; tenant: SuperPDPCallbackTenant }`
  - `SuperPDPCallbackTenant` — `{ id: string; name: string; siret: string; environment: string }`

### Removed

- Removed legacy onboarding types: `VerifySiretRequest`, `VerifySiretResponse`, `VerifyVatRequest`, `UploadDocumentRequest`, `KybDocument`, `Representative`, `CompanyData`
- Removed legacy onboarding methods: `verifySiret`, `verifyVat`, `uploadDocument`, `getDocuments`, `completeOnboarding`

## [1.5.0] - 2025-03-29

### Fixed

- **Documentation**: Correct `tenantCreditNotes` property name to `creditNotes` on `ScellApiClient` throughout the README
- **Fiscal**: `updateRule` now correctly uses `PUT` instead of `POST` to match the `PUT /tenant/fiscal/rules/{id}` backend endpoint

## [1.4.0] - 2026-02-08

### Added

- **Fiscal Compliance** (LF 2026): `FiscalResource` with 22 methods covering compliance dashboard, integrity checks, closings, FEC export, attestation, ledger entries, kill switch, anchors, rules, and forensic export
- **Billing**: `BillingResource` with invoices, usage, top-up, and transactions
- **Stats**: `StatsResource` with overview, monthly, and sub-tenant overview
- **Sub-Tenants**: `SubTenantsResource` with full CRUD + `findByExternalId()`
- **Tenant Profile**: `me()`, `updateProfile()`, `balance()`, `quickStats()`, `regenerateKey()` on `ScellTenantClient`
- **Bulk Operations**: `bulkCreate()`, `bulkSubmit()`, `bulkStatus()` on `TenantDirectInvoicesResource`
- New types: `FiscalComplianceData`, `FiscalIntegrityReport`, `FiscalClosing`, `FiscalEntry`, `FiscalKillSwitchStatus`, `FiscalRule`, `FiscalAnchor`, `FiscalAttestation`, `BillingInvoice`, `BillingUsage`, `BillingTransaction`, `StatsOverview`, `StatsMonthly`, `SubTenant`, `TenantProfile`, `TenantBalance`, and 30+ supporting types

## [1.3.0] - 2026-01-25

### Changed

- Internal improvements and bug fixes

## [1.2.0] - 2026-01-24

### Added

- **Mark Paid Support**: Mark incoming invoices as paid (mandatory status in French e-invoicing lifecycle)
  - `invoices.markPaid(id, data?)` - Mark invoice as paid with optional payment reference, date, and note

- **Download Invoice Files**: Download original invoice files as binary content
  - `invoices.downloadFile(id)` - Download PDF (Factur-X with embedded XML)
  - `invoices.downloadFile(id, 'xml')` - Download standalone XML (UBL/CII)
  - Returns `ArrayBuffer` for direct file manipulation in Node.js or browser

- **HTTP Client Enhancement**:
  - `HttpClient.getRaw()` - New method for downloading binary content

- **New Types**:
  - `MarkPaidInput` - Input type for marking invoices as paid
  - `InvoiceFileFormat` - Type for download format ('pdf' | 'xml')
  - `InvoiceIncomingPaidPayload` - Webhook payload for paid invoices
  - Added `paid_at`, `payment_reference`, `payment_note` fields to `Invoice` type
  - Added `'paid'`, `'disputed'`, `'cancelled'` to `InvoiceStatus` type

- **New Webhook Event**:
  - `invoice.incoming.paid` - Triggered when an incoming invoice is marked as paid

## [1.1.0] - 2026-01-24

### Added

- **Incoming Invoices Support**: Full support for supplier invoices (direction: incoming)
  - `invoices.incoming()` - List incoming invoices with filtering by status, seller, date range, and amount
  - `invoices.accept()` - Accept an incoming invoice with optional payment date and note
  - `invoices.reject()` - Reject an incoming invoice with reason and standardized rejection code
  - `invoices.dispute()` - Open a dispute on an incoming invoice for resolution

- **New Types for Incoming Invoices**:
  - `IncomingInvoiceParams` - Filter options for listing incoming invoices
  - `AcceptInvoiceInput` - Input for accepting an invoice
  - `RejectInvoiceInput` - Input for rejecting an invoice with reason code
  - `DisputeInvoiceInput` - Input for disputing an invoice
  - `RejectionCode` - Standardized rejection codes (`incorrect_amount`, `duplicate`, `unknown_order`, `incorrect_vat`, `other`)
  - `DisputeType` - Dispute type categories (`amount_dispute`, `quality_dispute`, `delivery_dispute`, `other`)

- **New Webhook Events for Incoming Invoices**:
  - `invoice.incoming.received` - New incoming invoice received
  - `invoice.incoming.validated` - Incoming invoice validated
  - `invoice.incoming.accepted` - Incoming invoice accepted
  - `invoice.incoming.rejected` - Incoming invoice rejected
  - `invoice.incoming.disputed` - Incoming invoice disputed

## [1.0.0] - 2026-01-24

### Added

- **Electronic Invoicing**: Full support for Factur-X, UBL, and CII formats
  - Create, list, and download invoices
  - Format conversion between standards
  - Audit trail with integrity verification

- **Electronic Signatures**: eIDAS EU-SES compliant signatures
  - Create signature requests with multiple signers
  - Support for email and SMS authentication methods
  - Download signed documents and audit trails
  - Send reminders and cancel pending signatures

- **Full TypeScript Types**: Strict TypeScript definitions for all API entities
  - Invoices, signatures, companies, balance, webhooks
  - Request/response types with full IDE support
  - Exported types for external use

- **Zero Dependencies**: Uses native fetch API
  - No external HTTP libraries required
  - Node.js 18+ and browser compatible
  - ESM and CommonJS dual module support

- **Webhook Verification**: Secure webhook signature validation
  - HMAC-SHA256 signature verification
  - Payload parsing with type safety
  - Support for all webhook event types

- **Retry with Exponential Backoff**: Automatic retry for transient failures
  - Configurable retry options
  - Exponential backoff with jitter
  - Rate limit (429) and server error (5xx) handling

- **Dual Authentication**: Support for both authentication modes
  - Bearer token for dashboard operations (ScellClient)
  - X-API-Key for external API access (ScellApiClient)

- **Error Handling**: Typed error classes for all API errors
  - ScellValidationError with field-level errors
  - ScellAuthenticationError for auth failures
  - ScellRateLimitError with retry-after info
  - ScellInsufficientBalanceError for balance issues

[1.11.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.11.0
[1.5.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.5.0
[1.4.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.4.0
[1.3.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.3.0
[1.2.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.2.0
[1.1.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.1.0
[1.0.0]: https://github.com/QrCommunication/scell-sdk-js/releases/tag/v1.0.0

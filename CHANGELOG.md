# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.17.0] - 2026-05-06

### Added

- **`fiscal.iscaSelfAttestationDownload(subTenantId?)`** — telecharge l'auto-attestation
  ISCA **NOMINATIVE** au format PDF binaire pour le tenant authentifie ou pour
  un sub_tenant specifique. Le PDF inclut l'identite nominative du beneficiaire
  (raison sociale, SIRET, TVA, adresse, contact, statut KYB/KYC) en plus du
  nom + version du logiciel. Le hash SHA-256 couvre l'identite, garantissant
  la non-transferabilite (preuve cryptographique).
- **`fiscal.iscaMeasuresRegisterDownload()`** — telecharge le registre des mesures
  ISCA (PDF non-nominatif).
- **`fiscal.iscaTechnicalDossierDownload()`** — telecharge le dossier technique
  ISCA (PDF non-nominatif, NF Z 42-025).

### Notes

- Backend requis : Scell.io v0.6.0+ (ledger increvable + attestation nominative).
- Auth : `tk_*` tenant key. La methode avec `subTenantId` verifie l'appartenance
  cross-tenant (404 si IDOR).
- Bump : 1.16.0 -> 1.17.0

## [1.15.1] - 2026-05-03

### Fixed

- **Critical** : URL building bug in `ScellClient.buildUrl()` was dropping or
  replacing the last segment of `baseUrl` when paths started with `/` or were
  bare segment names. With `baseUrl = 'https://api.scell.io/api/v1'` and
  `path = '/tenant/invoices'`, the resulting URL was
  `https://api.scell.io/tenant/invoices` (missing `/api/v1`), causing 404
  on every request to the tenant API.
  - Fix : concatenate `baseUrl` + `path` manually (with leading/trailing
    slash normalisation) instead of relying on `new URL(path, base)` which
    follows RFC 3986 path resolution that doesn't fit our use case.
  - Affects all tenant routes (`/api/v1/tenant/...`) and templates routes.

### Notes

- No API change. Pure bug fix.
- Bump : 1.15.0 -> 1.15.1

## [1.15.0] - 2026-05-03

### Added

- **Invoice Templates** : nouveau resource `client.invoiceTemplates` pour la personnalisation des factures et avoirs.
  - Types : `InvoiceTemplate`, `CreateInvoiceTemplateInput`, `UpdateInvoiceTemplateInput`, `InvoiceTemplateListOptions`.
  - 6 methodes : `list()`, `get()`, `create()`, `update()`, `delete()`, `markDefault()`.
  - 3 scopes : `system` | `tenant` | `sub_tenant`.
  - Cascade : explicit > sub_tenant default > tenant default > system default.
- **Daily Closure** : nouveau type `DailyClosure` avec `csv_url` (signed URL 5 jours).
- **Avoirs** : `CreateTenantDirectCreditNoteParams` : champs buyer/seller interdits (heritage strict). Validation cote API : `invoice_id` doit pointer sur une facture creditable.
- `CreateInvoiceInput`, `CreateTenantDirectInvoiceParams` : nouveau champ `invoice_template_id?: UUID`.
- `Invoice`, `TenantInvoice`, `CreditNote`, `TenantCreditNote` : output `invoice_template_id: UUID | null`.

### Notes

- No breaking change. Default = template system.
- Bump : 1.14.0 -> 1.15.0

## [1.14.0] - 2026-05-03

### Added

- **B2C support** : nouveau flag `buyer_is_individual` pour les factures et avoirs avec acheteur particulier.
  - `InvoiceParty.is_individual?: boolean` (sur seller/buyer ; meaningful uniquement pour buyer).
  - `CreateInvoiceInput.buyer_is_individual?: boolean` (top-level).
  - `TenantInvoiceBuyer.is_individual?: boolean` (cote tenant direct).
  - `CreateTenantDirectInvoiceParams.buyer_is_individual?: boolean`.
  - `TenantInvoice.buyer_is_individual: boolean` et `TenantInvoice.buyer.is_individual?: boolean` en sortie API.
  - `TenantCreditNote.buyer_is_individual: boolean` (heritage automatique depuis la facture associee).

### Notes

- Aucun breaking change : tous les champs B2C sont optionnels en input, et le default cote serveur est `false` (B2B).
- Cote API, en B2C : SIRET / SIREN / VAT / legal_id ne sont plus requis. Factur-X / UBL / CII generes omettent les balises BT-46/BT-47/BT-48 du buyer (BR-CO-26 EN16931). Les mentions legales B2B (Code de commerce L441-10 : penalites de retard 3x taux legal, indemnite forfaitaire 40 EUR) sont automatiquement supprimees.

## [1.13.0] - 2026-04-15

### Added

- `SignatureUIConfig` : 21 champs de personnalisation UI conformes spec OpenAPI.com EU-SES v1.0.17 (sidebar_*, header_*, footer_*, button_*, sign_button_*, hide_*, iframe_ancestors).
- `SignatureOptions` (nouveau) : signature_mode, signer_must_read, user_editable_data, timezone.
- `SignerInput.message` : message custom par signataire avec placeholder `{OTP}` (max 500 chars).
- `SignaturePosition.unit` : `'percent'` (defaut) ou `'pixel'`.
- `SignaturePosition.page_width_px` / `page_height_px` : dimensions de page optionnelles pour conversion percent->pixel precise (sinon detection auto via parser PDF cote serveur, fallback A4).
- Nouveaux exports de types : `SignatureMode`, `SignatureOptions`, `SignaturePositionUnit`, `SignerEditableData`.

### Removed (BREAKING vs interfaces internes)

- `SignatureUIConfig.logo_url` -> utiliser `sidebar_logo`.
- `SignatureUIConfig.primary_color` -> utiliser `sidebar_background_color`.
- `SignatureUIConfig.company_name` -> pas d'equivalent (non supporte par OpenAPI.com).

### Notes

- `unit: 'percent'` reste le defaut cote serveur, donc les positions sans `unit` continueront de fonctionner.
- Si vos clients utilisaient `logo_url` / `primary_color`, ils doivent migrer vers `sidebar_logo` / `sidebar_background_color`.

## [1.12.0] - 2026-04-07

### Added

- **ScellPublicClient**: New client class for client-side / widget use with `X-Publishable-Key` authentication
  - Exposes `onboarding` resource (SuperPDP OAuth2 flow)
- **Aliases on TenantDirectInvoicesResource**: `validate(invoiceId)` and `send(invoiceId)` as aliases for `submit()`
- **Exported types**: `AcceptIncomingInvoiceInput`, `RejectIncomingInvoiceInput`, `MarkPaidIncomingInvoiceInput` from incoming invoices resource; `DirectInvoiceRemainingCreditable`, `DirectInvoiceRemainingLine` from direct credit notes resource

### Fixed

- **JSDoc**: Remove `invoice_number` from `invoices.create()` example calls (server-generated field)
- **JSDoc**: Fix misleading "legacy" comment on `ScellApiClient` to "tenant"

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

## [1.10.1] - 2026-04-02

### Fixed

- **Documentation**: Clarify `ScellApiClient` authentication mode description

## [1.10.0] - 2026-04-01

### Fixed

- Resolve 5 architecture inconsistencies across clients and resources

## [1.9.2] - 2026-03-31

### Added

- **Fiscal**: ISCA document downloads — `downloadMeasuresRegister()`, `downloadTechnicalDossier()`, `downloadSelfAttestation()`
- **Fiscal**: Renamed NF525 references to ISCA throughout

## [1.9.0] - 2026-03-30

### Changed

- **Invoice numbering**: Remove `invoice_number` from `CreateInvoiceInput` — numbers are server-generated
  - Draft invoices receive `DRAFT-{SLUG5}-{seq}` numbers automatically
  - Definitive fiscal numbers assigned at submit time

### Added

- `llms.txt` — LLM-friendly SDK reference document

## [1.8.0] - 2026-03-29

### Added

- **International invoicing**: Optional SIRET, VAT number (`buyer_vat_number`, `seller_vat_number`), and `buyer_legal_id` / `buyer_legal_id_scheme` for non-EU buyers

## [1.7.0] - 2026-03-28

### Added

- **CreditNotes resource** (`ScellClient.creditNotes`): `list()`, `get()`, `create()`, `send()`, `download()`, `remainingCreditable()`
- **TenantDirectInvoicesResource**: `submit(invoiceId)` method

## [1.6.0] - 2026-03-27

### Added

- Expand `ScellApiClient` with additional resources: `creditNotes`, `tenantInvoices`, `incomingInvoices`
- **SignaturesResource**: `auditTrail(id)` method

## [1.5.0] - 2026-03-29

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

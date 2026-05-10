# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),

## [2.7.0] - 2026-05-10

### Added

- **`TenantSignaturesResource`** — read-only access to signatures via the
  new URL-nested tenant endpoints (`X-API-Key` authentication only,
  `sk_live_*` / `sk_test_*`). Exposes :
  - `client.tenantSignatures.list(options?)` →
    `GET /v1/tenant/signatures`
  - `client.tenantSignatures.get(id)` →
    `GET /v1/tenant/signatures/{id}`
  - `client.tenantSignatures.listForSubTenant(subTenantId, options?)` →
    `GET /v1/tenant/sub-tenants/{subTenantId}/signatures`
  - `client.tenantSignatures.getForSubTenant(subTenantId, id)` →
    `GET /v1/tenant/sub-tenants/{subTenantId}/signatures/{id}`

  Also exposed as `client.signatures` on `ScellTenantClient`. Server-side
  scope is strict (anti-IDOR enforced) : signatures and sub-tenants must
  belong to the authenticated tenant or 404 is returned.

- New type `TenantSignatureListOptions` — query filters for the
  URL-nested endpoints (`status`, `environment`, `per_page`).
  `sub_tenant_id` is no longer a query param under this surface ; the
  scope is expressed via the URL itself.

### Why

The previous flat `signatures.list()` (introduced in v2.6.0 under
`X-API-Key`) still works, but the URL-nested pattern matches the
existing convention used by tenant invoices and credit notes. It also
sidesteps the historical `403 COMPANY_REQUIRED` returned to tenant
master keys without a resolvable `company_id`.

## [2.6.0] - 2026-05-10

### Added

- `signatures.list()` and `signatures.get()` are now usable under API key
  authentication (`sk_live_*` / `sk_test_*`), in addition to Sanctum
  (dashboard). Server-side scope changed from `user_id` to `tenant_id`
  (resolved via `company.tenant_id`), fixing a pre-existing 500 error
  when calling these endpoints under `sk_*`.
- `SignatureListOptions.sub_tenant_id` — restrict the result set to a
  single sub-tenant of the current tenant. Anti-IDOR is enforced
  server-side: passing an arbitrary sub-tenant UUID that doesn't belong
  to the authenticated tenant returns 404.

### Notes

- `per_page` is capped at 100 server-side.
- No breaking change. Existing calls without `sub_tenant_id` keep the
  same behavior (scoped to the tenant, no sub-tenant filter).

### Migration

`pnpm add @scell/sdk@2.6` (or `^2`).

## [2.5.0] - 2026-05-10

### Documentation only — no runtime change

The JS SDK already covered the full EU-SES contract from v2.x: 21
`ui_config` fields, 4 `signature_options`, multi-signers with `message`
and `auth_method: 'email'|'sms'|'both'`, `signature_positions[].unit`,
`page_width_px`, `page_height_px`. This release adds documentation for
the backend's new wrapper page.

### What changed server-side

When `signatures.create()` returns, each signer's `signing_url` now
points to `https://sign.scell.io/sign/{sig}/{signer}?expires=…&signature=HMAC`
instead of OpenAPI.com directly. The wrapper page embeds the upstream
OpenAPI.com signing flow inside an iframe with default Scell.io
branding. If the request omits `ui_config`, the backend fills the 16
visual fields automatically. Per-field overrides are preserved.
`iframe_ancestors` is auto-extended with `https://sign.scell.io` and
`https://scell.io` (capped at 20, deduplicated).

You don't need to change anything in your code. Just distribute the
`signers[i].signing_url` to your end-users as you already do.

### Migration

`pnpm add @scell/sdk@2.5` (or `^2`).

## [2.3.0] - 2026-05-10

### Fixed (CRITICAL — broken Sirene lookup parsing)

- `OnboardingResource.lookupSirene()` returned a `SireneLookupResponse` whose
  shape did **not** match the actual API. The `CompanyData.address` interface
  was nested (`address.line1`) but the API returns flat fields (`address_line1`,
  `postal_code`, `city`, `country`). Result: every address field arrived as
  `undefined` since v2.0.0.
- The discriminant `sirene_lookup_succeeded` was read at the response root,
  but the API exposes `data.sirene_lookup_failed: true` (negation) only in
  the manual-entry fallback case. The field was therefore always `undefined`.

### Changed

- `lookupSirene()` now returns a discriminated `SireneLookupResult` with
  four guaranteed fields: `data: CompanyData | null`,
  `sirene_lookup_succeeded`, `manual_entry_required`, `code`.
- `CompanyData` interface restructured to mirror the real API shape (flat
  address) and gains `legal_name`, `creation_date`, `employee_range`.

### Added

- New exported helper `parseSireneLookup(raw)` for partners who call the
  endpoint manually (eg. through a server-side proxy).
- Type `SireneLookupRawResponse` documents the raw HTTP payload.
- Type `SireneManualEntryData` documents the partial fallback payload.
- Type alias `SireneLookupResponse` is kept as a deprecated alias for
  `SireneLookupResult` to preserve `import { SireneLookupResponse }`.

### Migration

```typescript
// BEFORE v2.3.0 — never worked, address was always empty
const { data, sirene_lookup_succeeded } =
  await client.onboarding.lookupSirene('10178342100015');
console.log(data?.address.line1); // -> undefined

// AFTER v2.3.0
const result = await client.onboarding.lookupSirene('10178342100015');
if (result.data) {
  console.log(result.data.address_line1); // -> '200 RUE DE LA CROIX NIVERT'
  console.log(result.data.city);          // -> 'PARIS'
} else if (result.manual_entry_required) {
  // fallback: Etalab + INSEE down, ask user to fill manually
} else if (result.code === 'SIRENE_NOT_FOUND') {
  // SIRET unknown
}
```

### Tests

- `tests/onboarding-sirene.test.ts` (4 tests): success / manual_entry /
  not_found / empty payload paths — all using prod-captured payloads.

---

## [2.2.0] - 2026-05-10

### Added

- `client.billing.payInvoice(invoiceId, requestOptions?)` — initie le paiement Stripe d'une facture plateforme via `POST /api/v1/tenant/billing/invoices/{id}/pay`. Retourne un `SingleResponse<PaymentIntent>` avec le `client_secret` a passer a `stripe.confirmCardPayment()`.
- Type `PaymentIntent` (exporté depuis `@scell/sdk`) — champs : `client_secret`, `payment_intent_id`, `amount` (centimes), `currency` (ISO 4217 lowercase), `status`.
- Champ optionnel `stripe_payment_intent_id?: string | null` ajouté au type `TenantInvoice`.

### Errors

- `ScellNotFoundError` (404) si la facture n'appartient pas au tenant
- `ScellValidationError` (422) si le statut de la facture ne permet pas le paiement (draft, paid, cancelled)

---

## [2.1.0] - 2026-05-08

### Added

- `client.tenantInvoices.download(invoiceId, format?)` — telecharger une facture du tenant (binary buffer). Comble le gap v2 ou `tenantInvoices` n'avait pas de download (l'endpoint v1 `/tenant/invoices/{id}/download` etait supprime, et le v2 company-scoped `/invoices/{id}/download/pdf` retournait 403 COMPANY_REQUIRED avec une cle tenant).
- `client.tenantInvoices.downloadForSubTenant(subTenantId, invoiceId, format?)` — variant scope sub-tenant strict (404 si la facture n'appartient pas au sub-tenant ET au tenant).
- Support des 3 formats : `'facturx'` (defaut, PDF/A-3 + XML CII embarque), `'pdf'` (rendu visuel pur), `'xml'` (UBL ou CII brut).

### Backend

Cote API Scell.io, 2 nouveaux endpoints :
- `GET /api/v1/tenant/invoices/{invoiceId}/download[?format=]`
- `GET /api/v1/tenant/sub-tenants/{subTenantId}/invoices/{invoiceId}/download[?format=]`

Le scope tenant_id est verifie cote serveur via la company associee a la facture (ownership chain : invoice → company → tenant). Le scope sub-tenant rajoute un filtre strict sur `companies.sub_tenant_id`.

### Notes

- Pas de breaking change : les autres methodes existent toujours. Bump minor.
- Le binary est retourne en `ArrayBuffer` cote JS — utiliser `Buffer.from(buffer)` (Node) ou `new Blob([buffer])` (browser) pour persister/afficher.
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-05-08

Major release. Aligns the SDK with the Scell.io API v2 onboarding model
(SuperPDP-driven sub-tenant lifecycle). The legacy 3-state `kyc_status`
field is dropped from `SubTenant` and replaced by a richer
`onboarding_status` enum plus explicit SuperPDP verification fields.
Five new endpoints are exposed (Sirene lookup, widget create sub-tenant,
SuperPDP status query, refresh and resume URL).

### Breaking Changes

- **`SubTenant` no longer exposes `kyc_status`, `kyc_verified_at`,
  `kyc_delegated`.** Backend stopped returning these fields. Code that
  read them must migrate to the new shape (see Migration Guide below).
- The `SubTenant` interface now mandates `onboarding_status: OnboardingStatus`.
  Type-checking will fail loudly on consumers that assumed the legacy shape.
- The `refreshSuperPDPStatus` endpoint is rate-limited to 1 request /
  minute / sub-tenant; HTTP 429 is surfaced as `ScellRateLimitError`.

### Added

- **`OnboardingStatus`** type (6 values) replacing legacy `kyc_status`:
  `pending_superpdp` | `superpdp_redirected` | `superpdp_authorized` |
  `superpdp_pending_review` | `active` | `superpdp_failed`.
- **`SubTenant`** new fields: `onboarding_status`,
  `superpdp_company_verification_status`,
  `superpdp_user_identity_verification_status`, `last_polled_at`,
  `recommended_action`, `contact_first_name`, `contact_last_name`,
  `resume_url`.
- **`RecommendedAction`** interface — structured i18n action object
  (`code`, `severity`, `title_fr`, `title_en`, `message_fr`, `message_en`,
  `cta_label_fr`, `cta_label_en`, `cta_url`, `dismissible`).
- **`SubTenantsResource.getSuperPDPStatus(id)`** — `GET /sub-tenants/{id}/superpdp-status`.
- **`SubTenantsResource.refreshSuperPDPStatus(id)`** — `POST /sub-tenants/{id}/superpdp-status/refresh` (rate-limited).
- **`SubTenantsResource.getResumeUrl(id)`** — `POST /sub-tenants/{id}/resume-url` (signed URL valid 7 days).
- **`OnboardingResource.lookupSirene(siret)`** — `POST /widget/onboarding/sirene/lookup` (publishable-key auth).
- **`OnboardingResource.createSubTenant(payload)`** — `POST /widget/onboarding/sub-tenant` (publishable-key auth).
- New types exported: `CompanyData`, `IdentityFormData`,
  `CreateWidgetSubTenantInput`, `CreateWidgetSubTenantResponse`,
  `SireneLookupResponse`, `SubTenantStatusResponse`,
  `SubTenantResumeUrlResponse`, `SubTenantSummary`,
  `SuperPDPCompanyVerificationStatus`,
  `SuperPDPUserIdentityVerificationStatus`.

### Migration Guide

Replace any `kyc_status` reads with `onboarding_status`:

| Legacy `kyc_status` | New `onboarding_status`                                                                       |
|---------------------|-----------------------------------------------------------------------------------------------|
| `'pending'`         | `'pending_superpdp'`, `'superpdp_redirected'`, `'superpdp_authorized'`, `'superpdp_pending_review'` |
| `'verified'`        | `'active'`                                                                                    |
| `'rejected'`        | `'superpdp_failed'`                                                                           |

```typescript
// BEFORE (v1.x)
if (subTenant.kyc_status === 'verified') { /* ... */ }

// AFTER (v2.0)
if (subTenant.onboarding_status === 'active') { /* ... */ }

// For UI, prefer the localized recommended_action:
const { data, recommended_action } =
  await client.subTenants.getSuperPDPStatus(subTenant.id);
if (recommended_action) {
  showBanner({
    title: locale === 'fr' ? recommended_action.title_fr : recommended_action.title_en,
    severity: recommended_action.severity,
    cta: { label: recommended_action.cta_label_fr, url: recommended_action.cta_url },
  });
}
```

### Backend requirements

Scell.io API v2.0+ (release 2026-05-08). The new endpoints will return
404 on older backends.

## [1.18.0] - 2026-05-06

### Added

- **`invoiceTemplates.uploadLogo(id, file, filename?)`** — upload d'un logo
  pour un template (multipart S3). Accepte File, Blob ou Uint8Array.
  Formats : jpeg, png, webp, svg/svgz. Max 2MB. Retourne le template
  mis a jour avec le nouveau `logo_url` (URL publique CDN).
- **`HttpClient.postFormData(path, formData, options?)`** — primitive bas
  niveau pour les uploads multipart. Reutilise les headers d'auth, gere
  le timeout, parse les erreurs API.

### Backend requirements

Backend Scell.io v0.7.0+ (endpoint `POST /v1/invoice-templates/{id}/logo`).

### Use case

Permettre aux integrateurs de configurer le branding (logo + couleurs +
mentions custom) **une fois pour toutes** via SDK, sans avoir besoin de
re-passer ces parametres sur chaque facture. Les overrides par-facture
restent prioritaires sur les defauts du template.

```typescript
// Upload du logo une fois pour toutes
const template = await scell.invoiceTemplates.uploadLogo(
  templateId,
  fs.readFileSync('logo.png'),
  'logo.png'
);

// Configurer les couleurs / mentions
await scell.invoiceTemplates.update(templateId, {
  primary_color: '#1F2937',
  accent_color: '#6366F1',
  footer_text: 'Mentions legales custom',
});

// Marquer comme template tenant default — utilise sur toutes les factures
await scell.invoiceTemplates.markDefault(templateId);
```

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
- **Fiscal**: Renamed legacy fiscal certification references to ISCA throughout

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

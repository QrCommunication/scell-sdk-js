# Changelog

All notable changes to this project will be documented in this file.

## [2.33.0] - 2026-06-04

### Added
- **Recurring invoices** (`client.recurringInvoices.*` on `ScellClient` and
  `ScellApiClient`): manage subscription / retainer invoice **profiles** that
  the platform emits automatically on a cadence. CRUD (`list`, `get`, `create`,
  `update`, `delete`), per-profile `occurrences(id)` listing, lifecycle controls
  `pause(id)` / `activate(id)` / `cancel(id)`, and a manual `runNow(id)` that
  triggers an out-of-band emission (202 Accepted).
  - A profile carries the buyer (by `buyer_id` registry shortcut or inline
    `buyer_*` fields), the line items, and a `recurrence` config
    (`interval_unit` × `interval_count`, optional `day_of_month` / `day_of_week`).
    The schedule terminates per `end_mode` (`'never'` | `'on_date'` |
    `'after_occurrences'`), and each run emits an invoice as a draft or
    auto-sends it (`emission_mode`). Mutating a profile only affects future
    runs — already-emitted invoices stay immutable (ISCA).
  - New types: `RecurringInvoiceProfile`, `RecurringInvoiceOccurrence`,
    `CreateRecurringInvoiceInput`, `UpdateRecurringInvoiceInput`,
    `RecurrenceConfig`, `RecurrenceConfigInput`, `RecurringInvoiceLineInput`,
    `RecurringInvoiceTotals`, `InvoiceFormatLine`,
    `RecurringInvoiceListOptions`, `RecurringInvoiceOccurrenceListOptions`.
  - New enum unions: `RecurrenceIntervalUnit` (`'day'|'week'|'month'|'year'`),
    `RecurrenceEndMode` (`'never'|'on_date'|'after_occurrences'`),
    `RecurringEmissionMode` (`'draft'|'auto_send'`), `RecurringProfileStatus`
    (`'active'|'paused'|'completed'|'cancelled'`), `RecurringOccurrenceStatus`
    (`'pending'|'emitted'|'failed'|'skipped'`).

### Added (autoliquidation TVA intra-UE — biens & services)
- **`VatCategory`** : 4 nouvelles catégories alignées sur le backend —
  `INTRACOM_GOODS` (K, livraison intracommunautaire de biens, art. 262 ter I),
  `EXPORT` (G, exportation de biens hors UE, art. 262 I),
  `FRANCHISE_BASE` (E, franchise en base auto-entrepreneur, art. 293 B),
  `EXEMPT_TRAINING` (E, formation professionnelle continue, art. 261-4-4°a).
  `VAT_DEFAULT_RATES` et `VatEn16931Code` (+`K`/`G`) mis à jour ;
  `VatExemptionReason` étendu.
- **`InvoiceLineInput`** : nouveaux champs optionnels **top-level**
  `vat_category`, `supply_type` (`'goods'|'services'`), `place_of_supply`,
  `vat_override_reason` — pilotent la résolution TVA autoritaire serveur.
- **`InvoiceLineBuilder`** : setters `supplyType()` et `overrideReason()`.
  `build()` émet désormais ces champs en **top-level** (et non dans `metadata`) —
  c'est ce qui fait enfin émettre le code AE/K + la mention légale (auparavant
  `metadata.category` était ignoré par le backend → 0 % sans mention).
- **`VatCorrectionRequiredError`** (409, `VAT_CORRECTION_REQUIRED`) : levée quand
  un taux est incohérent avec le contexte sans `vat_override_reason`. Expose
  `corrections` (`VatCorrection[]` : taux/catégorie/mention suggérés par ligne)
  et `hint`. La facture n'est PAS persistée. Nouveau type exporté `VatCorrection`.

## [2.32.0] - 2026-06-04

### Changed (corrige le contrat de création d'avoir)
- **`CreateCreditNoteInput`** : ajout du champ **requis `type`** (`'partial' | 'total'`)
  et bascule de `items` vers `CreditNoteLineSelection[]`. Un avoir **partiel** exige
  désormais de **sélectionner des lignes de la facture d'origine** via `invoice_line_id` ;
  le prix unitaire et le **taux de TVA exact de chaque ligne** sont hérités (une facture
  peut mêler 20 % / 5,5 % / exonéré 0 % — chaque ligne est créditée correctement).
  Les anciens champs libres (`unit_price`/`tax_rate`/`total`) ne sont plus en entrée.
- **`creditNotes.remainingCreditable(invoiceId)`** désormais **typé** (`RemainingCreditable`) :
  retourne `items[]` avec `invoice_line_id`, `remaining_quantity`, `tax_rate`,
  `remaining_amount_ht` + `can_be_credited`. C'est l'étape de découverte avant un avoir partiel.
- Docstrings `create()` réécrites avec le workflow remainingCreditable → sélection de lignes.

### Added
- Types `CreditNoteLineSelection`, `RemainingCreditable`, `RemainingCreditableLine`.

## [2.31.0] - 2026-06-04

### Added
- **Pre-issuance threshold simulator** (`client.subTenants.simulateThresholds(id, { amount, category })`):
  projects the micro-entrepreneur threshold gauges AS IF a hypothetical invoice of
  `amount` (net/HT) were issued in `category`. The returned gauge `level`/`actionable`
  reflect the POST-invoice state, so an integration can warn the user BEFORE issuing
  whether it crosses a VAT-franchise or micro-regime threshold. Read-only (records
  nothing). New types `SimulateThresholdInput`, `ThresholdSimulationResponse`.

## [2.30.0] - 2026-06-04

### Added
- **Micro-entrepreneur threshold monitoring** (`client.subTenants.getThresholds(id)`):
  returns the French micro-entrepreneur threshold gauges (VAT franchise
  base/majored + micro-regime ceiling) with cumulative HT revenue per category,
  reached alert level (`warning_80` … `micro_ceiling_exceeded`) and a projected
  crossing date. Backed by dated fiscal rules (loi 2025-1044). Purely
  informational (`disclaimer` field, not tax advice). New types `ThresholdReport`,
  `ThresholdGauge`, `ThresholdsResponse`, `RevenueCategory`, `ThresholdKind`,
  `ThresholdAlertLevel`.
- **Declared fiscal status** (`client.subTenants.updateFiscalStatus(id, input)`):
  update a sub-tenant's regime / VAT status / activity type / activity start
  date / VAT number. Switching `vat_status` to `'liable'` flips Scell.io billing
  to charge VAT (subsequent invoices carry VAT, drop the art. 293 B franchise
  mention); a `vat_number` becomes required. New types `UpdateFiscalStatusInput`,
  `FiscalStatusResponse`, `FiscalRegime`, `VatStatus`, `ActivityType`.
- **Closing CSV download** (`client.fiscal.downloadClosing(closingId)`): download a
  daily/monthly/annual closing CSV (market format) as raw bytes, tenant-scoped.
- `client.fiscal.closings()` now accepts `closing_type` (`daily|monthly|annual`)
  and `sub_tenant_id` filters; each returned closing carries a `download_url`.
- `FiscalFecExportOptions.sub_tenant_id` to restrict a FEC export to a single
  sub-tenant's ISCA chain.

## [2.29.1] - 2026-06-04

### Fixed
- Docs: the country reference endpoint (`client.reference`) requires
  authentication (Sanctum or `sk_*`/`pk_*` API key) — corrected the JSDoc that
  wrongly described it as public. No behaviour change (the SDK always
  authenticates).

## [2.29.0] - 2026-06-04

### Added
- `ReferenceResource` (`client.reference`) exposing the public country company
  reference: `countries()` and `country(code)`. Backed by
  `GET /api/v1/reference/countries[/{code}]` (no auth). For each country it
  returns the VAT number (label/example/regex/VIES-checkable), the national
  registration identifier (label/scheme ISO 6523/example/regex/required-for-B2B)
  and the known legal forms — to build country-aware buyer/seller forms.
- Types `CountryReference`, `CountryVatInfo`, `CountryNationalIdInfo`, `LegalForm`.
- Wired on `ScellClient`, `ScellApiClient` and `ScellPublicClient`.

## [2.28.0] - 2026-06-03

Aligns the fiscal kill-switch wrappers with the **step-up** hardening shipped on
the API (June 2026). The kill-switch is the emergency halt of the fiscal system;
activating or deactivating it now requires the `fiscal:admin` scope (fail-closed),
a `reason` of **>= 20 characters**, and — in production — an out-of-band email
confirmation.

### Changed

- **`fiscal.killSwitchDeactivate()` now takes a required `input`** argument
  (`{ reason: string; confirmation_token?: string }`), mirroring
  `killSwitchActivate()`. The previous no-argument form is removed: against the
  current API it already failed (the server requires a `reason`). Pass the same
  step-up payload you pass to activation.
- `FiscalKillSwitchActivateInput` gains an optional `confirmation_token` field
  (out-of-band token received by email on the first production call).

### Added

- `FiscalKillSwitchDeactivateInput` type (`{ reason; confirmation_token? }`).

### Migration

```ts
// Before (2.27.x)
await scell.fiscal.killSwitchDeactivate();

// After (2.28.0)
await scell.fiscal.killSwitchDeactivate({
  reason: 'Incident resolu, reprise de la facturation normale',
  // confirmation_token: '...', // production only, received by email on the 1st call
});
```

## [2.27.1] - 2026-05-28

### Fixed
- `InvoiceStatus` aligné sur les **16 statuts canoniques** du backend
  (`invoices_status_check`). Retrait de `pending` et `cancelled`, jamais émis
  par le serveur (qui utilise `validating` / `received`).

## [2.27.0] - 2026-05-28

Adds per-signer targeting and multi-position support to electronic signature
requests. Each `signature_positions[]` entry can now reference a specific signer
via `signer_index`, and a single signer may be assigned multiple positions
(EU-SES capability). Fully backward compatible — the field is optional and a
position without `signer_index` is assigned to the first signer (index 0).

### Added

- **`SignaturePosition.signer_index`** — Optional `number` (0-based; `0` =
  first signer) on each `signature_positions[]` entry of
  `CreateSignatureInput`. When omitted, the position is assigned to the first
  signer. Repeating the same `signer_index` across multiple entries assigns
  several signature positions to the same signer (EU-SES multi-position
  capability). JSDoc and inline `create()` examples updated to demonstrate
  multi-signer / multi-position payloads.

## [2.26.0] - 2026-05-28

Adds the **Suppliers** registry, a mirror of the existing Buyers registry for
vendors. Suppliers are scoped per `(tenant, sub_tenant)` and reuse the same
identity + billing-address shape. Buyer-only concepts — shipping address,
dedicated billing email, and VAT-context resolution — are intentionally **not**
mirrored, as they do not apply to suppliers.

### Added

- **`SuppliersResource`** — Exposed as `suppliers` on both `ScellClient`
  (Bearer) and `ScellApiClient` (X-API-Key), mirroring `buyers`. Methods:
  - `list(params?)` — `GET /suppliers` (filters: `q`, `is_individual`,
    `per_page`, `page`), returns a `PaginatedResponse<Supplier>`.
  - `get(id)` — `GET /suppliers/{id}`.
  - `create(input)` — `POST /suppliers`.
  - `update(id, input)` — `PATCH /suppliers/{id}`.
  - `delete(id)` — `DELETE /suppliers/{id}`.

- **`Supplier`** — Read payload: `id`, `tenant_id`, `sub_tenant_id`, `name`,
  `is_individual`, `siret`, `vat_number`, `legal_id`, `legal_id_scheme`,
  `email`, `phone`, `country`, `billing_address`, `metadata`, `notes`,
  `created_at`, `updated_at`.

- **`CreateSupplierInput`** / **`UpdateSupplierInput`** (`Partial<CreateSupplierInput>`)
  / **`ListSuppliersInput`** — Mirror the buyer input shapes minus the
  buyer-only `shipping_address` and `billing_email` fields.

## [2.25.0] - 2026-05-28

A targeted release that closes the Factur-X BT-81 / BT-82 gap : the SDK now
exposes the `PaymentMeansCode` union (UN/ECE 4461 subset for B2B France) and
threads it through every `markPaid()` surface plus the `Invoice` / `CreditNote`
read payloads.

This is a **soft breaking change** for `invoices.markPaid()` and
`incomingInvoices.markPaid()` : `payment_means_code` is now required to mirror
the server `MarkPaidRequest::rules()` shipped on 2026-05-28. Calls that omit
it were already silently failing with HTTP 422 against the live API.

### Added

- **`PaymentMeansCode`** — Literal union mirroring `App\Enums\Invoice\PaymentMeansCode`:
  `'1' | '10' | '20' | '30' | '42' | '48' | '49' | '57' | '58' | '59' | '97'`.
  Drives the Factur-X BT-81 (`<ram:TypeCode>`) value emitted under
  `<ram:SpecifiedTradeSettlementPaymentMeans>`. Subset retained covers every
  payment means actually used in B2B France (cash, cheque, credit transfer,
  SEPA credit/direct debit, bank card, clearing, standing agreement).

- **`PAYMENT_MEANS_LABELS_FR`** — `Readonly<Record<PaymentMeansCode, string>>`
  frozen at runtime, mirrors `PaymentMeansCode::label()`. Ready to feed an
  Antd `<Select>` dashboard dropdown.

- **`PAYMENT_MEANS_LABELS_EN`** — Same shape, English labels
  (mirrors `PaymentMeansCode::labelEn()`).

- **`commonB2bFrance`** — `readonly PaymentMeansCode[]` frozen at runtime,
  mirrors `PaymentMeansCode::commonB2bFrance()`. Suggested ordering for the
  top of a payment-means dropdown : SEPA credit transfer, credit transfer,
  cheque, bank card, SEPA direct debit, cash.

- **`Invoice.payment_means_code?: PaymentMeansCode | null`** — Read-only field
  populated when `markPaid()` has been called. `null` on unpaid invoices or
  invoices marked paid prior to API 2026-05-28.

- **`Invoice.payment_means_text?: string | null`** — Optional free-text label
  (Factur-X BT-82, max 100 chars). Use to disambiguate a generic code, e.g.
  `'BNP Paribas'` for code `'58'`, `'Stripe checkout'` for code `'48'`.

- **`CreditNote.payment_means_code?: PaymentMeansCode | null`** + 
  **`CreditNote.payment_means_text?: string | null`** — Inherited from the
  source invoice when the credit note refunds a paid invoice.

### Changed

- **`MarkPaidInput.payment_means_code` is now required** (breaking on the
  TypeScript surface, soft on the runtime — calls already failed with
  HTTP 422 against the live API). Same goes for
  `MarkPaidIncomingInvoiceInput.payment_means_code`.

- **`InvoicesResource.markPaid()`** — Signature changed from
  `markPaid(id, data?: MarkPaidInput)` to
  `markPaid(invoiceId, opts: MarkPaidInput)` (second arg required).

- **`IncomingInvoicesResource.markPaid()` / `TenantIncomingInvoicesResource.markPaid()`** — 
  Same signature change. Resource lives on both `ScellApiClient.incomingInvoices`
  (alias) and `ScellTenantClient.incomingInvoices`.

### Migration

```typescript
// BEFORE (v2.24.0 and earlier)
await client.invoices.markPaid('invoice-uuid', {
  payment_reference: 'VIR-2026-0124',
  paid_at: '2026-01-24T10:30:00Z',
});

// AFTER (v2.25.0) — payment_means_code is required
await client.invoices.markPaid('invoice-uuid', {
  payment_means_code: '58',          // SEPA credit transfer (B2B FR default)
  payment_means_text: 'BNP Paribas', // optional Factur-X BT-82
  payment_reference: 'VIR-2026-0124',
  paid_at: '2026-01-24T10:30:00Z',
});
```

```typescript
// UI dropdown — use the frozen helpers
import {
  PAYMENT_MEANS_LABELS_FR,
  commonB2bFrance,
  type PaymentMeansCode,
} from '@scell/sdk';

const options = commonB2bFrance.map((code) => ({
  value: code,
  label: PAYMENT_MEANS_LABELS_FR[code],
}));
// → [{ value: '58', label: 'Virement SEPA' }, { value: '30', label: 'Virement' }, …]
```

### Backend reference

- Enum source : `backend/app/Enums/Invoice/PaymentMeansCode.php`
- Validation : `backend/app/Http/Requests/Invoice/MarkPaidRequest.php` (`payment_means_code` rule `required + Rule::enum(PaymentMeansCode::class)`)
- Backend commit : `a48c241` (Scell.io API 2026-05-28)

## [2.24.0] - 2026-05-28

A consolidation release that closes the long-standing gap between the source
tree and the public surface : the orphan `InvoiceTemplatesResource` is now
wired on both clients, the four removed `/balance/*` endpoints are flagged
`@deprecated` (no more silent 404s in user code), the three broken
`http.get`-based PDF download doublons on `FiscalResource` are pruned in
favour of the typed `getRaw` versions, and two new public surfaces (the
`GET /version` helper and the `CreditPacksResource`) land alongside.

Backward compat is preserved : every deprecation is JSDoc-only, no runtime
symbol is removed. v3.0.0 will physically delete the deprecated classes /
aliases.

### Added

- **`InvoiceTemplatesResource` wired on both clients** — `client.invoiceTemplates`
  is now available on `ScellClient` (Bearer) and `ScellApiClient` (X-API-Key).
  The resource itself shipped in v1.15.0 (`src/resources/invoice-templates.ts`)
  but had never been instantiated — every consumer that wanted to manage
  templates had to import the class directly and pass the internal `HttpClient`.
  Now :

  ```typescript
  import { ScellApiClient } from '@scell/sdk';

  const client = new ScellApiClient('sk_live_xxx');

  const { data } = await client.invoiceTemplates.list({ scope: 'tenant' });
  const created = await client.invoiceTemplates.create({
    scope: 'tenant',
    name: 'Mon template',
    primary_color: '#1A73E8',
    footer_text: 'Footer custom',
  });
  await client.invoiceTemplates.uploadLogo(created.id, logoBuffer, 'logo.png');
  await client.invoiceTemplates.markDefault(created.id);
  ```

  The seven existing methods (`list`, `get`, `create`, `update`, `delete`,
  `markDefault`, `uploadLogo`) and their input / output types
  (`InvoiceTemplate`, `CreateInvoiceTemplateInput`, `UpdateInvoiceTemplateInput`,
  `InvoiceTemplateListOptions`, `InvoiceTemplateScope`,
  `InvoiceTemplateLogoPosition`) are now re-exported from the package root.

- **`client.version()` helper** — Top-level method on both `ScellClient` and
  `ScellApiClient` that calls the public `GET /api/v1/version` endpoint
  (no authentication required) and returns the deployed API manifest :

  ```typescript
  const v = await client.version();
  console.log(`API ${v.version} (commit ${v.commit_short}, ${v.environment})`);
  ```

  The returned shape (new `ApiVersionInfo` type) carries `version`,
  `commit_sha`, `commit_short`, `committed_at`, `environment`,
  `php_version`, `laravel_version`, and `resolved_at`. Designed for drift
  detection (compare deployed `version` vs the SDK `package.json` version)
  and for health-check dashboards that surface build metadata.

- **`CreditPacksResource` (public read-only)** — Lists the prepaid credit
  bundles published in the Scell.io public catalogue
  (`GET /api/v1/packs/public`). Exposed on both clients as
  `client.creditPacks` :

  ```typescript
  const packs = await client.creditPacks.list();
  for (const pack of packs) {
    console.log(`${pack.name}: ${pack.amount_euros} EUR (+${pack.bonus_percent}%)`);
  }

  const pro = await client.creditPacks.get('pro');
  ```

  The new `CreditPack` interface carries the dual-aliased `*_eur` /
  `*_euros` fields exposed by the backend (the second variant is
  preferred in new code), the `bonus_percent` ratio, the
  `is_recommended` flag, and the `position` ordering key. Purchasing
  flow stays on `client.billing.checkoutPack(slug)` (Stripe checkout) —
  this resource only exposes the catalogue.

### Deprecated

- **`BalanceResource` (the whole class + all four methods)** — The legacy
  `/api/v1/balance/*` endpoints were removed server-side in Wave B3
  (refactor 2026-05-10). Any call against `client.balance.*` will now
  return HTTP 404 in production. The class is kept exported solely for
  backward compatibility and will be physically removed in v3.0.0. The
  JSDoc on each method now points to its replacement on
  `BillingResource` :

  | Old (404 in prod) | New |
  |---|---|
  | `client.balance.get()` | `client.billing.usage()` |
  | `client.balance.reload({...})` | `client.billing.topUp({...})` |
  | `client.balance.transactions({...})` | `client.billing.transactions({...})` |
  | `client.balance.updateSettings({...})` | Dashboard UI (no public REST equivalent) |

- **`TenantDirectInvoicesResource.validate()` and `.send()` aliases** —
  Both now carry `@deprecated` JSDoc pointing to the canonical `submit()`
  (which already exists and does exactly the same thing). The behaviour
  is unchanged ; the deprecation only signals that v3.0.0 will keep a
  single canonical name across `InvoicesResource.submit` and
  `TenantDirectInvoicesResource.submit`.

### Removed

- **3 broken doublons on `FiscalResource`** — `downloadMeasuresRegister()`,
  `downloadTechnicalDossier()`, and `downloadSelfAttestation()` used the
  generic `http.get` (which always parses JSON) for endpoints returning
  binary PDF — calling them would have either thrown a JSON parse error
  or returned a corrupted payload. They were superseded by the
  `isca*Download` family (`iscaMeasuresRegisterDownload`,
  `iscaTechnicalDossierDownload`, `iscaSelfAttestationDownload`) which
  uses `http.getRaw` and returns a proper `ArrayBuffer`. Since the
  doublons were never functional, no consumer can have a working
  integration relying on them — the removal is treated as a bugfix
  rather than a breaking change.

### Implementation notes

- 15 new tests across 3 files (`tests/invoice-templates.test.ts`,
  `tests/credit-packs.test.ts`, `tests/version.test.ts`) lock the
  wiring, the new endpoints, and the deprecation status of
  `BalanceResource` at unit-test level.
- The total test suite grows from 118 to 133 tests across 12 files,
  all passing on `vitest run`.
- The deprecated `BalanceResource` keeps all its existing types
  (`Balance`, `Transaction`, `ReloadBalanceInput`, etc.) — these
  types are still exported from the package root for any code that
  references them as data shapes.
- No runtime dependency added (preserves the zero-deps property).
- Bundle size : 145 KB → 160 KB CJS / 160 KB ESM (mostly new types
  + the two new resources + JSDoc-only deprecation comments).

## [2.23.0] - 2026-05-27

### Added

Centralised **enum surface** consolidating every `App\Enums\*` PHP enum / PostgreSQL `CHECK` constraint string union exposed by the Scell.io API. Ten brand-new literal unions land in this release, alongside four canonical aliases that mirror the backend naming. Every name is purely a type — zero runtime cost.

#### New literal unions

- **`InvoiceTemplateKind`** — `'invoice' | 'quote' | 'both'`. Mirrors `invoice_templates.kind` and unblocks typing the upcoming quote-aware template selector without resorting to `string`.
- **`QuoteAuditAction`** — Full 21-action union (`'created'`, `'updated'`, `'line_added'`, `'line_removed'`, `'line_updated'`, `'buyer_changed'`, `'sent'`, `'resent'`, `'viewed'`, `'signed'`, `'accepted'`, `'refused'`, `'cancelled'`, `'expired'`, `'converted'`, `'public_link_regenerated'`, `'public_link_revoked'`, `'duplicated'`, `'deposit_generated_from_schedule'`, `'schedule_updated'`, `'schedule_deleted'`). Replaces the legacy `string` typing on `QuoteAuditEntry.action` for downstream consumers that want exhaustive `switch` blocks. The audit log being append-only, this union is exhaustive for the current server release.
- **`CreditNoteStatus`** — `'draft' | 'sent'`. Tightens the direct-user `CreditNote.status` field, complementing the pre-existing `TenantCreditNoteStatus` (which also accepts `'cancelled'` on the multi-tenant ledger surface).
- **`CreditNoteType`** — `'partial' | 'total'`. Aligns the SDK with `credit_notes.type`. Issuing a `'total'` credit note transitions the source invoice to `'refunded'` server-side (see v2.22.0 refund workflow).
- **`SignatureArchiveStatus`** — `'pending' | 'archived' | 'glacier' | 'error'`. Lifecycle for the signed PDF + audit trail S3 archival pipeline (Object Lock COMPLIANCE, 11-year retention).
- **`InvoiceArchiveStatus`** — Same shape as `SignatureArchiveStatus`. Drives the 10-year statutory retention required by the ISCA autocertification.
- **`TenantKybStatus`** — `'pending' | 'documents_submitted' | 'under_review' | 'verified' | 'rejected'`. Reflects `tenants.kyb_status`. Until `'verified'`, the master tenant can only emit B2C invoices and B2B `paper`-mode invoices; reaching `'verified'` unlocks `electronic_peppol` B2B transmission.
- **`ApiKeyStatus`** — `'active' | 'revoked'`. Lifecycle of an API key.
- **`TenantInvoiceStatus`** — `'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'`. Distinct from the Factur-X `InvoiceStatus`; models the billing-side workflow for `tenant_invoices` (top-ups, pack purchases, monthly usage…). A negative-type assertion in the test suite guarantees the union never accidentally widens to include `'transmitted'` etc.
- **`OnboardingSessionStatus`** — Full 9-step funnel (`'initiated'`, `'siret_verified'`, `'vat_verified'`, `'documents_pending'`, `'documents_submitted'`, `'under_review'`, `'completed'`, `'failed'`, `'expired'`). Mirrors `onboarding_sessions.status` and is mostly consumed by `@scell/onboarding-widget` resume-tunnel logic. Distinct from `SubTenantOnboardingStatus` which tracks the resulting sub-tenant rather than the funnel itself.

#### Canonical aliases (re-exports of pre-existing unions)

These aliases expose existing unions under their PHP `App\Enums\*` canonical names. The shorter / domain-scoped names (`AmountType`, `ScheduleLineStatus`, `OnboardingStatus`, `TransactionType`) keep working — no breaking change.

- **`PaymentScheduleLineAmountType`** ≡ `AmountType` (`'percent' | 'amount'`).
- **`PaymentScheduleLineStatus`** ≡ `ScheduleLineStatus` (`'pending' | 'invoiced' | 'cancelled'`).
- **`SubTenantOnboardingStatus`** ≡ `OnboardingStatus` (`'pending_superpdp' | 'superpdp_redirected' | 'superpdp_authorized' | 'superpdp_pending_review' | 'active' | 'superpdp_failed'`).
- **`TenantTransactionType`** ≡ `TransactionType` (`'credit' | 'debit'`).

```typescript
import type {
  ApiKeyStatus,
  CreditNoteType,
  InvoiceTemplateKind,
  QuoteAuditAction,
  TenantInvoiceStatus,
} from '@scell/sdk';

function describeAction(action: QuoteAuditAction): string {
  switch (action) {
    case 'public_link_regenerated':
      return 'Public link rotated';
    case 'deposit_generated_from_schedule':
      return 'Deposit auto-generated by the payment schedule cron';
    // …compiler enforces exhaustiveness on the remaining 19 actions
  }
}
```

#### Implementation notes

- All new unions live in `src/types/enums.ts` and are re-exported from `src/types/index.ts` (no top-level `index.ts` changes — `export * from './types/index.js'` propagates them automatically).
- 19 type-driven tests in `tests/enums.test.ts` lock the literal sets at compile time. A drift on the server side would fail `tsc --noEmit` before any consumer notices.
- No interface widening: existing fields (`CreditNote.status: string`, `QuoteAuditEntry.action: string`) keep their loose typing to preserve backward compatibility. Consumers opting into the new unions cast explicitly: `entry.action as QuoteAuditAction`. A follow-up minor (2.24.0) may tighten the interfaces.

## [2.22.0] - 2026-05-27

### Added

- **`InvoiceStatus`** extended to mirror the new PostgreSQL `invoices_status_check` constraint on the Scell.io API (2026-05-27):
  - `'refunded'` — full refund: the cumulative amount of attached credit notes (status `sent` or beyond) covers `total_ttc` within 0.01 EUR tolerance.
  - `'partially_refunded'` — partial refund: at least one credit note is attached but the cumulative amount is strictly below `total_ttc`.
  - `'validating'`, `'converting'`, `'transmitting'`, `'received'`, `'completed'` — intermediate processing states already accepted by the server, now exposed in the union literal to remove `as InvoiceStatus` casts in user code.
  - Both refund transitions are driven server-side by `CreditNoteObserver::recomputeRefundStatus()` and do NOT bypass ISCA immutability (status is not part of `IMMUTABLE_FISCAL_FIELDS`).

- **`RefundStatus`** type — Union `'none' | 'partial' | 'full'` exposed from `@scell/sdk` and consumed by the new `Invoice.refund_status` field. Read-only aggregate computed server-side from the linked credit notes.

- **`Invoice.refund_status?: RefundStatus`** — Optional read-only field on the `Invoice` payload mirroring the new refund workflow. `undefined` on responses returned by API versions older than 2026-05-27.

- **`Invoice.total_refunded?: number`** — Optional read-only field carrying the cumulative `total_ttc` of attached credit notes. Defaults to `0` server-side when no credit note is attached. Equivalent in value to the pre-existing `credited_amount` but exposed under a refund-oriented name for the new `refunded` / `partially_refunded` workflow.

```typescript
const { data: invoice } = await client.invoices.get('019d…');

if (invoice.refund_status === 'full') {
  console.log(`Invoice refunded: ${invoice.total_refunded} ${invoice.currency}`);
} else if (invoice.status === 'partially_refunded') {
  // legacy fallback: read `credited_amount` if the server is older than 2026-05-27
  const refunded = invoice.total_refunded ?? invoice.credited_amount ?? 0;
  console.log(`Partial refund: ${refunded} / ${invoice.total_ttc}`);
}
```

## [2.21.0] - 2026-05-27

### Added

- **`CreateInvoiceInput.parent_quote_id?: UUID`** — Optional field on `invoices.create()` that links a freshly-created **standard** invoice to a source quote.
  - Backend endpoint: `POST /api/v1/invoices` (Scell.io API 2026-05-27).
  - Only accepted when `invoice_type` is `'standard'` (or omitted, which defaults to standard). For `'deposit'` / `'balance'` invoices, keep using `quotes.convertToDeposit()` / `quotes.convertToBalance()` — passing `parent_quote_id` with a non-standard `invoice_type` results in HTTP 422.
  - Anti-IDOR: the server returns HTTP 404 if the quote UUID does not belong to the caller's tenant (and matching sub-tenant scope when applicable).
  - The returned `Invoice` exposes the resolved `parent_quote_id` for read access (the field already existed for deposit/balance invoices; its JSDoc was updated to reflect that it is now also populated on quote-linked standard invoices).

```typescript
const { data: invoice } = await client.invoices.create({
  direction: 'outgoing',
  output_format: 'facturx',
  issue_date: '2026-05-27',
  // ...seller / buyer / lines
  parent_quote_id: '019d8a7b-0000-7000-a000-000000000001',
});
```

## [2.20.0] - 2026-05-26

### Added

- **`buyers.vatContext()`** — New method on `BuyersResource` that resolves the applicable TVA rate and EN16931 regime for a buyer + invoice line combination. Supports two overloads:
  - Mode 1: `vatContext(buyerId: string, line?, options?)` — registry lookup (recommended for registered buyers).
  - Mode 2: `vatContext(buyer: VatBuyerContext, line?, options?)` — inline buyer context (no registry required, useful for quotes or one-off invoices).
  - Backend endpoint: `POST /api/v1/tenant/buyers/vat-context`.
  - Covers FR→FR standard 20%, FR→EU B2B reverse-charge (art. 283-2 CGI, code AE), FR→non-EU out-of-scope (code O), and art. 259-A CGI override via `line.place_of_supply`.

- **`VatCategory`** type — Union of 8 TVA category identifiers: `'STANDARD'` | `'INTERMEDIATE'` | `'REDUCED'` | `'SUPER_REDUCED'` | `'ZERO_RATED'` | `'EXEMPT'` | `'REVERSE_CHARGE'` | `'OUT_OF_SCOPE'`.

- **`VAT_DEFAULT_RATES`** — `Record<VatCategory, number>` constant mapping each category to its default French TVA rate (%), e.g. `STANDARD → 20`, `REDUCED → 5.5`, `REVERSE_CHARGE → 0`.

- **`VatResolution`**, **`LineVatContext`**, **`VatBuyerContext`**, **`VatWarning`**, **`VatContextResponse`**, **`VatEn16931Code`**, **`VatExemptionReason`** types — all exported from `@scell/sdk`.

- **`createInvoiceLine()`** factory function + **`InvoiceLineBuilder`** class — Fluent builder for `InvoiceLineInput` objects with embedded VAT context. Auto-computes `total_ht`, `total_tax`, `total_ttc` from `quantity × unit_price` and `tax_rate` (rounded to 2 decimal places). Chainable setters: `description()`, `quantity()`, `unitPrice()`, `category()`, `taxRate()`, `placeOfSupply()`, `meta()`.

- **`InvoiceLineInputWithMeta`** type — Extended `InvoiceLineInput` with an optional `metadata` object carrying `category`, `exemption_reason`, `place_of_supply`, and arbitrary application fields.

## [2.19.0] - 2026-05-26

### Security
- Aligned with Scell.io server hardening (audit 2026-05-26):
  - Webhook secret is now only exposed in clear text ONCE — at creation (`webhooks.create()`) or regeneration (`webhooks.regenerateSecret()`). Subsequent `webhooks.get()` calls return a masked fingerprint + `secret_last4`. Store the secret immediately in a secret manager.
  - Webhook signature now uses `X-Scell-Signature: t={timestamp},v1=HMAC(timestamp.payload)` with a 5-minute anti-replay window. The `ScellWebhooks` helper already supports this format since v2.x.
  - Webhook URLs configured via `webhooks.create()` must use HTTPS and resolve to a public IP (server-side SSRF validation enforced).
- Added `secret_last4` field to the `Webhook` interface (always present, used for fingerprinting in dashboards).

## [2.18.0] - 2026-05-26

### Added

- `attachments[]` field on `CreateSignatureInput` for multi-document signatures (up to 10 PJs).
- `document_index` field on `SignaturePosition`, `MentionPosition`, `InitialsPosition` to target a specific document in a multi-doc bundle.
- New `SignatureAttachment` type.

## [2.17.1] - 2026-05-25

### Changed

- Documentation: rewording générique des mentions du fournisseur de signature partenaire (aucun changement de surface publique).

## [2.17.0] - 2026-05-25

### Added

- **`InitialsPosition`** — Nouvelle interface exportee representant la position
  d'un paraphe sur une page specifique du document. Champs :
  `page` (1-indexe), `x`, `y`, `unit` (`'percent'` | `'pixel'`),
  `page_width_px`, `page_height_px`, `font_size`, `color`, `bold`.
  Chaque entree peut surcharger les valeurs par defaut du bloc parent.

- **`InitialsBlock.positions?: InitialsPosition[]`** — Nouveau champ optionnel
  sur `InitialsBlock` permettant de definir une position differente par page.
  Si `positions` est fourni, il prend la priorite sur les champs legacy
  `position` + `pages` cote backend. Format recommande pour les documents
  multi-pages necessitant un placement precis des paraphes.

- **`InitialsBlock.bold?: boolean`** — Nouveau champ optionnel au niveau du bloc.
  Sert de valeur par defaut pour toutes les positions ; peut etre surcharge
  individuellement via `InitialsPosition.bold`.

### Details

Le format legacy (`position` + `pages`) reste entierement supporte et fonctionnel.
Aucun changement breaking. Les consommateurs existants n'ont rien a modifier.

Format recommande (v2.17.0) — une position differente par page :

```typescript
const initials: InitialsBlock = {
  enabled: true,
  mode: 'auto',
  source: 'signer_name',
  font_size: 10,
  color: '#1a1a1a',
  bold: false,
  positions: [
    { page: 1, x: 5,  y: 88, unit: 'percent' },
    { page: 2, x: 5,  y: 90, unit: 'percent', color: '#0055aa' },
    { page: 3, x: 92, y: 90, unit: 'percent', font_size: 8, bold: true },
  ],
};
```

Format legacy (toujours supporte) — une position commune :

```typescript
const initials: InitialsBlock = {
  enabled: true,
  pages: 'except_last',
  position: { x: 5, y: 90, unit: 'percent' },
  font_size: 10,
};
```

## [2.14.0] - 2026-05-24

### Added

- **`PaymentSummary.lines: PaymentScheduleLine[]`** — Le payload
  `GET /api/v1/quotes/{id}/payment-summary` expose désormais la liste
  complète des lignes d'échéancier en plus des agrégats
  (`schedule` / `invoiced` / `next_due` / `overdue` / `superpdp_status`).
  Permet d'afficher le tracker visuel complet (highlight de la
  prochaine échéance, grisé des passées, rouge des overdue) sans
  seconde requête `GET /payment-schedule`.

### Parité atteinte avec le backend

Toutes les méthodes Quote + PaymentSchedule sont couvertes :
`list/get/create/update/delete/send/cancel/duplicate/convertToDeposit/
convertToBalance/regeneratePublicLink/revokePublicLink/auditLog/pdf/preview`
+ `paymentSchedule.{list/set/patch/delete/summary/convertLine/presets}`.

## [2.13.1] - 2026-05-24

### Added

- **`Quote.callback_url`** + **`CreateQuoteInput.callback_url`** +
  **`UpdateQuoteInput.callback_url`** — Le tenant peut fournir une
  URL de callback à la création du devis. Après acceptation ou refus
  via le viewer public, le buyer est redirigé vers cette URL avec
  query string :
  `?status=signed|refused&quote_id=<UUID>&quote_number=<num>&reason=<txt>`
- Format : URL absolue HTTPS, max 500 caractères.

### Backend

- Migration `quotes.callback_url` + validation backend `nullable url max:500`.
- Viewer SPA redirige `window.location.href` après accept/refuse.

## [2.13.0] - 2026-05-21

### Added

- **`PaymentScheduleResource`** — installment plan management on quotes (`client.quotes.paymentSchedule.*`):
  - `get(quoteId)` — fetch all schedule lines with `meta` (total_count, pending_count, invoiced_count, total_percent)
  - `set(quoteId, lines)` — create or atomically replace the full schedule (POST); lines are `PaymentScheduleLineInput[]`
  - `patch(quoteId, changes)` — targeted modifications (`add`, `update`, `remove`) that preserve already-invoiced lines
  - `delete(quoteId)` — drop the entire schedule (only when quote is editable and no lines are invoiced)
  - `summary(quoteId)` — real-time `PaymentSummary` with `schedule`, `invoiced`, `next_due`, `overdue`, `superpdp_status` sections
  - `convertLine(quoteId, lineId, options?)` — generate a deposit invoice from a pending schedule line
  - `presets()` — catalog of server-defined preset templates (30/70, 50/50, 30/30/40, etc.) for quick schedule setup
- `PaymentScheduleResource` is exposed as `client.quotes.paymentSchedule` on both `ScellClient` and `ScellApiClient`
- **`BrandingResource`** — tenant and sub-tenant branding profile management (`client.branding.*`):
  - `tenant.get(requestOptions?)` — get the tenant branding profile (`Branding`) with `is_complete` and `missing_fields`
  - `tenant.update(data, requestOptions?)` — PATCH partial update; send `null` to clear a field
  - `tenant.uploadLogo(mimeType, requestOptions?)` — get a pre-signed S3 URL for logo upload
  - `subTenants.get(id, requestOptions?)` — get the branding profile for a specific sub-tenant
  - `subTenants.update(id, data, requestOptions?)` — PATCH update for a sub-tenant branding
  - `subTenants.uploadLogo(id, mimeType, requestOptions?)` — get a pre-signed S3 URL for sub-tenant logo upload
- `BrandingResource` is available on both `ScellClient` (`client.branding`) and `ScellApiClient` (`client.branding`)
- **`invoices.sendByEmail(invoiceId, options?, requestOptions?)`** — send an invoice by email to the buyer:
  - Optional `recipient_email` override (falls back to `buyer.billing_email` then `buyer.email`)
  - Optional `cc` array and `message` custom text
  - Returns `SendInvoiceByEmailResponse` with `sent_to`, `sent_at`, `message_id`, `cc`
- **`billing_email`** on `Buyer` / `CreateBuyerInput` — dedicated accounts-payable email (BT-49 extension)
- New types exported from `@scell/sdk`:
  - Payment schedule: `AmountType`, `ScheduleLineStatus`, `PaymentScheduleLine`, `PaymentScheduleLineInput`, `PaymentScheduleLineUpdateInput`, `PatchPaymentScheduleInput`, `ConvertScheduleLineInput`, `PaymentScheduleResponse`, `PaymentSummary`, `SchedulePreset`
  - Branding: `Branding`, `UpdateBrandingInput`, `BrandingLogoUploadUrlInput`, `BrandingLogoUploadUrlResponse`
  - Invoice email: `SendInvoiceByEmailInput`, `SendInvoiceByEmailResponse`
- **5 new typed error classes**:
  - `QuoteNotEditableError` (409) — quote accepted/locked; payment schedule cannot be modified
  - `ScheduleLineAlreadyInvoicedError` (422) — schedule line has already been converted to a deposit invoice
  - `ScheduleSumExceedsTotalError` (422) — schedule lines sum exceeds 100% (or fixed-amount total)
  - `BuyerHasNoEmailError` (422) — no email resolvable for the buyer; provide `recipient_email` or update buyer registry
  - `InvoiceBrandingIncompleteError` (422) — tenant/sub-tenant branding profile is incomplete
- New optional fields on `Invoice` (backward-compatible, all `| undefined`):
  - `schedule_line_id` — UUID of the payment schedule line this invoice was generated from
  - `sent_to_buyer_at` — ISO 8601 timestamp of last email delivery
  - `sent_to_buyer_email` — email address it was last sent to
  - `buyer_billing_email` — snapshot of the buyer's billing email at invoice creation time

### Compat

- Fully backward compatible. All new `Invoice` fields are optional. Existing code continues to work unmodified.
- `QuoteNotEditableError` requires a `case 409` handler — previously `409` would fall through to generic `ScellError`.
  Code catching `ScellError` (base class) is unaffected.
- `billing_email` is `null` on buyers that were created before v2.13.0 — always check for null.

---

## [2.12.0] - 2026-05-16

### Added

- **Signature blocks** — three new optional fields on `CreateSignatureInput` (all backward-compatible):
  - `initials_block?: InitialsBlock` — appose des paraphes (initiales) automatiquement sur les pages selectionnees.
    Supporte `mode: 'auto' | 'custom'`, `source: 'signer_name' | 'custom'`, `custom_text` (max 8 chars),
    `pages: 'all' | 'except_last' | number[]`, `position`, `font_size`, `color`.
  - `mentions?: Mention[]` — tableau de mentions legales a faire valider par les signataires.
    Chaque mention porte un `label`, `required`, `signer_index` (0-base, optionnel),
    `position: { page, x, y, w?, h?, unit? }`, `fallback_text`, `font_size`, `color`.
  - `date_block?: DateBlock` — appose la date du jour de signature.
    Supporte `format` (tokens `date-fns`), `timezone` (IANA), `position: { page: number | 'last', x, y, unit? }`,
    `font_size`, `color`.
- New types exported from `@scell/sdk`:
  `InitialsBlock`, `Mention`, `MentionPosition`, `DateBlock`, `DateBlockPosition`,
  `SignatureBlockPosition`, `SignatureBlockUnit`

### Added (continued — Quotes, from same minor version)

- **`QuotesResource`** — full quote lifecycle management:
  - `create(input)` — create a draft quote with lines, buyer, conditions
  - `list(params)` — paginated listing with filters (status, q, company_id, sub_tenant_id, environment, from/to)
  - `get(id)` — detail with lines and audit log
  - `update(id, input)` — partial update (PATCH, draft only)
  - `delete(id)` — soft delete (draft only)
  - `send(id, input)` — transition to `sent` + generate public link + optional email
  - `cancel(id)` — transition to `cancelled`
  - `duplicate(id)` — create a new draft from an existing quote
  - `convertToDeposit(id, input)` — generate a deposit (`invoice_type='deposit'`) invoice from a quote; supports `deposit_percent` or `deposit_amount`
  - `convertToBalance(id, input)` — generate a balance/solde (`invoice_type='balance'`) invoice deducting prior deposit
  - `auditLog(id)` — tamper-evident audit log with chain hash integrity flag
  - `regeneratePublicLink(id)` — rotate the public buyer link (old token immediately invalidated)
  - `revokePublicLink(id)` — revoke the public link without replacing it
  - `pdf(id)` — presigned PDF download URL (5 min TTL)
  - `preview(id)` — presigned HTML preview URL (5 min TTL)
- `QuotesResource` is available on both `ScellClient` (`client.quotes`) and `ScellApiClient` (`client.quotes`)
- New types exported from `@scell/sdk`:
  `Quote`, `QuoteLine`, `QuoteLineInput`, `QuoteSignature`, `QuoteAuditEntry`,
  `QuoteStatus`, `QuoteActorType`,
  `CreateQuoteInput`, `UpdateQuoteInput`, `SendQuoteInput`,
  `ConvertToDepositInput`, `ConvertToBalanceInput`,
  `AcceptQuoteInput`, `RefuseQuoteInput`,
  `QuoteListParams`, `QuoteListResponse`
- **`InvoiceType`** union type: `'standard' | 'deposit' | 'balance'` (exported)
- **`Invoice`** type extended with three new optional fields (backward compatible):
  - `invoice_type?: InvoiceType` — discriminant for quote-to-invoice conversion workflow
  - `parent_quote_id?: string` — UUID of the originating quote (deposit + balance invoices)
  - `parent_invoice_ids?: string[]` — UUIDs of deposit invoices deducted in balance invoices

### Compat

- Fully backward compatible. All new `Invoice` fields are optional — existing
  code hydrating invoices from API responses before v2.11.0 continues to work.
- `invoice_type` absent from pre-v2.11.0 payloads should be treated as `'standard'`.

## [2.10.0] - 2026-05-15

### Fixed (mirror of backend fix from the same day)

- `GET /tenant/fiscal/closings` returned `500 Server Error` whenever a
  daily closing had been anchored on OpenTimestamps. The backend
  serialised the raw `ots_proof` BYTEA column (non-UTF8 magic bytes from
  the `.ots` format) which crashed `json_encode()` with
  `InvalidArgumentException: Type is not supported`. The API now exposes
  the receipt encoded in base64; this SDK surfaces the new field.

### Added

- `FiscalClosing` type enriched with all backend fields:
  - `sub_tenant_id`, `first_sequence_number`, `last_sequence_number`
  - `closing_hash`, `previous_closing_hash`
  - `totals` (typed via the new `FiscalClosingTotals` interface) and
    `cumulative_totals`
  - `csv_path`, `csv_hash`
  - `ots_proof_base64`, `ots_status`, `ots_submitted_at`,
    `ots_bitcoin_confirmed_at`, `ots_calendars` (typed via the new
    `FiscalClosingOtsCalendar` interface)
  - `metadata`
- Two new exported types: `FiscalClosingTotals` and
  `FiscalClosingOtsCalendar`.

### Compat

- Fully backward compatible: every new field is optional. Pre-v2.10.0
  payloads (only `chain_hash`, `total_debit`, `total_credit`) keep
  hydrating correctly.

### Decoding the OpenTimestamps proof (Node)

```ts
import { writeFileSync } from 'node:fs';

const { data: closings } = await client.fiscal.closings();
for (const c of closings) {
  if (c.ots_proof_base64) {
    writeFileSync(`./${c.id}.ots`, Buffer.from(c.ots_proof_base64, 'base64'));
    // $ ots verify ./<id>.ots  to validate against Bitcoin
  }
}
```

## [2.9.0] - 2026-05-11

### Added

- **`SubTenantsResource.superpdpAuthorize(id)`** — generates a fresh
  SuperPDP OAuth authorize URL for a sub-tenant. Useful for
  partner-UI "Reconnect SuperPDP" buttons outside the refresh-status
  error path. Returns `{ authorize_url, state }`.
- **`SubTenantsResource.delete(id, { cascade: true })`** — opt-in
  cascade deletion. Without `cascade`, deleting a sub-tenant that still
  owns Companies fails with `DeleteSubTenantHasCompaniesError` (422,
  carries `companiesCount`). Retry with `{ cascade: true }` to delete
  the Companies along with the sub-tenant. The success response shape
  is now `{ message: string; companies_deleted: number }` (was
  `MessageResponse`).
- Three new error classes for the sub-tenant lifecycle :
  - `SubTenantMissingAccessTokenError` (422 `MISSING_ACCESS_TOKEN`,
    thrown by `refreshSuperPDPStatus`). Exposes `authorizeUrl` +
    `state`, ready to redirect into a fresh OAuth flow.
  - `DeleteSubTenantHasCompaniesError` (422 `SUB_TENANT_HAS_COMPANIES`).
    Exposes `companiesCount`.
  - `DeleteSubTenantFiscalLockedError` (422
    `SUB_TENANT_HAS_FISCAL_ENTRIES`). ISCA compliance — these
    sub-tenants are never deletable, no flag can override.
- New types : `SubTenantSuperPDPAuthorizeResponse`,
  `DeleteSubTenantOptions`, `DeleteSubTenantResponse`.

### Changed

- `SubTenantsResource.delete()` return type changed from
  `Promise<MessageResponse>` to `Promise<DeleteSubTenantResponse>`.
  Backward compatible at runtime — `{ message }` is still present,
  `companies_deleted` is the only new field.
- `SubTenantsResource.delete()` second argument now accepts
  `DeleteSubTenantOptions & RequestOptions`. The previous shape
  (`RequestOptions` only) remains valid — existing callers compile
  unchanged.

### Migration

```diff
- // delete a sub-tenant (legacy)
- await client.subTenants.delete(id);

+ // delete with retry pattern when sub-tenant owns Companies
+ try {
+   await client.subTenants.delete(id);
+ } catch (e) {
+   if (e instanceof DeleteSubTenantHasCompaniesError) {
+     const { companies_deleted } =
+       await client.subTenants.delete(id, { cascade: true });
+   } else if (e instanceof DeleteSubTenantFiscalLockedError) {
+     // ISCA-locked — soft archive instead.
+   }
+ }

+ // recover from MISSING_ACCESS_TOKEN on refreshSuperPDPStatus
+ try {
+   await client.subTenants.refreshSuperPDPStatus(id);
+ } catch (e) {
+   if (e instanceof SubTenantMissingAccessTokenError) {
+     window.location.assign(e.authorizeUrl);
+   }
+ }

+ // generate an authorize URL ad hoc
+ const { authorize_url, state } =
+   await client.subTenants.superpdpAuthorize(id);
```

## [2.8.0] - 2026-05-11

### Changed (BREAKING — ApiKey DTO shape)

- `ApiKey` no longer carries `company_id`. Backend refonte 2026-05-11
  removed the `api_keys.company_id` column: keys are now scoped to the
  tenant, not to a specific company. Existing `sk_*` keys keep working
  without change — only the DTO returned by the API and consumed by the
  SDK has been simplified.
- `CreateApiKeyInput` no longer accepts `company_id`. Calls that used
  to pass it will fail TypeScript compilation; remove the field.
- The `apiKeys.create()` signature is unchanged at runtime (still
  takes a `CreateApiKeyInput`), but its accepted shape is narrower.

### Added

- `CreateInvoiceInput.sub_tenant_id?`, `CreateSignatureInput.sub_tenant_id?`
  and `CreateCreditNoteInput.sub_tenant_id?` (optional `UUID`). Pass
  this field on write operations to target a specific sub-tenant under
  the authenticated tenant. Server-side scope is strictly enforced :
  - `401 TENANT_NOT_RESOLVED` if the `sk_*` key cannot be resolved to
    a tenant
  - `404 SUB_TENANT_NOT_FOUND` if the sub-tenant UUID does not belong
    to the authenticated tenant (anti-IDOR)
  - `422 NO_ISSUER_COMPANY` if the resolved sub-tenant (or tenant) has
    no Company that can issue the document
- Updated `apiKeys` JSDoc samples and `llms.txt` / `README.md` to drop
  every `company_id` mention on the API-key surface.

### Migration

```diff
- await client.apiKeys.create({
-   name: 'Production Integration',
-   company_id: 'company-uuid',
-   environment: 'production',
- });
+ await client.apiKeys.create({
+   name: 'Production Integration',
+   environment: 'production',
+ });

- // Target a sub-tenant via the API key (no longer possible)
+ await client.invoices.create({
+   sub_tenant_id: 'sub-tenant-uuid',
+   /* ...usual fields... */
+ });
```

## [2.7.1] - 2026-05-10

### Fixed
- `SubTenantsResource.getSuperPdpStatus`, `refreshSuperPdpStatus` and `getResumeUrl` were calling `/sub-tenants/{id}/...` instead of `/tenant/sub-tenants/{id}/...`. The legacy path resolved against the Sanctum dashboard block — 401 systematic for `sk_*` API keys. User workaround: direct HTTP call.


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
instead of the upstream signing provider directly. The wrapper page
embeds the EU-SES signing flow inside an iframe with default Scell.io
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

- `SignatureUIConfig` : 21 champs de personnalisation UI alignés sur la spec EU-SES certifiée (sidebar_*, header_*, footer_*, button_*, sign_button_*, hide_*, iframe_ancestors).
- `SignatureOptions` (nouveau) : signature_mode, signer_must_read, user_editable_data, timezone.
- `SignerInput.message` : message custom par signataire avec placeholder `{OTP}` (max 500 chars).
- `SignaturePosition.unit` : `'percent'` (defaut) ou `'pixel'`.
- `SignaturePosition.page_width_px` / `page_height_px` : dimensions de page optionnelles pour conversion percent->pixel precise (sinon detection auto via parser PDF cote serveur, fallback A4).
- Nouveaux exports de types : `SignatureMode`, `SignatureOptions`, `SignaturePositionUnit`, `SignerEditableData`.

### Removed (BREAKING vs interfaces internes)

- `SignatureUIConfig.logo_url` -> utiliser `sidebar_logo`.
- `SignatureUIConfig.primary_color` -> utiliser `sidebar_background_color`.
- `SignatureUIConfig.company_name` -> pas d'equivalent (non supporté par la spec EU-SES).

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

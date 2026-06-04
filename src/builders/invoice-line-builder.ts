/**
 * InvoiceLineBuilder — fluent builder for invoice lines with VAT context.
 *
 * Provides a type-safe, chainable API for constructing `InvoiceLineInput`
 * objects. The `category` setter maps {@link VatCategory} values to the correct
 * `tax_rate` and emits the **top-level** `vat_category` field consumed by the
 * server-side authoritative VAT resolution (which then derives the EN16931 duty
 * code and the legal mention, e.g. `AE` / `K`).
 *
 * > **Since v2.33.0** the VAT control fields are emitted at the **top level**
 * > (`vat_category`, `supply_type`, `place_of_supply`, `vat_override_reason`),
 * > not inside `metadata`. This is what makes the backend finally emit the
 * > reverse-charge / intra-EU-goods category + mention (previously a
 * > `metadata.category` was silently ignored → 0 % with no mention).
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { createInvoiceLine } from '@scell/sdk';
 *
 * // EU B2B services → reverse charge (AE, art. 283-2)
 * const svc = createInvoiceLine({ category: 'REVERSE_CHARGE' })
 *   .description('Conseil en stratégie')
 *   .unitPrice(1000)
 *   .supplyType('services')
 *   .build();
 * // → { …, tax_rate: 0, vat_category: 'REVERSE_CHARGE', supply_type: 'services' }
 *
 * // EU B2B goods → intra-community supply (K, art. 262 ter)
 * const goods = createInvoiceLine({ category: 'INTRACOM_GOODS' })
 *   .description('Matériel informatique')
 *   .unitPrice(200).quantity(10)
 *   .supplyType('goods')
 *   .build();
 * ```
 */

import type { InvoiceLineInput } from '../types/invoices.js';
import { VAT_DEFAULT_RATES, type VatCategory } from '../types/vat.js';

// ─── Extended InvoiceLineInput (back-compat alias) ──────────────────────────

/**
 * Back-compatible alias of {@link InvoiceLineInput}.
 *
 * Historically this interface carried the VAT context inside `metadata`. Since
 * v2.33.0 those fields live at the top level of {@link InvoiceLineInput} itself,
 * so this is now a plain alias kept for source compatibility.
 *
 * @deprecated Use {@link InvoiceLineInput} directly.
 */
export type InvoiceLineInputWithMeta = InvoiceLineInput;

// ─── Builder class ────────────────────────────────────────────────────────────

/**
 * Fluent builder for invoice lines with embedded VAT context.
 *
 * Instantiate via the {@link createInvoiceLine} factory function. All setters
 * are chainable and return `this`. Call {@link build} at the end.
 */
export class InvoiceLineBuilder {
  private _description = '';
  private _quantity = 1;
  private _unitPrice = 0;
  private _taxRate: number;
  private _category: VatCategory | undefined;
  private _supplyType: 'goods' | 'services' | undefined;
  private _placeOfSupply: string | undefined;
  private _overrideReason: string | undefined;
  private _extraMeta: Record<string, unknown> = {};

  /** @internal */
  constructor(category?: VatCategory) {
    if (category !== undefined) {
      this._category = category;
      this._taxRate = VAT_DEFAULT_RATES[category];
    } else {
      this._taxRate = VAT_DEFAULT_RATES['STANDARD'];
    }
  }

  // ─── Chainable setters ────────────────────────────────────────────────────

  /** Set the line item description (required, EN16931 / Factur-X BT-154). */
  description(value: string): this {
    this._description = value;
    return this;
  }

  /** Set the billed quantity (defaults to `1`). */
  quantity(value: number): this {
    this._quantity = value;
    return this;
  }

  /** Set the unit price before tax (HT). May be negative (credit lines). */
  unitPrice(value: number): this {
    this._unitPrice = value;
    return this;
  }

  /**
   * Set the VAT category, updating `tax_rate` from {@link VAT_DEFAULT_RATES}.
   * Emitted as the top-level `vat_category` field.
   */
  category(category: VatCategory): this {
    this._category = category;
    this._taxRate = VAT_DEFAULT_RATES[category];
    return this;
  }

  /**
   * Override the tax rate directly (in percent). Use this when you received a
   * resolved rate from {@link BuyersResource.vatContext}.
   */
  taxRate(rate: number): this {
    this._taxRate = rate;
    return this;
  }

  /**
   * Set the supply nature — DISCRIMINATES the intra-EU/export exemption:
   * goods → `INTRACOM_GOODS` (K) / `EXPORT` (G); services → `REVERSE_CHARGE`
   * (AE) / `OUT_OF_SCOPE` (O). Without it the server treats the line as a
   * service (dominant case). Emitted as top-level `supply_type`.
   */
  supplyType(value: 'goods' | 'services'): this {
    this._supplyType = value;
    return this;
  }

  /**
   * Set the ISO 3166-1 alpha-2 place of supply (art. 259-A CGI override).
   * Emitted as top-level `place_of_supply`.
   */
  placeOfSupply(countryCode: string): this {
    this._placeOfSupply = countryCode.toUpperCase();
    return this;
  }

  /**
   * Assume a divergent tax rate with a traceable reason. Avoids the
   * `409 VAT_CORRECTION_REQUIRED` response and records your choice for the
   * fiscal audit trail. Emitted as top-level `vat_override_reason` (max 500).
   */
  overrideReason(reason: string): this {
    this._overrideReason = reason.slice(0, 500);
    return this;
  }

  /**
   * Merge arbitrary key-value pairs into the line's `metadata` object
   * (purchase-order refs, cost-centre codes, etc.).
   */
  meta(data: Record<string, unknown>): this {
    this._extraMeta = { ...this._extraMeta, ...data };
    return this;
  }

  // ─── Terminal ─────────────────────────────────────────────────────────────

  /**
   * Build and return the final {@link InvoiceLineInput}. Totals are computed
   * from `quantity × unit_price` and `tax_rate`, rounded to 2 decimals.
   *
   * @throws {@link Error} When `description` has not been set.
   */
  build(): InvoiceLineInput {
    if (!this._description) {
      throw new Error('InvoiceLineBuilder: description() is required before build()');
    }

    const total_ht = round2(this._quantity * this._unitPrice);
    const total_tax = round2(total_ht * (this._taxRate / 100));
    const total_ttc = round2(total_ht + total_tax);

    const line: InvoiceLineInput = {
      description: this._description,
      quantity: this._quantity,
      unit_price: this._unitPrice,
      tax_rate: this._taxRate,
      total_ht,
      total_tax,
      total_ttc,
    };

    // Top-level VAT control fields (consumed by the server resolution).
    if (this._category !== undefined) line.vat_category = this._category;
    if (this._supplyType !== undefined) line.supply_type = this._supplyType;
    if (this._placeOfSupply !== undefined) line.place_of_supply = this._placeOfSupply;
    if (this._overrideReason !== undefined) line.vat_override_reason = this._overrideReason;

    if (Object.keys(this._extraMeta).length > 0) {
      line.metadata = { ...this._extraMeta };
    }

    return line;
  }
}

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Instantiate an {@link InvoiceLineBuilder} with an optional initial
 * {@link VatCategory}. Recommended entry point.
 *
 * @example
 * ```typescript
 * import { createInvoiceLine } from '@scell/sdk';
 *
 * const stdLine = createInvoiceLine()
 *   .description('Prestation de service')
 *   .unitPrice(500).quantity(2)
 *   .build();
 * ```
 */
export function createInvoiceLine(
  options: { category?: VatCategory } = {}
): InvoiceLineBuilder {
  return new InvoiceLineBuilder(options.category);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round a number to 2 decimal places. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

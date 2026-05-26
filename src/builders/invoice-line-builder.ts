/**
 * InvoiceLineBuilder — fluent builder for invoice lines with VAT context.
 *
 * Provides a type-safe, chainable API for constructing `InvoiceLineInput`
 * objects. The `category` setter automatically maps {@link VatCategory} values
 * to the correct `tax_rate` and enriches `metadata` with the category
 * identifier and exemption reason, ready for the Factur-X generator.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { createInvoiceLine, VatCategory } from '@scell/sdk';
 *
 * const line = createInvoiceLine({ category: 'REVERSE_CHARGE' })
 *   .description('Conseil en stratégie')
 *   .unitPrice(1000)
 *   .quantity(1)
 *   .placeOfSupply('FR')
 *   .build();
 * // → { description: 'Conseil…', unit_price: 1000, quantity: 1, tax_rate: 0,
 * //     total_ht: 1000, total_tax: 0, total_ttc: 1000,
 * //     metadata: { category: 'REVERSE_CHARGE', exemption_reason: 'reverse_charge', place_of_supply: 'FR' } }
 * ```
 */

import type { InvoiceLineInput } from '../types/invoices.js';
import {
  VAT_DEFAULT_RATES,
  type VatCategory,
  type VatExemptionReason,
} from '../types/vat.js';

// ─── Internal map: category → exemption_reason ──────────────────────────────

const EXEMPTION_REASON_MAP: Record<VatCategory, VatExemptionReason> = {
  STANDARD: null,
  INTERMEDIATE: null,
  REDUCED: null,
  SUPER_REDUCED: null,
  ZERO_RATED: null,
  EXEMPT: null,
  REVERSE_CHARGE: 'reverse_charge',
  OUT_OF_SCOPE: 'out_of_scope',
};

// ─── Extended InvoiceLineInput with optional metadata ────────────────────────

/**
 * Extended `InvoiceLineInput` that carries optional VAT metadata.
 *
 * The metadata fields are consumed by the Factur-X generator on the backend
 * to set the EN16931 duty category code (BT-151) and the exemption reason
 * text (BT-120).
 */
export interface InvoiceLineInputWithMeta extends InvoiceLineInput {
  /**
   * Optional VAT context metadata injected by {@link InvoiceLineBuilder}.
   * Transparently forwarded to the API as-is.
   */
  metadata?: {
    /** The {@link VatCategory} this line was built for. */
    category?: VatCategory;
    /**
     * Exemption reason code for EN16931 BT-120.
     * `null` when the standard rate applies.
     */
    exemption_reason?: VatExemptionReason;
    /**
     * ISO 3166-1 alpha-2 country where the service is delivered (BT-157).
     * Required for art. 259-A CGI overrides (B2C digital services).
     */
    place_of_supply?: string;
    /** Pass-through for any additional application-specific data. */
    [key: string]: unknown;
  };
}

// ─── Builder class ────────────────────────────────────────────────────────────

/**
 * Fluent builder for invoice lines with embedded VAT context.
 *
 * Instantiate via the {@link createInvoiceLine} factory function.
 *
 * All setters are chainable and return `this`. Call {@link build} at the end
 * to get the final `InvoiceLineInputWithMeta`.
 *
 * @example
 * ```typescript
 * const line = createInvoiceLine({ category: 'REDUCED' })
 *   .description('Livres')
 *   .unitPrice(50)
 *   .quantity(2)
 *   .build();
 * // tax_rate = 5.5, total_ht = 100, total_tax = 5.5, total_ttc = 105.5
 * ```
 */
export class InvoiceLineBuilder {
  private _description = '';
  private _quantity = 1;
  private _unitPrice = 0;
  private _taxRate: number;
  private _category: VatCategory | undefined;
  private _exemptionReason: VatExemptionReason | undefined;
  private _placeOfSupply: string | undefined;
  private _extraMeta: Record<string, unknown> = {};

  /** @internal */
  constructor(category?: VatCategory) {
    if (category !== undefined) {
      this._category = category;
      this._taxRate = VAT_DEFAULT_RATES[category];
      this._exemptionReason = EXEMPTION_REASON_MAP[category];
    } else {
      this._taxRate = VAT_DEFAULT_RATES['STANDARD'];
    }
  }

  // ─── Chainable setters ────────────────────────────────────────────────────

  /**
   * Set the line item description (required by EN16931 / Factur-X BT-154).
   *
   * @param value - Human-readable label for the line item.
   * @returns `this` for chaining.
   */
  description(value: string): this {
    this._description = value;
    return this;
  }

  /**
   * Set the billed quantity.
   *
   * @param value - Positive number. Defaults to `1`.
   * @returns `this` for chaining.
   */
  quantity(value: number): this {
    this._quantity = value;
    return this;
  }

  /**
   * Set the unit price before tax (HT).
   *
   * @param value - Price per unit. May be negative (credit lines).
   * @returns `this` for chaining.
   */
  unitPrice(value: number): this {
    this._unitPrice = value;
    return this;
  }

  /**
   * Override the VAT category, updating `tax_rate` and `exemption_reason`
   * automatically using {@link VAT_DEFAULT_RATES}.
   *
   * @param category - One of the {@link VatCategory} literals.
   * @returns `this` for chaining.
   *
   * @example
   * ```typescript
   * builder.category('REDUCED'); // sets tax_rate = 5.5
   * ```
   */
  category(category: VatCategory): this {
    this._category = category;
    this._taxRate = VAT_DEFAULT_RATES[category];
    this._exemptionReason = EXEMPTION_REASON_MAP[category];
    return this;
  }

  /**
   * Override the tax rate directly (in percent).
   *
   * Use this when you received a resolved rate from {@link BuyersResource.vatContext}
   * and want to apply it precisely without going through the default-rate map.
   *
   * @param rate - Tax rate in percent (e.g. `20`, `5.5`, `0`).
   * @returns `this` for chaining.
   *
   * @example
   * ```typescript
   * const r = await client.buyers.vatContext(buyerId);
   * const line = createInvoiceLine()
   *   .description('Service')
   *   .unitPrice(500)
   *   .taxRate(r.resolution.rate)  // apply exact resolved rate
   *   .build();
   * ```
   */
  taxRate(rate: number): this {
    this._taxRate = rate;
    return this;
  }

  /**
   * Set the ISO 3166-1 alpha-2 place of supply for this line.
   *
   * Stored in `metadata.place_of_supply` (Factur-X BT-157). Required when
   * triggering art. 259-A CGI override (B2C digital services delivered in
   * a specific EU member state).
   *
   * @param countryCode - ISO 3166-1 alpha-2 (e.g. `'FR'`, `'DE'`).
   * @returns `this` for chaining.
   */
  placeOfSupply(countryCode: string): this {
    this._placeOfSupply = countryCode;
    return this;
  }

  /**
   * Merge arbitrary key-value pairs into the line's `metadata` object.
   *
   * Useful for application-specific fields (purchase order references,
   * cost-centre codes, etc.) that pass through to the Factur-X generator.
   *
   * @param data - Plain object of additional metadata.
   * @returns `this` for chaining.
   */
  meta(data: Record<string, unknown>): this {
    this._extraMeta = { ...this._extraMeta, ...data };
    return this;
  }

  // ─── Terminal ─────────────────────────────────────────────────────────────

  /**
   * Build and return the final `InvoiceLineInputWithMeta`.
   *
   * Totals (`total_ht`, `total_tax`, `total_ttc`) are computed automatically
   * from `quantity × unit_price` and the current `tax_rate`, rounded to 2
   * decimal places to avoid floating-point artefacts.
   *
   * @returns The fully populated invoice line object.
   *
   * @throws {@link Error} When `description` has not been set.
   */
  build(): InvoiceLineInputWithMeta {
    if (!this._description) {
      throw new Error('InvoiceLineBuilder: description() is required before build()');
    }

    const total_ht = round2(this._quantity * this._unitPrice);
    const total_tax = round2(total_ht * (this._taxRate / 100));
    const total_ttc = round2(total_ht + total_tax);

    const hasVatMeta =
      this._category !== undefined ||
      this._placeOfSupply !== undefined ||
      Object.keys(this._extraMeta).length > 0;

    const metadata: InvoiceLineInputWithMeta['metadata'] | undefined = hasVatMeta
      ? {
          ...(this._category !== undefined ? { category: this._category } : {}),
          ...(this._exemptionReason !== undefined
            ? { exemption_reason: this._exemptionReason }
            : {}),
          ...(this._placeOfSupply !== undefined
            ? { place_of_supply: this._placeOfSupply }
            : {}),
          ...this._extraMeta,
        }
      : undefined;

    const line: InvoiceLineInputWithMeta = {
      description: this._description,
      quantity: this._quantity,
      unit_price: this._unitPrice,
      tax_rate: this._taxRate,
      total_ht,
      total_tax,
      total_ttc,
    };

    if (metadata !== undefined) {
      line.metadata = metadata;
    }

    return line;
  }
}

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Factory function that instantiates an {@link InvoiceLineBuilder} with an
 * optional initial {@link VatCategory}.
 *
 * This is the recommended entry point — it avoids having to import the class
 * directly and enables cleaner call-site code.
 *
 * @param options - Optional initial options. Currently only `category` is
 *   supported; other fields can be set via the builder's chainable setters.
 * @returns A new {@link InvoiceLineBuilder} instance.
 *
 * @example
 * ```typescript
 * import { createInvoiceLine } from '@scell/sdk';
 *
 * // B2B reverse-charge (EU buyer)
 * const line = createInvoiceLine({ category: 'REVERSE_CHARGE' })
 *   .description('Conseil en stratégie')
 *   .unitPrice(1000)
 *   .placeOfSupply('DE')
 *   .build();
 *
 * // Standard French TVA
 * const stdLine = createInvoiceLine()
 *   .description('Prestation de service')
 *   .unitPrice(500)
 *   .quantity(2)
 *   .build();
 * ```
 */
export function createInvoiceLine(
  options: { category?: VatCategory } = {}
): InvoiceLineBuilder {
  return new InvoiceLineBuilder(options.category);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round a number to 2 decimal places (banker's-rounding-safe for small values). */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

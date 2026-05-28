/**
 * Credit Pack types — prepaid credit bundles published in the public
 * catalogue and consumed via Stripe checkout.
 *
 * Backend source : `App\Models\CreditPack` exposed by
 * `GET /api/v1/packs/public`.
 *
 * @since 2.24.0
 */

import type { CurrencyCode, UUID } from './common.js';

/**
 * A credit pack entry (public read-only).
 *
 * Both `*_eur` and `*_euros` aliases exist for backward-compatibility :
 * the backend exposes the same value under two keys (the original
 * `amount_eur` / `credits_eur` legacy naming, and the more accurate
 * `amount_euros` / `credits_euros` introduced later). Prefer the
 * `*_euros` variants in new code.
 */
export interface CreditPack {
  /** Stable UUID of the pack. */
  id: UUID;
  /** URL-safe pack identifier (e.g. `"starter"`, `"pro"`, `"enterprise"`). */
  slug: string;
  /** Display name. */
  name: string;
  /** Long description (Markdown allowed). */
  description: string | null;
  /** Amount paid by the tenant (in EUR). */
  amount_eur: number;
  /** Alias of `amount_eur`. */
  amount_euros: number;
  /** Credits granted to the tenant balance (in EUR). */
  credits_eur: number;
  /** Alias of `credits_eur`. */
  credits_euros: number;
  /** Bonus credit (`credits_eur - amount_eur`) in EUR. */
  bonus_eur: number;
  /** Alias of `bonus_eur`. */
  bonus_euros: number;
  /** Bonus rate as a percentage (e.g. `5.0` = +5%). */
  bonus_percent: number;
  /** Currency code (currently always `"EUR"`). */
  currency: CurrencyCode;
  /** Display order in the public catalogue (lower = first). */
  position: number;
  /** `true` if this pack is the recommended one (typically `slug === 'pro'`). */
  is_recommended: boolean;
}

/**
 * Credit Packs resource (public read-only).
 *
 * Lists the prepaid credit bundles published in the Scell.io public
 * catalogue. Purchasing a pack goes through `client.billing.checkoutPack()`
 * (Stripe checkout) — this resource only exposes the catalogue itself.
 *
 * @since 2.24.0
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { CreditPack } from '../types/credit-packs.js';

interface PacksListResponse {
  data: CreditPack[];
}

export class CreditPacksResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List the active credit packs (public, no auth required).
   *
   * @returns Array of active credit packs sorted by `position` ascending.
   *
   * @example
   * ```typescript
   * const packs = await client.creditPacks.list();
   * for (const pack of packs) {
   *   console.log(`${pack.name}: ${pack.amount_euros} EUR (+${pack.bonus_percent}% bonus)`);
   * }
   * ```
   */
  async list(requestOptions?: RequestOptions): Promise<CreditPack[]> {
    const res = await this.http.get<PacksListResponse>(
      '/packs/public',
      undefined,
      requestOptions,
    );
    return res.data;
  }

  /**
   * Get a single credit pack by its slug.
   *
   * Performs a client-side filter on `list()` since the public endpoint
   * does not currently expose a per-pack route. Throws if the slug is
   * unknown or the pack is inactive.
   *
   * @param slug - Pack slug (e.g. `"starter"`, `"pro"`)
   * @returns The matching credit pack.
   * @throws Error when the slug does not match any active pack.
   *
   * @example
   * ```typescript
   * const pro = await client.creditPacks.get('pro');
   * console.log(`Recommended: ${pro.is_recommended}`);
   * ```
   */
  async get(slug: string, requestOptions?: RequestOptions): Promise<CreditPack> {
    const all = await this.list(requestOptions);
    const pack = all.find((p) => p.slug === slug);
    if (!pack) {
      throw new Error(`Credit pack "${slug}" not found in active catalogue`);
    }
    return pack;
  }
}

/**
 * Buyers Resource — scoped buyer registry (tenant + sub_tenant).
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  Buyer,
  CreateBuyerInput,
  ListBuyersInput,
  UpdateBuyerInput,
} from '../types/buyers.js';
import type {
  LineVatContext,
  VatBuyerContext,
  VatContextByBuyerPayload,
  VatContextByIdPayload,
  VatContextResponse,
} from '../types/vat.js';

/**
 * Buyers API resource.
 *
 * @example
 * ```typescript
 * // Register a buyer once, reuse it on multiple invoices
 * const buyer = await client.buyers.create({
 *   name: 'Acme SAS',
 *   country: 'FR',
 *   siret: '12345678901234',
 *   billing_address: {
 *     line1: '1 Rue de la Paix',
 *     postal_code: '75001',
 *     city: 'Paris',
 *     country: 'FR',
 *   },
 *   shipping_address: {
 *     name: 'Entrepot Lyon',
 *     line1: '12 Avenue Saxe',
 *     postal_code: '69003',
 *     city: 'Lyon',
 *     country: 'FR',
 *   },
 * });
 *
 * await client.invoices.create({
 *   buyer_id: buyer.id, // snapshot taken at issuance
 *   // ... rest of invoice
 * });
 * ```
 */
export class BuyersResource {
  constructor(private readonly http: HttpClient) {}

  async list(
    params?: ListBuyersInput,
    requestOptions?: RequestOptions
  ): Promise<PaginatedResponse<Buyer>> {
    return this.http.get<PaginatedResponse<Buyer>>(
      '/buyers',
      params as Record<string, string | number | boolean | undefined> | undefined,
      requestOptions
    );
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<Buyer> {
    const response = await this.http.get<SingleResponse<Buyer>>(
      `/buyers/${id}`,
      undefined,
      requestOptions
    );
    return response.data;
  }

  async create(
    input: CreateBuyerInput,
    requestOptions?: RequestOptions
  ): Promise<Buyer> {
    const response = await this.http.post<SingleResponse<Buyer>>(
      '/buyers',
      input,
      requestOptions
    );
    return response.data;
  }

  async update(
    id: string,
    input: UpdateBuyerInput,
    requestOptions?: RequestOptions
  ): Promise<Buyer> {
    const response = await this.http.patch<SingleResponse<Buyer>>(
      `/buyers/${id}`,
      input,
      requestOptions
    );
    return response.data;
  }

  async delete(id: string, requestOptions?: RequestOptions): Promise<void> {
    await this.http.delete(`/buyers/${id}`, requestOptions);
  }

  /**
   * Resolve the applicable VAT (TVA) rate and regime for a buyer + line
   * combination, following French CGI rules (EN16931 / B2B EU).
   *
   * Two overloads are provided:
   *
   * **Mode 1 — buyer from registry (recommended)**
   * Pass a `buyer_id` UUID. The server looks up the buyer in the tenant's
   * registry, applies territorial rules (France → EU reverse-charge, France →
   * outside-EU out-of-scope, art. 259-A CGI overrides…) and returns a fully
   * resolved `VatResolution`.
   *
   * **Mode 2 — inline buyer (no registry lookup)**
   * Pass a `VatBuyerContext` object directly. Useful during quote previews
   * or when the buyer hasn't been registered yet.
   *
   * @param buyerOrId - UUID of a registered buyer **or** an inline
   *   {@link VatBuyerContext} object describing the buyer's country and type.
   * @param line - Optional per-line hints (desired `category`, `place_of_supply`,
   *   `service_nature`) that refine the resolution for art. 259-A CGI cases.
   * @param requestOptions - Optional request-level overrides (timeout, signal…).
   * @returns The fully resolved {@link VatContextResponse} containing `resolution`
   *   (rate, category, EN16931 code, justification) and non-blocking `warnings`.
   *
   * @throws {@link ScellValidationError} When the payload is malformed.
   * @throws {@link ScellNotFoundError} When `buyer_id` does not belong to this
   *   tenant (anti-IDOR: the server returns 404, not 403).
   *
   * @example
   * ```typescript
   * // Mode 1 — registered buyer
   * const r1 = await client.buyers.vatContext(
   *   '019cb416-b6db-730c-b3a5-f8b7a4512eb1',
   *   { category: 'STANDARD' }
   * );
   * console.log(r1.resolution.rate);     // 0
   * console.log(r1.resolution.category); // 'REVERSE_CHARGE'
   *
   * // Mode 2 — inline buyer
   * const r2 = await client.buyers.vatContext(
   *   { country: 'DE', is_individual: false, vat_number: 'DE123456789', vat_number_valid: true },
   *   { category: 'STANDARD', place_of_supply: 'FR' }
   * );
   * console.log(r2.resolution.justification);
   * // "TVA française appliquée (art. 259 A CGI — lieu de taxation FR)"
   * ```
   */
  async vatContext(
    buyerOrId: string | VatBuyerContext,
    line?: LineVatContext,
    requestOptions?: RequestOptions
  ): Promise<VatContextResponse> {
    const payload: VatContextByIdPayload | VatContextByBuyerPayload =
      typeof buyerOrId === 'string'
        ? ({ buyer_id: buyerOrId, ...(line !== undefined ? { line } : {}) } satisfies VatContextByIdPayload)
        : ({ buyer: buyerOrId, ...(line !== undefined ? { line } : {}) } satisfies VatContextByBuyerPayload);

    return this.http.post<VatContextResponse>(
      '/tenant/buyers/vat-context',
      payload,
      requestOptions
    );
  }
}

/**
 * Country company reference resource (authenticated, read-only).
 *
 * Exposes, per country, the VAT number, the national company-registration
 * identifier (register + format) and the known legal forms, so integrations
 * can build a buyer/seller form that adapts labels, examples, format regex and
 * legal-form dropdowns to the selected country.
 *
 * Backed by `GET /api/v1/reference/countries[/{code}]`.
 *
 * @since 2.29.0
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { CountryReference } from '../types/reference.js';

interface CountriesListResponse {
  data: CountryReference[];
  meta?: { count: number };
}

interface CountryResponse {
  data: CountryReference;
}

export class ReferenceResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List every catalogued country with its company reference metadata.
   *
   * @example
   * ```typescript
   * const countries = await client.reference.countries();
   * const fr = countries.find((c) => c.code === 'FR');
   * console.log(fr?.national_id.label); // "SIREN / SIRET"
   * ```
   */
  async countries(requestOptions?: RequestOptions): Promise<CountryReference[]> {
    const res = await this.http.get<CountriesListResponse>(
      '/reference/countries',
      undefined,
      requestOptions,
    );
    return res.data;
  }

  /**
   * Fetch a single country by ISO 3166-1 alpha-2 code (e.g. `FR`, `DE`, `BE`).
   *
   * An unknown country returns `known=false` and a permissive format
   * (`national_id.regex=null`): the caller should then accept free input.
   *
   * @example
   * ```typescript
   * const de = await client.reference.country('DE');
   * for (const form of de.legal_forms) {
   *   console.log(form.code, form.label); // "GMBH", "GmbH"
   * }
   * ```
   */
  async country(
    code: string,
    requestOptions?: RequestOptions,
  ): Promise<CountryReference> {
    const res = await this.http.get<CountryResponse>(
      `/reference/countries/${code.toUpperCase()}`,
      undefined,
      requestOptions,
    );
    return res.data;
  }
}

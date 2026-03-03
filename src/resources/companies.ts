/**
 * Companies Resource
 *
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type {
  MessageResponse,
  MessageWithDataResponse,
  SingleResponse,
} from '../types/common.js';
import type {
  Company,
  CreateCompanyInput,
  KycInitiateResponse,
  KycStatusResponse,
  UpdateCompanyInput,
} from '../types/companies.js';

/**
 * Companies API resource
 *
 * @example
 * ```typescript
 * // Create a company
 * const company = await client.companies.create({
 *   name: 'My Company',
 *   siret: '12345678901234',
 *   address_line1: '1 Rue de la Paix',
 *   postal_code: '75001',
 *   city: 'Paris'
 * });
 *
 * // Initiate KYC
 * const kyc = await client.companies.initiateKyc(company.id);
 * console.log('KYC URL:', kyc.redirect_url);
 * ```
 */
export class CompaniesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all companies for the authenticated user
   *
   * @param requestOptions - Request options
   * @returns List of companies
   *
   * @example
   * ```typescript
   * const { data: companies } = await client.companies.list();
   * companies.forEach(c => console.log(c.name, c.status));
   * ```
   */
  async list(
    requestOptions?: RequestOptions
  ): Promise<{ data: Company[] }> {
    return this.http.get<{ data: Company[] }>(
      '/companies',
      undefined,
      requestOptions
    );
  }

  /**
   * Get a specific company by ID
   *
   * @param id - Company UUID
   * @param requestOptions - Request options
   * @returns Company details
   *
   * @example
   * ```typescript
   * const { data: company } = await client.companies.get('uuid');
   * console.log(company.name, company.siret);
   * ```
   */
  async get(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<SingleResponse<Company>> {
    return this.http.get<SingleResponse<Company>>(
      `/companies/${id}`,
      undefined,
      requestOptions
    );
  }

  /**
   * Create a new company
   *
   * @param input - Company creation data
   * @param requestOptions - Request options
   * @returns Created company
   *
   * @example
   * ```typescript
   * const { data: company } = await client.companies.create({
   *   name: 'Acme Corp',
   *   siret: '12345678901234',
   *   vat_number: 'FR12345678901',
   *   legal_form: 'SAS',
   *   address_line1: '123 Business Street',
   *   postal_code: '75001',
   *   city: 'Paris',
   *   country: 'FR',
   *   email: 'contact@acme.com',
   *   phone: '+33 1 23 45 67 89'
   * });
   * ```
   */
  async create(
    input: CreateCompanyInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Company>> {
    return this.http.post<MessageWithDataResponse<Company>>(
      '/companies',
      input,
      requestOptions
    );
  }

  /**
   * Update a company
   *
   * @param id - Company UUID
   * @param input - Fields to update
   * @param requestOptions - Request options
   * @returns Updated company
   *
   * @example
   * ```typescript
   * const { data: company } = await client.companies.update('uuid', {
   *   email: 'new-email@acme.com',
   *   phone: '+33 1 98 76 54 32'
   * });
   * ```
   */
  async update(
    id: string,
    input: UpdateCompanyInput,
    requestOptions?: RequestOptions
  ): Promise<MessageWithDataResponse<Company>> {
    return this.http.put<MessageWithDataResponse<Company>>(
      `/companies/${id}`,
      input,
      requestOptions
    );
  }

  /**
   * Delete a company
   *
   * @param id - Company UUID
   * @param requestOptions - Request options
   * @returns Deletion confirmation
   *
   * @example
   * ```typescript
   * await client.companies.delete('company-uuid');
   * ```
   */
  async delete(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `/companies/${id}`,
      requestOptions
    );
  }

  /**
   * Initiate KYC verification for a company
   *
   * @param id - Company UUID
   * @param requestOptions - Request options
   * @returns KYC reference and redirect URL
   *
   * @example
   * ```typescript
   * const { kyc_reference, redirect_url } = await client.companies.initiateKyc(
   *   'company-uuid'
   * );
   * // Redirect user to redirect_url for KYC verification
   * ```
   */
  async initiateKyc(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<KycInitiateResponse> {
    return this.http.post<KycInitiateResponse>(
      `/companies/${id}/kyc`,
      undefined,
      requestOptions
    );
  }

  /**
   * Get KYC verification status
   *
   * @param id - Company UUID
   * @param requestOptions - Request options
   * @returns Current KYC status
   *
   * @example
   * ```typescript
   * const status = await client.companies.kycStatus('company-uuid');
   * if (status.status === 'active') {
   *   console.log('KYC completed at:', status.kyc_completed_at);
   * }
   * ```
   */
  async kycStatus(
    id: string,
    requestOptions?: RequestOptions
  ): Promise<KycStatusResponse> {
    return this.http.get<KycStatusResponse>(
      `/companies/${id}/kyc/status`,
      undefined,
      requestOptions
    );
  }
}

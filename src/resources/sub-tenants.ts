/**
 * Sub-Tenants Resource
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { MessageResponse, PaginatedResponse, SingleResponse } from '../types/common.js';
import type {
  CreateSubTenantInput,
  SubTenant,
  SubTenantListOptions,
  UpdateSubTenantInput,
} from '../types/sub-tenants.js';

export class SubTenantsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options: SubTenantListOptions = {}, requestOptions?: RequestOptions): Promise<PaginatedResponse<SubTenant>> {
    return this.http.get<PaginatedResponse<SubTenant>>('/tenant/sub-tenants', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async create(input: CreateSubTenantInput, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.post<SingleResponse<SubTenant>>('/tenant/sub-tenants', input, requestOptions);
  }

  async get(id: string, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.get<SingleResponse<SubTenant>>(`/tenant/sub-tenants/${id}`, undefined, requestOptions);
  }

  async update(id: string, input: UpdateSubTenantInput, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.patch<SingleResponse<SubTenant>>(`/tenant/sub-tenants/${id}`, input, requestOptions);
  }

  async delete(id: string, requestOptions?: RequestOptions): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/tenant/sub-tenants/${id}`, requestOptions);
  }

  async findByExternalId(externalId: string, requestOptions?: RequestOptions): Promise<SingleResponse<SubTenant>> {
    return this.http.get<SingleResponse<SubTenant>>(`/tenant/sub-tenants/by-external-id/${externalId}`, undefined, requestOptions);
  }
}

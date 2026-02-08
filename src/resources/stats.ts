/**
 * Stats Resource
 * @packageDocumentation
 */

import type { HttpClient, RequestOptions } from '../client.js';
import type { SingleResponse } from '../types/common.js';
import type {
  StatsMonthly,
  StatsMonthlyOptions,
  StatsOverview,
  StatsOverviewOptions,
} from '../types/stats.js';

export class StatsResource {
  constructor(private readonly http: HttpClient) {}

  async overview(options: StatsOverviewOptions = {}, requestOptions?: RequestOptions): Promise<SingleResponse<StatsOverview>> {
    return this.http.get<SingleResponse<StatsOverview>>('/tenant/stats/overview', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async monthly(options: StatsMonthlyOptions = {}, requestOptions?: RequestOptions): Promise<SingleResponse<StatsMonthly[]>> {
    return this.http.get<SingleResponse<StatsMonthly[]>>('/tenant/stats/monthly', options as Record<string, string | number | boolean | undefined>, requestOptions);
  }

  async subTenantOverview(subTenantId: string, options: StatsOverviewOptions = {}, requestOptions?: RequestOptions): Promise<SingleResponse<StatsOverview>> {
    return this.http.get<SingleResponse<StatsOverview>>(`/tenant/sub-tenants/${subTenantId}/stats/overview`, options as Record<string, string | number | boolean | undefined>, requestOptions);
  }
}

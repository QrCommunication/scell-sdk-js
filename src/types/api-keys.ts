import type { DateTimeString, Environment, UUID } from './common.js';

/**
 * API Key entity
 *
 * Since 2026-05-11 backend refonte, API keys are scoped to the tenant
 * (not to a specific company). Use `sub_tenant_id` on individual
 * invoice / signature / credit-note payloads to target a sub-tenant.
 */
export interface ApiKey {
  id: UUID;
  name: string;
  key_prefix: string;
  environment: Environment;
  permissions: string[];
  rate_limit: number;
  last_used_at: DateTimeString | null;
  expires_at: DateTimeString | null;
  created_at: DateTimeString;
}

/**
 * API Key with full key (returned on creation only)
 */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

/**
 * API Key creation input
 *
 * Note: keys are tenant-scoped. There is no `company_id`. To target a
 * sub-tenant on a request, pass `sub_tenant_id` in the per-resource
 * payload (invoice, signature, credit note).
 */
export interface CreateApiKeyInput {
  name: string;
  environment: Environment;
  permissions?: string[] | undefined;
  expires_at?: DateTimeString | undefined;
}

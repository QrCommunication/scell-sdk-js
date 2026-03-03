import type { DateTimeString, Environment, UUID } from './common.js';

/**
 * API Key entity
 */
export interface ApiKey {
  id: UUID;
  name: string;
  company_id: UUID;
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
 */
export interface CreateApiKeyInput {
  name: string;
  company_id: UUID;
  environment: Environment;
  permissions?: string[] | undefined;
  expires_at?: DateTimeString | undefined;
}

/**
 * API version metadata exposed by `GET /api/v1/version`.
 *
 * Public endpoint — no authentication required. Used by SDK consumers
 * for drift detection (compare deployed `version` vs `package.json` SDK
 * version) and by monitoring tools that surface build metadata.
 *
 * Backend source : `App\Http\Controllers\Api\V1\VersionController::index`.
 *
 * @since 2.24.0
 */
export interface ApiVersionInfo {
  /** Semantic version of the deployed API (e.g. `"1.0.0"`). */
  version: string;
  /** Full git commit SHA (40 chars) or `null` if unavailable at build time. */
  commit_sha: string | null;
  /** Short git commit SHA (7 chars) or `null` if unavailable. */
  commit_short: string | null;
  /** ISO-8601 timestamp of the committed_at instant for the deployed SHA. */
  committed_at: string | null;
  /** Laravel environment name (`"production"` / `"sandbox"` / `"local"` ...). */
  environment: string;
  /** PHP runtime version (e.g. `"8.4.3"`). */
  php_version: string;
  /** Laravel framework version (e.g. `"13.0.0"`). */
  laravel_version: string;
  /** ISO-8601 timestamp of when the manifest was resolved server-side. */
  resolved_at: string;
}

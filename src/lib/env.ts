/**
 * Environment Variable Validation
 *
 * Validates and exposes environment variables with full type safety.
 * This file runs at build time and will fail if required variables are missing
 * or invalid, preventing deployment of misconfigured applications.
 *
 * @example
 * ```typescript
 * import { env } from "@/lib/env";
 *
 * // ✅ Type-safe, validated at build time
 * const appUrl = env.NEXT_PUBLIC_APP_URL;
 *
 * // ❌ TypeScript error if variable doesn't exist
 * const typo = env.NEXT_PUBLIC_APP_RUL;
 * ```
 *
 * Usage Guidelines:
 * - Always import from this file instead of accessing process.env directly
 * - NEXT_PUBLIC_* variables are available in both server and client components
 * - Non-public variables are only available in server-side code
 * - Validation runs once at startup/build time, not on every access
 */
import { z } from "zod";

/**
 * Environment variable schema definition
 * Add or modify variables here as your application grows
 */
const envSchema = z.object({
  // =============================================================================
  // App URL (per-environment — localhost in dev, real domain in prod)
  // =============================================================================
  NEXT_PUBLIC_APP_URL: z
    .url("App URL must be a valid URL")
    .default("http://localhost:3000"),

  // =============================================================================
  // Database
  // =============================================================================
  DATABASE_DIRECT_URL: z.url(
    "DATABASE_DIRECT_URL must be a valid connection string",
  ),
  DATABASE_POOLED_URL: z.url(
    "DATABASE_POOLED_URL must be a valid connection string",
  ),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/**
 * Validated environment variables (readonly)
 * Import this object throughout your application instead of process.env
 * Frozen at runtime to prevent accidental modifications
 */
export const env = Object.freeze(envSchema.parse(process.env));

/**
 * Type definition for environment variables
 * Useful for type hints and documentation
 */
export type Env = z.infer<typeof envSchema>;

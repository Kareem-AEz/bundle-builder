# Environment Variables Usage Guide

## 🎯 Overview

This project uses **type-safe, validated environment variables** via `src/lib/env.ts`. All environment variables are validated at build time using Zod, preventing misconfiguration errors in production.

---

## ✅ What Was Set Up

1. **`src/lib/env.ts`** - Environment validation with Zod
2. **Files using validated `env` instead of `process.env`**, including:
   - `src/lib/seo/metadata.ts`, `src/lib/seo/json-ld.ts`
   - `src/app/robots.ts`, `src/app/sitemap.ts`
   - `src/lib/response/utils/logger.ts`
   - `src/lib/response/errors/error-middleware.ts`
   - `src/lib/auth.ts`, `src/lib/prisma.ts`

---

## 🗄️ Database & Docker Variables

Not every variable in `.env.example` goes through `src/lib/env.ts`. Two
groups are handled differently:

### Validated by `env.ts` (Next.js + Prisma)

- `DATABASE_DIRECT_URL` - direct (non-pooled) connection. **Required by
  `prisma.config.ts`** for `db:migrate` and `db:generate`. Prisma Migrate
  cannot run against a pooler/PgBouncer URL.
- `DATABASE_POOLED_URL` - pooled connection used by the app at runtime
  (`src/lib/prisma.ts`). Locally this is the same as the direct URL; on a
  hosted provider (Neon, Supabase) it points at the pooler port (e.g.
  `6543`).

### Read directly by Docker Compose (not in `env.ts`)

`docker-compose.yaml` reads `.env` directly and has no access to
`src/lib/env.ts`, so these vars are **not** part of the Zod schema:

- `PROJECT_NAME` - container name prefix (`${PROJECT_NAME}-db`)
- `DB_PASSWORD`, `DB_NAME`, `DB_PORT` - local Postgres credentials/port,
  with defaults baked into `docker-compose.yaml` (`password`, `localdb`,
  `5432`)

`prisma.config.ts` lives at the **project root** (not under `prisma/`) -
Prisma v7 won't pick it up from a subdirectory.

---

## 📖 How to Use

### ❌ Before (Risky)

```typescript
// No validation, no type safety, runtime errors
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
```

### ✅ After (Safe)

```typescript
import { env } from "@/lib/env";

// Validated, type-safe, build-time errors
const appUrl = env.NEXT_PUBLIC_APP_URL;
```

---

## 🔧 Common Use Cases

### 1. In Server Components

```typescript
import { env } from "@/lib/env";

export default function HomePage() {
  // Access any environment variable
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  return <div>{appUrl}</div>;
}
```

### 2. In Client Components (Public vars only)

```typescript
"use client";
import { env } from "@/lib/env";

export default function Footer() {
  // Only NEXT_PUBLIC_* variables work in client components
  return <footer>{env.NEXT_PUBLIC_APP_URL}</footer>;
}
```

### 3. In API Routes

```typescript
import { env } from "@/lib/env";

export async function GET() {
  // Access server-only variables
  const dbUrl = env.DATABASE_POOLED_URL;
  const secret = env.BETTER_AUTH_SECRET;

  return Response.json({ ok: true });
}
```

### 4. In Server Actions

```typescript
"use server";
import { env } from "@/lib/env";

export async function createUser(data: FormData) {
  // Full access to all environment variables
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const dbUrl = env.DATABASE_POOLED_URL;
}
```

---

## 🚀 Adding New Environment Variables

### Step 1: Add to `.env.example`

Keep the comment on the line above the variable, not inline, so it survives
when the user fills in the value:

```bash
# Optional, describe what this key is for
MY_NEW_API_KEY=
```

### Step 2: Add to `src/lib/env.ts`

```typescript
const envSchema = z.object({
  // ... existing vars

  MY_NEW_API_KEY: z.string().min(1, "API key is required"),
  // or make it optional:
  MY_NEW_API_KEY: z.string().optional(),
});
```

### Step 3: Add to your local `.env`

```bash
MY_NEW_API_KEY=sk_test_abc123
```

### Step 4: Use it anywhere

```typescript
import { env } from "@/lib/env";

const apiKey = env.MY_NEW_API_KEY; // ✅ Type-safe and validated!
```

---

## ⚠️ Validation Examples

This project uses **Zod 4**, which exposes top-level validators (`z.url()`,
`z.email()`) instead of the older `z.string().url()` chained form.

### Required String

```typescript
BETTER_AUTH_SECRET: z.string().min(32, "Auth secret must be at least 32 characters");
```

### URL with Default

```typescript
NEXT_PUBLIC_APP_URL: z
  .url("App URL must be a valid URL")
  .default("http://localhost:3000");
```

### Optional URL

`emptyToUndefined` is a small helper in `env.ts` that coerces an empty
string (e.g. `BETTER_AUTH_URL=""` in `.env.example`) to `undefined` before
the URL check runs, so an unfilled optional var doesn't fail validation:

```typescript
BETTER_AUTH_URL: z.preprocess(
  emptyToUndefined,
  z.url("Better Auth URL must be a valid URL").optional(),
);
```

### Enum with Default

```typescript
LOG_LEVEL: z
  .enum(["debug", "info", "warn", "error"])
  .default("info")
  .describe("Logging level for application");
```

### Optional String

```typescript
NEXT_PUBLIC_GOOGLE_VERIFICATION: z.string().optional();
```

---

## 🐛 What Happens If Validation Fails?

### Development (`npm run dev`)

The app **won't start** and you'll see:

```
ZodError: [
  {
    "code": "too_small",
    "minimum": 32,
    "path": ["BETTER_AUTH_SECRET"],
    "message": "Auth secret must be at least 32 characters"
  }
]
```

### Build (`npm run build`)

The build **will fail** with the same error, preventing deployment of misconfigured apps.

---

## 💡 Best Practices

1. **Always import from `@/lib/env`**, never use `process.env` directly
2. **Prefix client-side variables** with `NEXT_PUBLIC_`
3. **Use `.optional()`** for non-critical variables
4. **Use `.default()`** for sensible fallbacks
5. **Never commit** `.env` files (only `.env.example`)
6. **Document variables** in `.env.example` with comments

---

## 📁 Environment Files

Next.js supports per-environment files (`.env.development`,
`.env.production`, `.env*.local`), but **this project uses a single
`.env`** for everything: Next.js runtime, Prisma, and Docker Compose all
read from it.

- Copy `.env.example` to `.env` and fill in your values.
- `.env` is gitignored, never commit it.
- Keep comments on the line above each variable in `.env.example` (not
  inline), so they survive when you fill in real values.

---

## 🔒 Security Notes

- **Never commit secrets** to git (`.env` is gitignored)
- **Server-only variables** (without `NEXT_PUBLIC_`) are never exposed to the client
- **Client variables** (`NEXT_PUBLIC_*`) are visible in browser, don't put secrets there
- **Use environment variables** in CI/CD (Vercel, Netlify, etc.) for production secrets

---

## ✅ Benefits

✓ **Type Safety** - Autocomplete and type checking for all env vars  
✓ **Build-time Validation** - Catch missing/invalid vars before deployment  
✓ **No More Fallbacks** - Explicit validation means no silent failures  
✓ **Single Source of Truth** - One place to manage all environment config  
✓ **Self-Documenting** - Schema shows exactly what's required and optional

---

## 🎓 Example: Full Workflow

```bash
# 1. Add to .env.example
echo "MY_API_KEY=" >> .env.example

# 2. Add to .env
echo "MY_API_KEY=secret123" >> .env
```

```typescript
// 3. Add to src/lib/env.ts
const envSchema = z.object({
  // ...existing vars
  MY_API_KEY: z.string().min(1, "API key required"),
});
```

```typescript
// 4. Use anywhere in your app
import { env } from "@/lib/env";
import logger from "@/lib/response/utils/logger";

logger.debug({ hasApiKey: Boolean(env.MY_API_KEY) }); // ✅ Validated and type-safe!
```

---

Made with ❤️ for type-safe Next.js development

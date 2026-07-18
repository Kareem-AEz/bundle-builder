# 0013 — SQLite as a local file, via the better-sqlite3 driver adapter

**Status:** Accepted · 2026-07-18

## Context

The repo was inherited from a boilerplate wired for Postgres: `schema.prisma` had
`provider = "postgresql"`, `prisma.ts` used `@prisma/adapter-pg` against a pooled URL, and
`env.ts` required two Postgres connection URLs as validated URLs. That last point is the sharp
one — `env.ts` parses at module load and throws on a missing/invalid URL, so a reviewer cloning
the repo could not run `npm run dev` at all without first standing up a database.

The brief's locked constraint is the opposite: a reviewer runs `install → migrate → seed → dev`
with **zero accounts, no Docker, no remote**. That means the database has to be a file in the repo
tree.

## Decision

**SQLite as a local file at `file:./prisma/dev.db`**, gitignored and rebuilt from migrations + seed.

- `schema.prisma` → `provider = "sqlite"`; migrations reset so `migration_lock.toml` is sqlite.
- `prisma.ts` → `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3` (Prisma's documented
  SQLite adapter; `@prisma/adapter-pg`, `pg`, `@types/pg` dropped).
- `env.ts` → the `DATABASE_DIRECT_URL` + `DATABASE_POOLED_URL` pair collapses to **one**
  `DATABASE_URL`, validated as `.startsWith("file:")` (a file path is not a URL, so `z.url()`
  rejects it) with a **default** so a fresh clone with no `.env` still parses. SQLite has no
  pooler, so a second URL would describe nothing.
- `prisma.config.ts` reads the same `DATABASE_URL` (it drove migrations off the old direct URL).

### Two traps, both hit and recorded so the next person doesn't

- The adapter's exported class is **`PrismaBetterSqlite3`**, not `PrismaBetterSQLite3` as Prisma's
  own docs show. Copying the doc snippet fails at runtime with "is not a constructor."
- `better-sqlite3` is a native module whose install script must be listed in `package.json`'s
  `allowScripts`, or the prebuilt binary silently never downloads and `db:seed` dies obscurely.

## Consequences

- The reviewer flow is **`install → db:migrate → db:seed → dev`**. Migrate is not optional:
  better-sqlite3 creates an empty file on connect, so seeding a cold clone without migrating first
  dies with `TableDoesNotExist`. `AGENTS.md` and the README say migrate-first for this reason.
- `db:migrate` is `prisma migrate dev` (the authoring verb). A reviewer applying committed
  migrations wants `migrate deploy`; the cold-rebuild was verified with `deploy`.
- The inherited Docker/Postgres blocks in `.env` are dead and were removed.
- This realises the "SQLite bonus" that [0005](0005-serializable-catalog.md) anticipated; the
  catalog was already serializable, so nothing in the data layer had to reshape.

# Better Next.js

> A production-ready Next.js boilerplate for developers who'd rather ship than configure.

Authentication wired, database ready, errors standardized, feature-based architecture that scales. No more spending the first week on setup.

**Next.js 16** · **React 19** · **TypeScript** · **Prisma** · **Better Auth** · **Tailwind CSS 4**

```bash
git clone https://github.com/Kareem-AEz/better-nextjs.git my-app
cd my-app
npm install
```

[Quick start](#quick-start) · [Features](#features) · [What's included](#whats-included) · [Project structure](#project-structure) · [Deployment](#deployment)

---

## Features

**Ship faster**

- **Authentication ready** - Better Auth wired with a Prisma adapter and the admin plugin, ready for email/password and OAuth providers
- **Database ready** - Prisma + PostgreSQL with type-safe queries and migrations
- **Forms handled** - `useActionSubmit` hook for validation, submission, and error handling
- **UI components** - shadcn/ui + Base UI + Tailwind CSS 4 for building interfaces fast

**Built to scale**

- **Feature-first architecture** - Organize by domain, not file type
- **Type-safe everything** - Strict TypeScript, validated env vars, type-safe DB queries
- **Unified response system** - Consistent error handling across Server Actions and API routes
- **Production patterns** - Structured logging, error middleware, proper separation of concerns

**Developer experience**

- **Zero config needed** - ESLint, Prettier, and import sorting configured out of the box
- **Smart defaults** - React 19 compiler, App Router, Server Components, modern best practices
- **AI-assisted commits** - Generate conventional commit messages with `npm run commit`
- **Clear documentation** - Guides for response system, environment setup, and SEO

---

## Why not something else?

Most boilerplates are either a blank Next.js install with a hopeful README, or a kitchen sink that's impressive until you try to change anything.

This one is intentionally in the middle: **opinionated where it saves time, flexible where you'll actually want control.**

- Start from feature work, not setup work - auth, DB, env validation, and response handling are done
- Architecture that scales without drama - features grouped by domain so changes stay localized
- Fewer production footguns - env variables validated early, errors have a consistent shape
- Looks good fast - modern UI stack so your MVP can look like a real product

---

## Maturity & Guarantees

### Production-hardened now

- Environment validation fails fast at startup (`src/lib/env.ts`)
- Unified response and error model is shared across actions and API routes (`src/lib/response`)
- Better Auth is wired with route handler and client SDK (`src/app/api/auth/[...auth]/route.ts`, `src/lib/auth-client.ts`)
- Prisma integration is ready with direct + pooled connection support

### Intentionally starter-level

- The `src/features/` directory is an empty scaffold; you add your own domain logic
- UI is a clean baseline so you can brand and reshape quickly
- Background jobs, queues, and observability pipelines are not pre-installed
- You own production policy choices (rate limits, RBAC depth, compliance controls)

---

## What's included

### Core stack

- **Next.js 16** - App Router, Server Components, Server Actions, React 19
- **TypeScript** - Strict mode with no escape hatches
- **Tailwind CSS 4** - Utility-first styling with modern features
- **shadcn/ui + Base UI** - Component library on top of unstyled headless primitives

### Authentication

- **Better Auth** configured and ready
- Route handler: `src/app/api/auth/[...auth]/route.ts`
- Client SDK: `src/lib/auth-client.ts`
- Prisma adapter + admin plugin configured; enable email/password, OAuth providers, and sessions as needed

### Database

- **Prisma** + **PostgreSQL** with type-safe queries
- Pooled connections via `DATABASE_POOLED_URL` (PgBouncer-ready)
- Migrations workflow included
- Type generation for full IntelliSense

### Developer experience

- **Type-safe env** - Zod validation in `src/lib/env.ts` (never touch `process.env` again)
- **Unified responses** - Consistent API/action responses via `src/lib/response`
- **Form system** - `useActionSubmit` hook integrates validation, actions, and error handling
- **Code quality** - ESLint + Prettier configured for clean, consistent code
- **AI commit helper** - `npm run commit` generates semantic commit messages

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL** (local or hosted)

### Installation

1. **Clone and install**

```bash
git clone https://github.com/Kareem-AEz/better-nextjs.git my-app
cd my-app
npm install
```

2. **Set up environment**

```bash
cp .env.example .env
```

Fill in the essentials in `.env`:

```bash
# Database (direct + pooled connections)
# Not using PgBouncer yet? Point both to the same database.
DATABASE_DIRECT_URL=postgresql://user:password@localhost:5432/mydb
DATABASE_POOLED_URL=postgresql://user:password@localhost:5432/mydb

# Better Auth
BETTER_AUTH_SECRET=your-secret-here   # generate: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000  # defaults to NEXT_PUBLIC_APP_URL if omitted

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Brand identity (name, description, social links) lives in `src/config/site.ts`, not in env vars - edit that file to re-skin the template.

3. **Initialize database and run**

```bash
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Apply migrations to the database
npm run dev            # Start dev server
```

4. **Open your app**

Visit `http://localhost:3000` - ready to build.

---

## Project structure

Organized by **business domain**, not file type. When you work on "checkout," you open one folder and stay in context.

```
src/
├── app/                       # Next.js App Router
│   ├── api/auth/[...auth]/   # Better Auth route handler
│   ├── robots.ts             # robots.txt
│   ├── sitemap.ts            # sitemap.xml
│   ├── manifest.ts           # Web app manifest
│   └── page.tsx              # Your pages
│
├── features/                  # Feature modules (domain-driven)
│   └── <feature-name>/
│       ├── actions/           # Server actions
│       ├── queries/           # Data-fetching
│       ├── services/          # Business logic
│       ├── db/                # Repository / data access
│       ├── types/             # Domain model (internal shapes)
│       ├── adapters/          # Shape mapping (external ↔ domain ↔ view)
│       ├── schemas/           # Zod validators
│       ├── utils/              # Feature-specific utilities
│       ├── hooks/              # Feature-specific hooks
│       └── components/         # Feature-specific components
│
├── components/                # Sorted by ownership, then role
│   ├── ui/                   # Vendored shadcn/Base UI (CLI-managed)
│   ├── primitives/           # Your portable, stateless building blocks
│   ├── effects/              # Your decorative visuals (e.g. grain)
│   ├── systems/              # Self-contained stateful subsystems (barrel + README)
│   └── layout/               # Shared site chrome (nav, footer)
│
└── lib/                       # Core utilities
    ├── env.ts                # Type-safe environment variables
    ├── prisma.ts             # Database client
    ├── auth.ts               # Auth configuration
    ├── auth-client.ts        # Client-side auth SDK
    ├── response/             # Response & error handling system
    └── hooks/                # Shared hooks (useActionSubmit)
```

---

## Common patterns

### Type-safe environment variables

Never touch `process.env` directly. Use the validated `env` object:

```ts
import { env } from "@/lib/env";

export const appUrl = env.NEXT_PUBLIC_APP_URL;
export const dbUrl = env.DATABASE_POOLED_URL;
```

All variables are validated with Zod at startup. A misconfigured env fails loudly at boot, not silently at runtime.

### Unified responses for Server Actions

```ts
import { formatError, formatSuccess } from "@/lib/response";
import prisma from "@/lib/prisma";

export async function createUserAction(formData: FormData) {
  try {
    const user = await prisma.user.create({
      data: { email: String(formData.get("email")) },
    });
    return formatSuccess(user);
  } catch (error) {
    return formatError(error);
  }
}
```

### Unified responses for API routes

```ts
import { formatApiError, formatApiSuccess } from "@/lib/response";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return formatApiSuccess(users);
  } catch (error) {
    return formatApiError(error);
  }
}
```

### Forms with validation and actions

```ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionSubmit } from "@/lib/hooks/forms";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export function MyForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", name: "" },
  });

  const { submit, isPending } = useActionSubmit({
    form,
    action: createUserAction,
    onSuccess: () => {
      toast.success("User created");
      form.reset();
    },
  });
  
  // Pass `submit` to your form's onSubmit handler
}
```

---

## Commands

| Command                | Description                            |
| ----------------------- | --------------------------------------- |
| `npm run dev`          | Start development server               |
| `npm run build`        | Build for production                   |
| `npm start`            | Run production build                   |
| `npm run lint:check`   | Lint code with ESLint                  |
| `npm run lint:fix`     | Lint and autofix with ESLint           |
| `npm run format:check` | Check formatting with Prettier         |
| `npm run format:fix`   | Format code with Prettier              |
| `npm run type:check`   | Type-check with TypeScript             |
| `npm run commit`       | AI-assisted conventional commit wizard |
| `npm run skills:sync`  | Sync skills to all agent tool dirs     |

### Database commands

| Command               | Description                          |
| ---------------------- | --------------------------------------- |
| `npm run db:generate` | Generate Prisma Client               |
| `npm run db:migrate`  | Create and apply a migration (dev)   |
| `npm run db:studio`   | Open Prisma Studio (database GUI)    |
| `npm run db:seed`     | Run the database seed script         |

---

## Deployment

### Vercel (recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables from `.env.example`
4. Deploy

Vercel will automatically detect Next.js, run `prisma generate` during build, and configure serverless functions.

### Other platforms

Works on any platform that supports Next.js:

- **Netlify** - Import and configure environment variables
- **Railway** - Connect repo and add Postgres addon
- **Render** - Web service + PostgreSQL database
- **Self-hosted** - Docker, PM2, or any Node.js runtime

**Requirements:** Node.js 20+, PostgreSQL, environment variables configured.

---

## Working with AI agents

This boilerplate is wired for AI pair programming across Claude Code, Cursor, and opencode. `AGENTS.md` is the single shared contract: it holds the architecture rules and hard constraints every agent must follow. Claude Code loads it through `CLAUDE.md`; Cursor and opencode read it directly. One source of truth, no per-tool drift.

Reusable skills (coding standards, doc generation, commit conventions) are vendored with [`npx skills`](https://github.com/vercel-labs/skills) and pinned in `skills-lock.json`. Skills are committed as real file copies in all three tool directories (`.agents/skills/`, `.claude/skills/`, `.cursor/skills/`), so they work immediately on clone with no extra steps.

To add or update skills, use the CLI and commit the results:

```bash
npx skills add <github-source>   # add a new skill
npx skills update                # update all skills to latest
```

Cursor's auto-attached editor rules (animation, Base UI, Motion) live in `.cursor/rules/`. The same guidance is baked into the `nextjs-standards` skill, so Claude Code and opencode get it without the rule files.

---

## Documentation

Detailed guides, co-located with the code they describe:

- **[Environment setup](docs/environment.md)** - Environment variable configuration and validation
- **[Response system](src/lib/response/README.md)** - Unified response/error layer overview
- **[Response internals](src/lib/response/docs/internals.md)** - How the unified response/error system works under the hood
- **[SEO overview](src/lib/seo/README.md)** - Metadata, JSON-LD, robots/sitemap, and OG images
- **[SEO configuration](src/lib/seo/docs/configuration.md)** - robots.txt, sitemap.xml, and search optimization
- **[Metadata guide](src/lib/seo/docs/metadata-guide.md)** - Meta tags, Open Graph, and Twitter Cards
- **[Open Graph images](src/lib/seo/docs/og-images.md)** - Static JPG default and dynamic image generation

---

## Contributing

Contributions welcome. Find a bug or have a feature request:

1. Check [existing issues](https://github.com/Kareem-AEz/better-nextjs/issues)
2. Open a new issue with details
3. Submit a PR - describe _what_ and _why_, not just _what changed_

---

## License

MIT - see [LICENSE](LICENSE) for details.

---

<div align="center">

[Star this repo](https://github.com/Kareem-AEz/better-nextjs) · [Report bug](https://github.com/Kareem-AEz/better-nextjs/issues) · [Request feature](https://github.com/Kareem-AEz/better-nextjs/issues/new)

Made with ☕ and a healthy distrust of `process.env`

</div>

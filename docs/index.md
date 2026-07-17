# Documentation

Documentation for Better Next.js boilerplate. Most guides now live next to the code they describe.

## Response System

Type-safe response handling for API routes and server actions.

- [Overview](../src/lib/response/README.md)
- [Internals](../src/lib/response/docs/internals.md) - How the system works and its design decisions

## SEO & Metadata

Search engine optimization and metadata management.

- [Overview](../src/lib/seo/README.md)
- [Configuration Guide](../src/lib/seo/docs/configuration.md) - robots.txt and sitemap.xml setup
- [Metadata Guide](../src/lib/seo/docs/metadata-guide.md) - Meta tags, Open Graph, and Twitter Cards
- [Open Graph Images](../src/lib/seo/docs/og-images.md) - Static JPG default and dynamic image generation

## Environment Variables

Environment configuration and validation.

- [Environment Guide](./environment.md) - Type-safe environment variables with Zod

## Security

Headers, CSP, and the threat models behind them. The live config is `next.config.ts`.

- [Security Headers](./security/headers.md) - Referrer-Policy, Permissions-Policy, X-Frame-Options, nosniff, and safe upload handling
- [XSS, Sessions & CSP](./security/xss-csp.md) - How XSS works, output encoding, cookie hardening, and the full CSP vocabulary + this boilerplate's decisions
- [CORS](./security/cors.md) - The browser-enforced model, the one real vulnerability, and Next.js implementation
- [Glossary](./security/glossary.md) - Short/long forms of the security terms used across these docs

## Components

Custom components and patterns.

- [Grain Effect](../src/components/effects/grain/README.md) - Film-like grain texture via SVG filters

---

**Navigate:** [Back to README](../README.md)

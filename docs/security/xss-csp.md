# XSS, Sessions & CSP

Covers how XSS actually works, how to defend against it, cookie/session
hardening, and the full CSP vocabulary plus the decision this boilerplate made
in `next.config.ts`.

---

## 1. XSS — the mental model

> Storage is inert. The bomb goes off at **render time**, in whoever's browser
> displays the data.

A stored-XSS chain (e.g. via a contact form → admin dashboard):

1. Attacker submits `<script>…</script>` or `<img onerror=…>`.
2. It sits in the DB raw. **Databases never execute anything — this is fine.**
3. Danger hits when something **renders that field as HTML** → script runs in
   the viewer's authenticated session → account takeover / session riding.

### The execution rules

Next SSRs even `"use client"` components. `dangerouslySetInnerHTML` emits
`__html` **verbatim into the server HTML**, which the browser runs through its
normal document parser on first load. Two paths, different rules:

| Vector                                        | SSR first load (document parse)            | Client-only render (innerHTML) |
| --------------------------------------------- | ------------------------------------------ | ------------------------------ |
| `<script>` via `dangerouslySetInnerHTML`      | **executes** 💀                            | inert                          |
| `<img onerror>` via `dangerouslySetInnerHTML` | **executes** 💀                            | **executes** 💀                |
| `{value}` in JSX (curly braces)               | escaped → safe ✅                          | escaped → safe ✅              |
| `<a href={userValue}>`                        | `javascript:` URL → React 19 **throws** ⛔ | same                           |

- **`innerHTML` never runs `<script>`** on a _live_ document — but the **SSR
  document parse does**. So `<script>` is dangerous on first load, inert on
  client re-render.
- **`<img onerror>` runs on both paths.** No `<script>` needed — an event
  handler attribute is enough.
- **JSX `{value}` is always escaped** (text and attributes). Safe by default.
- React 19 / Next 16 now **throws** on `javascript:` URLs (used to only warn).

### Defense layers (in priority order)

| Layer                                  | Role                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Input validation (Zod)                 | Reject malformed data. **Not** an XSS defense.                                                                                                              |
| Store raw                              | DB is inert; keep original fidelity.                                                                                                                        |
| **Output = escape by default**         | **PRIMARY defense.** Render user data as text (`{value}`). Only `dangerouslySetInnerHTML` for fields meant to be HTML, and only after `DOMPurify.sanitize`. |
| `HttpOnly`/`Secure`/`SameSite` cookies | Limit what a successful XSS can steal.                                                                                                                      |
| CSP                                    | Last-line backstop; caps blast radius.                                                                                                                      |

> **The #1 rule:** for a contact message / email / name, the answer to "do I
> need to render this as HTML?" is **no**. Render it as text and stored XSS
> dies for free. DOMPurify is only for _intentional_ rich text.

### DOMPurify gotcha

`dompurify` needs a DOM. In SSR there's no `window`, so the default export's
`.sanitize` is `undefined` → `"sanitize is not a function"`. Fix: use
[`isomorphic-dompurify`](https://github.com/kkomelin/isomorphic-dompurify)
(drop-in, jsdom on the server) or sanitize inside a client-only `useEffect`.
DOMPurify only cleans **HTML strings** — it does nothing for `href`/`src`
attribute bindings.

---

## 2. Sessions & cookies

> `HttpOnly` stops token **theft**, not session **riding**.

- **`HttpOnly`** → JS can't read the cookie (`document.cookie` won't see it).
  XSS can't copy the token out. But the script runs in the user's origin and the
  browser **auto-attaches the cookie** to same-origin requests, so XSS can still
  act _as_ the user (create/delete, add an admin, exfiltrate page data).
- **`Secure`** → only sent over HTTPS. Always set it.
- **`SameSite`** → `Lax` blocks the cookie on cross-site POSTs (kills basic
  CSRF) but still sends it on top-level cross-site **GET** navigations → keep
  mutations off GET. `Strict` is safer for an admin-only session.
- **JWT body is just base64** — readable if leaked (not forgeable). Don't put
  secrets in it.

This boilerplate uses **Better Auth**, which sets `HttpOnly` + `Secure` +
`SameSite` session cookies for you. Confirm `Secure` and the `SameSite` value
match your deployment when you customize auth.

---

## 3. CSP — Content Security Policy

> A browser-enforced allowlist sent as an HTTP response header. It assumes your
> other defenses fail and limits the damage. **Primary defense is still output
> encoding; CSP is the net.**

### Values (the vocabulary after a directive — keywords must be quoted)

| Value                           | Meaning                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `'none'`                        | Block everything.                                                                                      |
| `'self'`                        | Same origin only (exact scheme + host + port; **not** subdomains).                                     |
| `'unsafe-inline'`               | Allow inline `<script>`/`<style>`/`onclick=`. Big hole.                                                |
| `'unsafe-eval'`                 | Allow `eval()`/`new Function()`. (dev-only here.)                                                      |
| `'nonce-abc123'`                | Allow inline code carrying that nonce (strict + dynamic).                                              |
| `'sha256-…'`                    | Allow inline code matching that hash (breaks when code changes).                                       |
| `'strict-dynamic'`              | Trust what a nonce/hash-trusted script loads; **ignores** `'self'`/host/`'unsafe-inline'` for scripts. |
| `https:` / `data:` / `blob:`    | Scheme sources. `data:` in `script-src` is dangerous.                                                  |
| `example.com` / `*.example.com` | Host / subdomain wildcard.                                                                             |
| `*`                             | Any origin — but **not** `data:`/`blob:`/inline.                                                       |

Traps: `*` doesn't cover `data:`/`blob:`/inline. `'unsafe-inline'` is **silently
ignored** if a nonce or hash is also present.

### Directives that matter (fall back to `default-src` unless noted)

| Directive                         | Governs                               | Sane value                         |
| --------------------------------- | ------------------------------------- | ---------------------------------- |
| `default-src`                     | fallback for all fetch directives     | `'self'`                           |
| `script-src`                      | JS                                    | `'self'` (+`'unsafe-inline'` here) |
| `style-src`                       | CSS                                   | `'self' 'unsafe-inline'`           |
| `img-src`                         | images                                | `'self' blob: data:`               |
| `font-src`                        | fonts                                 | `'self' data:`                     |
| `connect-src`                     | fetch/XHR/WebSocket/beacon            | `'self'` (+ API origins)           |
| `object-src`                      | `<object>`/`<embed>`                  | `'none'`                           |
| `frame-src`                       | `<iframe>` _sources_                  | `'none'` / embed origin            |
| `base-uri` _(no fallback)_        | `<base href>` injection               | `'self'`                           |
| `form-action` _(no fallback)_     | where `<form>` POSTs                  | `'self'` (+ target)                |
| `frame-ancestors` _(no fallback)_ | who can iframe **you** (clickjacking) | `'none'`                           |
| `upgrade-insecure-requests`       | rewrite http→https subresources       | (flag)                             |

Ignore the long tail (`child-src`, `prefetch-src`, `script-src-elem/attr`,
`block-all-mixed-content`, …) — deprecated, niche, or auto-covered.

### The 80/20 rule

```
default-src 'self';                  ← one fallback for everything
script-src  'self' 'unsafe-inline';  ← (static tradeoff, see §4)
style-src   'self' 'unsafe-inline';
img-src     'self' blob: data:;
font-src    'self' data:;
connect-src 'self';                  ← add API origins as needed
object-src      'none';   ┐
base-uri        'self';   │ the 4 "free" locks — no app needs these open
frame-ancestors 'none';   │
form-action     'self';   ┘
upgrade-insecure-requests;
```

**Decision procedure for any new external dependency** (let the console error
tell you which directive complained):

1. External script (CDN)? → add origin to `script-src`.
2. External API call? → add to `connect-src`.
3. Images from another host (S3/R2/CDN)? → add to `img-src`.
4. Embedding YouTube/Vimeo? → add to `frame-src`.
5. Everything else stays `'self'` / `'none'`.

### Rollout

Ship as **`Content-Security-Policy-Report-Only`** first → build → click every
route → check console for violations → if clean, rename to
**`Content-Security-Policy`** to enforce. (`upgrade-insecure-requests` is a no-op
in report-only mode — that warning is expected.)

This boilerplate already ships it **enforced** because it loads nothing external
out of the box. The moment you add an external origin, switch to report-only,
re-walk the routes, then flip back. See the comment in `next.config.ts`.

---

## 4. This boilerplate's decisions

- **Static is the default posture.** Nonce-based CSP forces dynamic rendering
  (kills static / ISR / PPR / CDN cache) → rejected.
- **Strict `script-src` without `'unsafe-inline'` is impossible while static.**
  `script-src 'self'` alone blocks the inline scripts that run before paint
  (next-themes, the splash head script) and Next's hydration payload
  (`self.__next_f.push`). The only stricter path is nonces, which force dynamic
  rendering — rejected above.
- **Therefore `script-src 'self' 'unsafe-inline'`** is the owned tradeoff: CSP no
  longer blocks inline-injection XSS → the **primary defense stays output
  encoding**. `script-src 'self'` still blocks _external_ malicious scripts; the
  other directives still give clickjacking + exfiltration + injection hardening.
- **SRI (`experimental.sri`) is intentionally NOT enabled — do NOT add it on
  Turbopack.** It generates `integrity` hashes against artifacts that don't match
  what Turbopack serves, so the browser blocks every chunk ("Failed to find a
  valid digest in the integrity attribute") and the site won't boot. SRI predates
  Turbopack builds (webpack-era). `script-src 'self'` already covers SRI's
  overlapping job (blocking tampered/external scripts), so the loss is nil.
- **Live config:** `next.config.ts` (`cspHeader` + `headers()`).

### Phase 2 (when you care a lot)

`require-trusted-types-for 'script'` + `trusted-types` force every dangerous DOM
sink (`innerHTML`, `eval`) to take a _typed trusted_ value, so a stray
`dangerouslySetInnerHTML` with raw user data throws instead of injecting. The
structural fix for DOM XSS — but needs app-code changes, not just a header.

---

## TL;DR

1. **Render untrusted data as text.** This is 90% of XSS defense.
2. Only `dangerouslySetInnerHTML` after `DOMPurify.sanitize`, and only for
   intentional HTML.
3. Cookies: `HttpOnly` + `Secure` + `SameSite`; mutations off GET.
4. CSP: `default-src 'self'`, lock the 4 free doors, open one line per real
   external dependency. It's a backstop, not the fix.

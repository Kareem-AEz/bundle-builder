# Security Headers

> Reference for the four basic security response headers the boilerplate ships
> in `next.config.ts`. These are **instructions to the browser** sent alongside
> every response. They don't change how the page looks or works — they tell the
> browser to be stricter.
>
> CSP is the heavy hitter and lives in its own doc — [xss-csp.md](./xss-csp.md).
> `frame-ancestors` there overlaps with `X-Frame-Options` below.

---

## TL;DR — the whole set

All four are **static strings**, so they live in `next.config.ts` under
`async headers()`. The shipped values assume an app that uses no camera/mic/
geolocation and is never meant to be embedded. On a richer app, loosen per
feature.

```ts
// next.config.ts
async headers() {
  return [
    {
      source: "/(.*)", // every route
      headers: [
        { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options",        value: "DENY" },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), usb=(), payment=(), browsing-topics=()",
        },
      ],
    },
  ];
}
```

**Verify:** DevTools → Network → click the document request → Response Headers,
or `curl -I https://yoursite.com`.

---

## 1. `Referrer-Policy`

**What it does:** controls how much of _your_ URL the browser reveals to a
destination when a visitor clicks a link to (or loads a resource from) another
site. The browser normally sends your full URL in the `Referer` header.

**Threat:** URL leakage. If a URL ever holds a token, session id, or email
(`?reset=abc123`), the default behavior hands that whole URL to the next site.

**Values** (least → most leaky):

| Value                                    | Same-origin sends | Cross-origin sends | HTTPS→HTTP  |
| ---------------------------------------- | ----------------- | ------------------ | ----------- |
| `no-referrer`                            | nothing           | nothing            | nothing     |
| `same-origin`                            | full URL          | nothing            | nothing     |
| `strict-origin`                          | origin only       | origin only        | nothing     |
| **`strict-origin-when-cross-origin`** ✅ | full URL          | origin only        | nothing     |
| `origin`                                 | origin only       | origin only        | origin only |
| `origin-when-cross-origin`               | full URL          | origin only        | origin only |
| `no-referrer-when-downgrade`             | full URL          | full URL           | nothing     |
| `unsafe-url` ⛔                          | full URL          | full URL           | full URL    |

- **"origin"** = scheme + host + port, no path (`https://site.com`).
- **"full URL"** = everything including path + query.

**Shipped:** `strict-origin-when-cross-origin` — also the modern browser
default, so this is belt-and-suspenders. Going too strict (`no-referrer`) can
break **analytics, referral/affiliate attribution, and integrations that read
the Referer**. The shipped value preserves cross-site origin info while hiding
the path. Don't use `unsafe-url`.

---

## 2. `Permissions-Policy`

**What it does:** declares which **powerful browser features** the page (and any
iframe it embeds) is even allowed to _request_ — camera, mic, geolocation, USB,
payment, etc.

**Threat:** shrinks attack surface. If injected/third-party code can't even
_ask_ for the camera, it can't abuse it. Also reins in embedded iframes.

**Syntax:** `feature=(allowlist)`, features comma-separated on one line.

| Allowlist form                         | Meaning                                |
| -------------------------------------- | -------------------------------------- |
| `feature=()`                           | **disabled for everyone** (empty list) |
| `feature=(self)`                       | allowed only on your own origin        |
| `feature=(self "https://trusted.com")` | your origin + that specific origin     |
| `feature=*`                            | allowed for everyone (avoid)           |

**Common features:** `camera`, `microphone`, `geolocation`, `usb`, `payment`,
`fullscreen`, `autoplay`, `clipboard-read`, `clipboard-write`,
`display-capture`, `accelerometer`, `gyroscope`, `magnetometer`, `midi`,
`screen-wake-lock`, `browsing-topics` (opt out of the Topics ad API).

**Shipped:** disable what the boilerplate doesn't use —
`camera=(), microphone=(), geolocation=(), usb=(), payment=(), browsing-topics=()`.

**This is the one that silently breaks features later.** Disable `geolocation`
then embed a map, or disable `clipboard-write` then add a copy button, or
disable `fullscreen` then add a fullscreen video — it just won't work, no loud
error. Treat the list as coupled to your feature set; revisit it when you add
things.

**Unlisted features = browser default, NOT disabled.** This header only controls
the features you actually write. Anything you omit falls back to that feature's
**default allowlist** (for most powerful features that's `self`). So:

- `usb=()` → off. Omitting `usb` entirely → defaults to `self`, WebUSB still callable.
- There is **no clean wildcard** to deny everything you didn't mention — a
  hardening list must **explicitly enumerate** each feature you want off.
- **Unknown/unsupported features are silently ignored**, so padding the list
  with extra `feature=()` entries is harmless.

---

## 3. `X-Frame-Options` / CSP `frame-ancestors`

**What it does:** controls whether **other sites can load your page inside an
`<iframe>`**.

**Threat:** **clickjacking** — an attacker iframes your site invisibly over
their page and tricks the user into clicking your buttons. Only valuable to the
attacker if your page has stateful buttons (purchase, delete, change settings).

| `X-Frame-Options` | Meaning                                           |
| ----------------- | ------------------------------------------------- |
| **`DENY`** ✅     | nobody may frame this page                        |
| `SAMEORIGIN`      | only your own origin may frame it                 |
| `ALLOW-FROM uri`  | ⛔ deprecated — use CSP `frame-ancestors` instead |

**Modern equivalent (inside CSP):**

| CSP directive                                | Equivalent to             |
| -------------------------------------------- | ------------------------- |
| `frame-ancestors 'none'`                     | `DENY`                    |
| `frame-ancestors 'self'`                     | `SAMEORIGIN`              |
| `frame-ancestors 'self' https://partner.com` | self + specific allowlist |

**Shipped:** `DENY` plus the CSP `frame-ancestors 'none'`. `DENY` breaks **any
legit embedding** — OAuth login popups, payment iframes (Stripe/PayPal),
preview/embed cards, CMS/Storybook previews, oEmbed. If you ever need those,
switch to `SAMEORIGIN` or an allowlist on both.

`frame-ancestors` is a **CSP directive**, not a standalone header. It
**supersedes** `X-Frame-Options` in modern browsers when both are present, so
the `X-Frame-Options: DENY` here is legacy belt-and-suspenders for old browsers.

---

## 4. `X-Content-Type-Options`

**What it does:** stops the browser from **MIME-sniffing** — guessing a file's
real type by peeking at its bytes instead of trusting the `Content-Type` the
server declared.

**Threat:** a file served as harmless (e.g. `text/plain`) that an attacker
stuffed with HTML/JS — the browser sniffs it, decides "looks like script," and
executes it.

| Value            | Meaning                                                           |
| ---------------- | ----------------------------------------------------------------- |
| **`nosniff`** ✅ | trust the declared `Content-Type`, never guess (only valid value) |

**Shipped:** `nosniff`, always. Closest to zero downside. The only catch: if
your server **mislabels** an asset (e.g. CSS served as `text/plain`), it was
"working by accident" via sniffing, and `nosniff` will stop it — exposing a real
misconfig to fix.

---

## Handling user uploads safely (the other half of `nosniff`)

`nosniff` (a browser-side instruction on bytes you **send**) and a magic-byte
detector like [`file-type`](https://github.com/sindresorhus/file-type) (a
server-side check on bytes you **receive**) solve **different** problems at
**opposite ends of the pipe**. Complementary, not substitutes — `file-type`
helps you produce a **correct** `Content-Type`; `nosniff` tells the browser to
**honor** it instead of guessing.

`file-type` is reliable for **binary** formats (PNG, JPEG, PDF, ZIP, MP4…) via
magic bytes, but has two blind spots:

1. **It cannot detect text-based types.** It returns `undefined` for `.txt`,
   `.csv`, `.svg`, `.html`, `.js` — _exactly_ the XSS-dangerous types (SVG is
   XML and can carry `<script>`). It confirms honest files; it does not catch
   malicious text-based ones.
2. **Polyglots fake the signature.** A file can start with valid PNG magic bytes
   yet carry a script payload after. "Signature says image" ≠ "safe to serve as
   image."

**Defense-in-depth for uploads:**

1. **Detect + allowlist** with `file-type`. Reject `undefined`; reject anything
   not on an explicit allowlist. Never trust the file **extension** or the
   **client-sent** `Content-Type`.
2. **Serve** with the `Content-Type` you derived **+ `nosniff`**, and
   `Content-Disposition: attachment` for downloadables.
3. **Isolate** — serve user content from a **separate origin/sandbox domain**,
   so anything that does execute isn't on your main origin with your
   cookies/session.
4. **Re-encode** images server-side (e.g. `sharp`) — re-encoding a real image
   strips any smuggled polyglot payload.

Only matters once you **serve user-uploaded files**. Today `nosniff` is the free
one-liner; file these rules for the day you add an upload.

---

## Beyond the four (related, not shipped)

- **`Strict-Transport-Security` (HSTS)** — forces HTTPS for a set duration.
  Standard hardening, but be careful with `max-age` + `includeSubDomains` +
  `preload` (hard to undo). Example: `max-age=63072000; includeSubDomains; preload`.
  Most hosts (including Vercel) set HSTS on your domain for you; add it here only
  if yours doesn't.
- **`Content-Security-Policy`** — the heavy hitter, with real render/perf
  tradeoffs (nonce CSP forces dynamic rendering). See [xss-csp.md](./xss-csp.md).
- **`poweredByHeader: false`** in `next.config.ts` removes `X-Powered-By: Next.js`
  — minor info-disclosure cleanup, not security-critical.

---

## Mental model

- **Static value? → `next.config.ts` `headers()`.** All four above.
- **Per-request value (a CSP nonce)? → `proxy.ts`** (Next 16's renamed middleware).
- A header is not a checkbox — it's a **value**, and the value must match **what
  the app actually does**. "Always on, strictest setting" is how you ship a site
  where the map won't load and the payment popup is blank.

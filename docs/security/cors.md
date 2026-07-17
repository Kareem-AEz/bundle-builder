# CORS

> What CORS is, the model proven by experiment, how to implement it in Next.js,
> the one real vulnerability, and the browser→storage upload case.
> Companion to [headers.md](./headers.md) and [glossary.md](./glossary.md).

---

## The one-paragraph model

**CORS = Cross-Origin Resource Sharing.** It runs in the **browser**, and it
protects the **user**, not the server. Default browser rule (the **Same-Origin
Policy**): JS may **send** a request to any origin, but the browser **blocks JS
from reading the response** of a _different_ origin — unless that origin **opts
in** by sending `Access-Control-Allow-*` headers. CORS is the opt-in. The safe
default is **no CORS headers = closed.**

Key consequences:

- The server **always receives and answers** the request; the **browser** is the
  enforcer that decides whether your JS may read the reply. (`200 OK` next to
  `ERR_FAILED` proves it.)
- CORS never protects data from `curl`/servers — anyone can fetch a public URL
  directly. It only stops **a malicious site, in the victim's browser, reading a
  response generated with the victim's session.**
- You only **add** CORS when you _want_ a different origin's browser code to read
  your responses. Same-origin calls (incl. to your own `/api` routes) never need
  it — which is why this boilerplate ships **no** CORS config.

---

## Origin = scheme + host + port (no path)

Same origin only if all three match. `https://example.com`,
`http://example.com`, `https://api.example.com`, `https://example.com:8080` are
**four different origins**. `localhost` and `127.0.0.1` are **different origins**
too (handy for local CORS testing).

---

## Simple vs preflighted requests

A request is **simple** (no preflight) only if it stays within what an old HTML
`<form>` could already do:

|              | Simple (no preflight)                                  | Non-simple (PREFLIGHT)                           |
| ------------ | ------------------------------------------------------ | ------------------------------------------------ |
| Method       | GET, HEAD, POST                                        | PUT, PATCH, DELETE                               |
| Headers      | only safelisted (Accept, Content-Language…)            | any custom header (`X-API-Key`, `Authorization`) |
| Content-Type | `text/plain`, `form-urlencoded`, `multipart/form-data` | **`application/json`** ← bites everyone          |

**Preflight** = the browser sends an `OPTIONS` request **first** to ask
permission. If the `OPTIONS` answer doesn't cover the real request, the real
request is **never sent**. (It gates exactly the _new_ powers `fetch` added that
forms never had, so a pre-CORS server never receives an unexpected cross-origin
state-change.)

---

## The headers (the CORS family)

**Server → browser (response):**

| Header                               | Job                                                             |
| ------------------------------------ | --------------------------------------------------------------- |
| `Access-Control-Allow-Origin` (ACAO) | which origins may read responses (`*` or an exact origin)       |
| `Access-Control-Allow-Methods`       | methods allowed (answered on the preflight)                     |
| `Access-Control-Allow-Headers`       | request headers the client may send (answered on the preflight) |
| `Access-Control-Allow-Credentials`   | may the request carry cookies? (`true`)                         |
| `Access-Control-Max-Age`             | seconds to cache the preflight answer (skip re-asking)          |
| `Access-Control-Expose-Headers`      | which response headers JS may read                              |

**Browser → server (request):** `Origin`, and on a preflight
`Access-Control-Request-Method` / `Access-Control-Request-Headers`.

---

## The credentials rule (the keystone)

"Credentials" = things the **browser attaches automatically**: **cookies, HTTP
auth, client certs**. NOT a token your JS sets by hand (`Authorization` /
`X-API-Key` are not "credentials").

- `ACAO: *` is **forbidden** with credentials. To allow credentialed
  cross-origin reads you MUST name an **exact origin** +
  `Access-Control-Allow-Credentials: true`. The browser bans `*` + credentials.
- Therefore `ACAO: *` can **never** expose a cookie-gated (private) response → `*`
  on public data is harmless.

| Auth style                           | Auto-attached?       | `ACAO: *` ok?                                              |
| ------------------------------------ | -------------------- | ---------------------------------------------------------- |
| Cookie / session                     | yes                  | **No** — name origin + `Allow-Credentials: true`           |
| API key / bearer in a header         | no                   | **Yes**, safely (but triggers preflight → list the header) |
| Presigned-URL signature (e.g. S3/R2) | no (it's in the URL) | **Yes**, safely                                            |

---

## The one real CORS vulnerability

Server **reflects the request `Origin`** into `ACAO` **AND** sets
`Access-Control-Allow-Credentials: true` for any origin. That lets any site read
responses **with a logged-in victim's cookies**. Needs: (1) this misconfig, (2)
a logged-in victim, (3) the victim visiting the attacker's page.

**Test your own endpoint (authorized):**

```bash
curl -s -o /dev/null -D - -H "Origin: https://evil.com" https://YOURSITE/api/whatever | grep -i access-control
```

- `Access-Control-Allow-Origin: *` (no creds) → safe.
- no access-control line → locked.
- `Access-Control-Allow-Origin: https://evil.com` + `Allow-Credentials: true` → **vulnerable.**

(Reading data ≠ acting as the user. Performing actions without reading is
**CSRF**, a separate topic.)

---

## When you need it / when you don't

- **Don't touch CORS** for a single-origin app calling its own same-origin
  endpoints (the default here). Any `ACAO: *` you see on static assets is a
  **platform default** (e.g. Vercel), harmless, not in your source.
- **Add CORS** only when a **browser on a different origin** must read your
  response: split frontend/backend (`app.com` ↔ `api.com`), a public API, an
  embeddable widget, direct browser→storage uploads.

---

## Implementing in Next.js

**Per route** (`app/api/x/route.ts`) — and remember the preflight hits
**`OPTIONS`**, not your `GET`, so the `GET` headers alone are NOT enough for
custom headers/methods:

```ts
const cors = {
  "Access-Control-Allow-Origin": "*", // or an exact origin
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Custom-Header",
};

export async function GET() {
  return new Response("Hello", { status: 200, headers: cors });
}

// answers the preflight — GET's headers never apply to an OPTIONS request
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors });
}
```

- **Many routes:** `next.config.ts` `headers()` with `source: "/api/:path*"`, or
  `proxy.ts`.
- **Scope** `ACAO` to a named origin for anything not fully public.

---

## Browser→storage uploads (why a _bucket_ needs CORS)

Apparent paradox: "CORS runs in the browser and protects the user — why does an
object store (S3 / R2) need a CORS policy?" Resolution: **the flow moved into the
browser.**

- **Server uploads:** `browser → your API (same origin) → bucket`. The
  `API → bucket` hop is **server-to-server → no CORS.** The bucket needs no policy.
- **Direct client uploads:** `browser → bucket directly` (different origin) to
  dodge serverless body-size limits. Now the **browser** makes a cross-origin
  request → it enforces CORS → the bucket must **opt in** by sending allow
  headers. The **bucket CORS policy IS the bucket's opt-in** (its version of an
  `OPTIONS` handler).

A correct bucket policy, mapped to the model:

```json
{
  "AllowedOrigins": ["http://localhost:3000", "https://yourapp.com"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

`PUT` upload is non-simple → preflight. `AllowedHeaders: ["*"]` because presigned
uploads send `Content-Type` + `x-amz-*`. `MaxAgeSeconds` = `Access-Control-Max-Age`.
Auth is in the **presigned URL signature**, not cookies → no credentials risk →
scope `AllowedOrigins`, never `*` if anything is private.

---

## Gotchas

1. **Always test CORS cross-origin.** A same-origin request skips CORS entirely →
   a "success" there is a **false positive**. Confirm with
   `Sec-Fetch-Site: cross-site` on the request.
2. **`localhost` ≠ `127.0.0.1`** — use one for the page, the other in the fetch
   URL, for a real cross-origin test locally without HTTPS mixed-content pain.
3. **`GET` handler headers don't answer the preflight.** Custom header / PUT /
   DELETE / JSON needs an **`OPTIONS` handler** (or next.config/proxy).
4. **If a request "works" cross-origin when it shouldn't,** suspect a
   **CORS-bypass browser extension** injecting allow headers. Re-test in Incognito.
5. **Two kinds of block look different in DevTools:** simple request, read denied
   → server replied, `ERR_FAILED` **with `200 (OK)`**; preflight denied → real
   request **never sent**, `ERR_FAILED` **no status**.

---

## The model as a checklist

- [ ] Is a **browser** making the request? (No → CORS doesn't apply.)
- [ ] **Cross-origin?** (Same-origin → CORS doesn't apply.)
- [ ] **Simple or preflighted?** (Custom header / PUT / DELETE / JSON → preflight → need `OPTIONS`.)
- [ ] **Credentials (cookies)?** (Yes → no `*`; name origin + `Allow-Credentials`.)
- [ ] **Scoped** `ACAO` to a named origin unless genuinely public.
- [ ] **Never** reflect-origin + allow-credentials.

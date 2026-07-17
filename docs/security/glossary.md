# Security Glossary

> Short + long forms of the terms used across the security docs.
> Companion to [headers.md](./headers.md), [xss-csp.md](./xss-csp.md), and
> [cors.md](./cors.md).
> **(header)** = literal text sent with an HTTP response. **(concept)** = an
> idea, not a header.

## Core security concepts

| Short    | Long                          | Meaning                                                                                                                  |
| -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **XSS**  | Cross-Site Scripting          | Attacker gets malicious JS to run on your page, in a victim's browser. Attacks **users**, not the server.                |
| **CORS** | Cross-Origin Resource Sharing | The headers that let a server opt in to other origins' JS reading its responses.                                         |
| **SOP**  | Same-Origin Policy            | Browser default CORS relaxes: JS may **send** anywhere, but can't **read** a different origin's response unless allowed. |
| **CSP**  | Content Security Policy       | A header that allowlists where scripts/styles/images/frames may load from; limits XSS damage.                            |
| **CSRF** | Cross-Site Request Forgery    | Tricks a victim's browser into **sending** an authenticated request (vs XSS which **reads** one).                        |
| **SQLi** | SQL Injection                 | Injects database commands; attacks the **server/DB** (contrast with XSS).                                                |

## Headers

| Short / name                      | Long                          | Does                                                          |
| --------------------------------- | ----------------------------- | ------------------------------------------------------------- |
| **ACAO** (header)                 | `Access-Control-Allow-Origin` | The CORS header. `*` = any origin may read my responses.      |
| `Referrer-Policy` (header)        | —                             | How much of your URL leaks to sites you link to.              |
| `Permissions-Policy` (header)     | —                             | Which browser features (camera, mic…) the page may use.       |
| `X-Frame-Options` (header)        | —                             | Whether other sites may iframe your page (anti-clickjacking). |
| `X-Content-Type-Options` (header) | —                             | `nosniff` = stop the browser guessing a file's type.          |
| **HSTS** (header)                 | `Strict-Transport-Security`   | Force HTTPS for a set duration.                               |
| `Content-Disposition` (header)    | —                             | `attachment` = download the file instead of rendering it.     |

## Terms inside those topics

| Short         | Long                                  | Meaning                                                                                                                                                                                                                                   |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MIME type** | Multipurpose Internet Mail Extensions | A file's format label, e.g. `text/html`, `image/png`. Sent via `Content-Type`.                                                                                                                                                            |
| **SRI**       | Subresource Integrity                 | Build-time hashes verifying a script wasn't tampered with; an alternative to CSP nonces. Not enabled here — `experimental.sri` is incompatible with Turbopack builds (it hashes artifacts Turbopack doesn't serve, blocking every chunk). |
| **nonce**     | "number used once"                    | Fresh random token per request; lets CSP allow _your_ inline script while blocking injected ones.                                                                                                                                         |
| **preflight** | —                                     | Automatic `OPTIONS` request the browser sends first to ask permission, for non-"simple" cross-origin requests.                                                                                                                            |
| **opaque**    | —                                     | A response object that's present but unreadable (what `mode: "no-cors"` returns).                                                                                                                                                         |
| **origin**    | —                                     | scheme + host + port. The unit CORS/SOP reason about. No path.                                                                                                                                                                            |

## Web / framework terms

| Short    | Long                              | Meaning                                                                                              |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **DOM**  | Document Object Model             | Live tree of elements the browser builds from HTML; what JS manipulates.                             |
| **HTTP** | HyperText Transfer Protocol       | The request/response protocol of the web; headers are part of it.                                    |
| **URL**  | Uniform Resource Locator          | A web address that says **how to locate** a resource (`https://example.com/path?q=1`).               |
| **URI**  | Uniform Resource Identifier       | The **superset**: any string that identifies a resource. Every URL is a URI; not every URI is a URL. |
| **URN**  | Uniform Resource Name             | A URI that **names** without locating (e.g. `urn:isbn:0451450523`).                                  |
| **API**  | Application Programming Interface | An endpoint your code calls to get/send data.                                                        |
| **CDN**  | Content Delivery Network          | Edge servers caching and serving static files fast, worldwide.                                       |
| **SSR**  | Server-Side Rendering             | Server builds HTML per request (vs static prebuilt).                                                 |
| **PPR**  | Partial Prerendering              | Next.js mix of static shell + dynamic holes.                                                         |
| **ISR**  | Incremental Static Regeneration   | Static pages that rebuild periodically.                                                              |

## URI vs URL (why the docs say "URL")

- **URI** is the umbrella: _any_ identifier of a resource.
- **URL** is the subset that also tells you **where it is and how to reach it** —
  it has a scheme like `https:` that locates it. "Locator."
- **URN** is the other subset: it **names** a thing without saying where to get
  it (`urn:isbn:…`).

Every URL is a URI; not every URI is a URL. The docs say **URL** throughout
because they always mean **addressable, fetchable web addresses** (things you
`fetch()`, link to, leak in a `Referer`). The WHATWG URL Standard also
standardized on "URL" and treats the URI/URL split as mostly historical.

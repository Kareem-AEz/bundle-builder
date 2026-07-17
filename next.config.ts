import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static-friendly CSP. script-src keeps 'unsafe-inline' because the app emits
// inline scripts that run before paint (next-themes, the splash head script)
// plus Next's hydration payload (self.__next_f.push) — verified: strict 'self'
// alone blocks them, and the only stricter path (nonces) forces dynamic
// rendering, which kills static / ISR / PPR / CDN caching.
// Trade-off owned: CSP no longer blocks inline-injection XSS, so the PRIMARY
// defense stays "render untrusted data as text, never dangerouslySetInnerHTML"
// (see docs/security/xss-csp.md). script-src 'self' still blocks EXTERNAL
// malicious scripts; the other directives still give clickjacking +
// exfiltration + injection hardening. 'unsafe-eval' is dev-only (React uses
// eval for error stacks).
//
// EXTENDING IT: you touch one directive per external dependency. The console
// violation names the directive that complained (default-src is the fallback):
//   • connect-src  → browser fetch/XHR/WebSocket to a cross-origin API (split
//     frontend/backend, third-party API, analytics beacon). Same-origin /api
//     routes inherit 'self' and need nothing. e.g.:
//       connect-src 'self' https://api.example.com;
//   • script-src   → an external <script src> (CDN widget, analytics tag). e.g.:
//       script-src 'self' 'unsafe-inline' https://cdn.example.com;
//   • img-src      → remote <Image>/images host (also add images.remotePatterns).
//   • frame-src    → embedding a YouTube/Vimeo/Stripe iframe.
//   • form-action  → only a native <form action="https://..."> (server actions
//     and fetch submits are connect-src, not this).
// Symptom when you forget: console "Refused to connect/load ... violates CSP".
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self' data:;
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Testing the dev server from another device on your LAN (e.g. a phone at
  // http://192.168.x.x:3000)? Next blocks cross-origin dev requests by default;
  // list the origins you browse from here. Dev-only — has no effect on the
  // production build. Use the machine's LAN IP, not localhost.
  // allowedDevOrigins: ["192.168.1.10"],

  async headers() {
    return [
      {
        source: "/(.*)", // every route
        // Enforced. The boilerplate loads no external resources, so nothing
        // legitimate is blocked. After adding an external origin (or if a route
        // trips a directive), switch this key to
        // "Content-Security-Policy-Report-Only", rebuild, click through every
        // route, read the console violations, then flip back to enforce.
        // (SRI / experimental.sri is intentionally NOT enabled — it generates
        // integrity hashes that don't match what Turbopack serves and blocks
        // every chunk. script-src 'self' already covers its job.)
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), usb=(), payment=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

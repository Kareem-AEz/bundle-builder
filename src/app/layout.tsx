import "./globals.css";
import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/config/site";
import { PREPAINT_SCRIPT } from "@/features/bundle-builder/lib/persistence";
import { env } from "@/lib/env";

// Manrope: closest free variable-font substitute for the design's Gilroy. One file,
// all weights (200-800). No true italic — the browser synthesizes it for the lone
// italic use ("Save my system for later"). Documented deviation, see README.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The pre-paint script sets an attribute on <html>, which React would otherwise
    // flag as a server/client attribute mismatch during hydration.
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${geistMono.variable} antialiased`}>
        {/* First thing in <body> so it runs before the builder markup is even parsed.
            See lib/persistence for what it does and why it can't live in React. */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
        <TooltipProvider delay={300}>{children}</TooltipProvider>
      </body>
    </html>
  );
}

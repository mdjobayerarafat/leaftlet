import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Lora, Space_Mono } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { themeInitScript } from "@/components/providers/theme-provider";
import { SITE_NAME, SITE_TAGLINE } from "@/config/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: "Discover, read and keep your books — a modern digital library with a comfortable PDF reading experience.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Keeps the reader's swipe controls alive when the phone keyboard opens.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf3e3" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${spaceMono.variable} h-full`}
    >
      <head>
        {/* Pre-paint theme application via next/script: server-injected and
            skipped during client hydration, so React never re-executes it. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

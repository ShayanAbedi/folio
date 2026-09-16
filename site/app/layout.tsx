import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ONE_LINER, SITE_URL, TAGLINE } from "./content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `Folio — ${TAGLINE}`,
  description: ONE_LINER,
  applicationName: "Folio",
  keywords: [
    "Raycast extension",
    "portfolio",
    "SnapTrade",
    "net worth",
    "brokerage",
    "macOS",
    "read-only",
    "open source",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Folio",
    locale: "en_US",
    url: "/",
    title: `Folio — ${TAGLINE}`,
    description: ONE_LINER,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Folio — your portfolio in Raycast.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Folio — ${TAGLINE}`,
    description: ONE_LINER,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0E0F12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}

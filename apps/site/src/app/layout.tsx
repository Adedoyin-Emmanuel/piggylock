import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/config";
import "./globals.css";

const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "PiggyLock: savings you can't touch early",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PiggyLock: savings you can't touch early",
  description:
    "Lock your USDT until the date you choose, right inside MiniPay. No early withdrawals, one small fee.",
  openGraph: {
    title: "PiggyLock: savings you can't touch early",
    description: "Lock your USDT until the date you choose, right inside MiniPay.",
    type: "website",
    siteName: "PiggyLock",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "PiggyLock: savings you can't touch early",
    description: "Lock your USDT until the date you choose, right inside MiniPay.",
    images: [ogImage],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

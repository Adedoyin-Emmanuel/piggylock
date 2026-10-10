import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PiggyLock: savings you can't touch early",
  description:
    "Lock your USDT until the date you choose, right inside MiniPay. No early withdrawals, one small fee.",
  openGraph: {
    title: "PiggyLock: savings you can't touch early",
    description: "Lock your USDT until the date you choose, right inside MiniPay.",
    type: "website",
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

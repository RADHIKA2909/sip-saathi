import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SIP Saathi, Your SIP journey, made clearer", template: "%s · SIP Saathi" },
  description:
    "An independent educational prototype that helps first-time SIP investors understand returns, contributions, conflicting advice and payment issues. Not investment advice. Not affiliated with any investment platform.",
};

export const viewport: Viewport = { themeColor: "#0f9b74", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

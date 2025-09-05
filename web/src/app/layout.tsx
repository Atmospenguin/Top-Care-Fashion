import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Top Care Fashion",
  description: "Prototype – Landing, Register, Marketplace",
  icons: {
    icon: "/icon_14radius.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-black/10">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" aria-label="Top Care Fashion home">
              <Image src="/logo_BrandColor.svg" alt="Top Care Fashion" width={96} height={28} priority />
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-[var(--brand-color)]">
                Home
              </Link>
              <Link href="/marketplace" className="hover:text-[var(--brand-color)]">
                Marketplace
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-3 py-2 hover:opacity-90"
              >
                Register
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

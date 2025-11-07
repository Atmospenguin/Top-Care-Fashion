import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import NavBar from "@/components/NavBar";
import BackToTopButton from "@/components/BackToTopButton";

// Initialize Geist fonts
const geistSans = GeistSans;
const geistMono = GeistMono;

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
  <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body
        className="antialiased"
      >
        <AuthProvider>
          <header>
            <NavBar />
          </header>
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          <BackToTopButton />
        </AuthProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";
import NavBar from "@/components/NavBar";
import BackToTopButton from "@/components/BackToTopButton";

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

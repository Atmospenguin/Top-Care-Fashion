"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
import { useAuth } from "./AuthContext";

export default function NavBar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  return (
    <nav className="w-full bg-[var(--brand-color)] text-white relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Top Care Fashion home">
          <Image src="/logo_White.svg" alt="Top Care Fashion" width={120} height={32} priority />
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link href="/faq" className="hover:opacity-90">FAQ</Link>
          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/signin" className="hover:opacity-90">Sign in</Link>
              <Link href="/register" className="inline-flex items-center rounded-md bg-white text-[var(--brand-color)] px-3 py-1.5 font-medium hover:opacity-90">Sign up</Link>
            </div>
          ) : (
            <div
              className="relative"
              onMouseEnter={() => {
                if (closeTimer.current) {
                  clearTimeout(closeTimer.current);
                  closeTimer.current = null;
                }
                setOpen(true);
              }}
              onMouseLeave={() => {
                if (closeTimer.current) clearTimeout(closeTimer.current);
                // delay close slightly to allow pointer to move into dropdown
                closeTimer.current = window.setTimeout(() => {
                  setOpen(false);
                  closeTimer.current = null;
                }, 150);
              }}
            >
              <button className="inline-flex items-center gap-2 rounded-md border border-white/25 px-3 py-1.5 hover:bg-white/10">
                <span className="font-medium">{user?.username || user?.email}</span>
                <span className="text-xs">▾</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-1 w-56 rounded-md border border-black/10 bg-white text-black shadow z-50">
                  <div className="px-3 py-2 text-xs text-black/60">Signed in as <span className="font-medium text-black">{user?.username || user?.email}</span></div>
                  <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-black/5">Profile</Link>
                  <button className="block w-full text-left px-3 py-2 text-sm hover:bg-black/5" onClick={() => { setOpen(false); signOut(); }}>Sign out</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

"use client";
import Link from "next/link";
import AppScreensCarousel from "@/components/AppScreensCarousel";
import { useAuth } from "@/components/AuthContext";
import AIFeatures from "@/components/AIFeatures";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const FILTERS = [
    { key: "all", label: "All (Past 3 weeks)" },
    { key: "mixmatch", label: "Mix & Match" },
    { key: "ailisting", label: "AI Listing" },
    { key: "premium", label: "Premium Member" },
  ] as const;

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const threeWeeks = 21 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const TESTIMONIALS: Array<{ id: number; user: string; text: string; rating: number; tags: Array<"mixmatch" | "ailisting" | "premium">; ts: number }>
    = [
      { id: 1, user: "Ava", text: "Mix & Match nailed my vibe in minutes.", rating: 5, tags: ["mixmatch"], ts: now - 2 * 24 * 60 * 60 * 1000 },
      { id: 2, user: "Leo", text: "AI Listing wrote better titles than I do.", rating: 5, tags: ["ailisting"], ts: now - 5 * 24 * 60 * 60 * 1000 },
      { id: 3, user: "Mia", text: "Premium perks are worth it for frequent sellers.", rating: 5, tags: ["premium"], ts: now - 7 * 24 * 60 * 60 * 1000 },
      { id: 4, user: "Kai", text: "Found full outfits with Mix & Match.", rating: 4, tags: ["mixmatch"], ts: now - 19 * 24 * 60 * 60 * 1000 },
      { id: 5, user: "Zoe", text: "AI Listing saved me tons of time.", rating: 5, tags: ["ailisting"], ts: now - 25 * 24 * 60 * 60 * 1000 },
    ];

  const visible = TESTIMONIALS.filter((t) =>
    filter === "all" ? now - t.ts <= threeWeeks : t.tags.includes(filter as any)
  );
  return (
    <div className="flex flex-col gap-24">
      {/* Hero with carousel */}
      <section className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
        <div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Discover outfits powered by AI
          </h1>
          <p className="mt-4 text-lg text-black/70 max-w-prose">
            Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <Link href="/register" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-5 py-3 text-sm font-medium hover:opacity-90">Join for free</Link>
            ) : (
              <a href="#download" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-5 py-3 text-sm font-medium hover:opacity-90">Download the app</a>
            )}
            <Link href="/faq" className="inline-flex items-center rounded-md border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5">FAQ</Link>
          </div>
        </div>
        <div className="relative w-full">
          <AppScreensCarousel className="w-full max-w-[320px] md:max-w-[380px] mx-auto" />
        </div>
      </section>

      {/* AI Features with screenshots + carousels */}
      <AIFeatures />

      {/* Social proof + Stats merged */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight">Loved by Trendsetters</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm border ${filter === f.key ? "bg-[var(--brand-color)] text-white border-[var(--brand-color)]" : "border-black/15 hover:bg-black/5"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {visible.map((t) => (
            <div key={t.id} className="rounded-xl border border-black/10 p-6 shadow-sm bg-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-black/10" />
                <span className="text-sm font-medium">{t.user}</span>
              </div>
              <p className="mt-3 text-sm text-black/70">“{t.text}”</p>
              <div className="mt-3 text-[var(--brand-color)]">{"★★★★★".slice(0, t.rating)}</div>
            </div>
          ))}
        </div>

        {/* Inline Stats */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">12k+</div>
            <div className="text-xs text-black/60">Downloads</div>
          </div>
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">38k+</div>
            <div className="text-xs text-black/60">Items listed</div>
          </div>
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">9.4k</div>
            <div className="text-xs text-black/60">Items sold</div>
          </div>
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">4.8★</div>
            <div className="text-xs text-black/60">Avg. rating</div>
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight">Plans & Pricing</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="relative rounded-2xl border border-black/10 p-6 bg-white shadow-sm">
            <div className="text-xs font-medium tracking-wide text-black/60">Starter</div>
            <h3 className="mt-1 text-xl font-semibold">Free</h3>
            <p className="mt-1 text-sm">$0 / month</p>
            <ul className="mt-4 text-sm space-y-2 text-black/80">
              <li>• Up to 2 active listings</li>
              <li>• Promotion: $2.90 / 3-day</li>
              <li>• Free promo credits: None</li>
              <li>• Commission: 10% per sale</li>
              <li>• Mix & Match AI: 3 total uses</li>
              <li>• Seller badge: None</li>
              <li>• Payment options: Free</li>
            </ul>
            {!isAuthenticated ? (
              <Link href="/register" className="mt-6 inline-block text-[var(--brand-color)] hover:underline">Get started</Link>
            ) : (
              <a href="#download" className="mt-6 inline-block text-[var(--brand-color)] hover:underline">Download the app</a>
            )}
          </div>

          {/* Premium Plan */}
          <div className="relative rounded-2xl border border-black/10 p-6 bg-gradient-to-b from-white to-[#fff5f4] shadow-sm">
            <div className="absolute -top-3 right-4 text-[10px] px-2 py-1 rounded-full bg-[var(--brand-color)] text-white shadow">POPULAR</div>
            <div className="text-xs font-medium tracking-wide text-black/60">Pro</div>
            <h3 className="mt-1 text-xl font-semibold">Premium</h3>
            <p className="mt-1 text-sm">Monthly / Quarterly / Annual</p>
            <ul className="mt-4 text-sm space-y-2 text-black/80">
              <li>• Unlimited listings</li>
              <li>• Promotion: $2.00 / 3-day (30% off)</li>
              <li>• First 3 listings: 3 days free promotion</li>
              <li>• Commission: 5% per sale</li>
              <li>• Mix & Match AI: Unlimited usage & saves</li>
              <li>• Seller badge: Premium badge on profile & listings</li>
              <li>• Pricing: 1 mo $6.90 · 3 mo $18.90 ($6.30/mo) · 12 mo $59.90 ($4.99/mo)</li>
            </ul>
            {!isAuthenticated ? (
              <Link href="/register" className="mt-6 inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90">Upgrade</Link>
            ) : (
              <a href="#download" className="mt-6 inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90">Download the app</a>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold">Ready to try?</h2>
        <p className="mt-2 text-black/70">Create your account and list your first item in minutes.</p>
        <div className="mt-6">
          {!isAuthenticated ? (
            <Link href="/register" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-6 py-3 text-sm font-medium hover:opacity-90">Sign up now</Link>
          ) : (
            <a href="#download" className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-6 py-3 text-sm font-medium hover:opacity-90">Download the app</a>
          )}
        </div>
        <div className="mt-6">
          <Link href="/faq" className="text-sm text-[var(--brand-color)] hover:underline">FAQ</Link>
        </div>
      </section>
    </div>
  );
}

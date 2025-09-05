import Link from "next/link";
import AppScreensCarousel from "@/components/AppScreensCarousel";

export default function Home() {
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
            <Link
              href="/register"
              className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-5 py-3 text-sm font-medium hover:opacity-90"
            >
              Join for free
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center rounded-md border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5"
            >
              Browse marketplace
            </Link>
          </div>
          <div className="mt-4 text-xs text-black/60">
            No credit card required · Cancel anytime
          </div>
        </div>
        <div className="relative w-full">
          <AppScreensCarousel className="w-full max-w-[320px] md:max-w-[380px] mx-auto" />
        </div>
      </section>

      {/* AI Features */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight">AI Features</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-xl border border-black/10 p-6 shadow-sm hover:shadow transition-shadow">
            <h3 className="font-medium">Mix & Match</h3>
            <p className="text-sm text-black/70 mt-1">AI outfit recommendations based on listed items and style preferences.</p>
          </div>
          <div className="rounded-xl border border-black/10 p-6 shadow-sm hover:shadow transition-shadow">
            <h3 className="font-medium">Smart Listing</h3>
            <p className="text-sm text-black/70 mt-1">Auto-generate titles, categories, tags, and descriptions from photos.</p>
          </div>
          <div className="rounded-xl border border-black/10 p-6 shadow-sm hover:shadow transition-shadow">
            <h3 className="font-medium">Search Assist</h3>
            <p className="text-sm text-black/70 mt-1">Natural language and image-based search to find the perfect piece.</p>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section>
        <h2 className="text-3xl font-semibold tracking-tight">Loved by early users</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-black/10 p-6 shadow-sm bg-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-black/10" />
                <span className="text-sm font-medium">User {i}</span>
              </div>
              <p className="mt-3 text-sm text-black/70">
                &ldquo;Smooth listing flow and clean design. Excited for AI outfits!&rdquo;
              </p>
              <div className="mt-3 text-[var(--brand-color)]">★★★★★</div>
            </div>
          ))}
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
            <Link href="/register" className="mt-6 inline-block text-[var(--brand-color)] hover:underline">
              Get started
            </Link>
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
            <Link
              href="/register"
              className="mt-6 inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-4 py-2 text-sm hover:opacity-90"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-2xl font-semibold">Ready to try?</h2>
        <p className="mt-2 text-black/70">Create your account and list your first item in minutes.</p>
        <div className="mt-6">
          <Link
            href="/register"
            className="inline-flex items-center rounded-md bg-[var(--brand-color)] text-white px-6 py-3 text-sm font-medium hover:opacity-90"
          >
            Sign up now
          </Link>
        </div>
      </section>
    </div>
  );
}

"use client";
import Link from "next/link";
import AppScreensCarousel from "@/components/AppScreensCarousel";
import { useAuth } from "@/components/AuthContext";
import AIFeatures from "@/components/AIFeatures";
import { useState, useEffect } from "react";

interface Testimonial {
  id: string | number;
  user: string;
  text: string;
  rating: number;
  // Extend allowed tags to match filter options and usage
  tags: Array<"mixmatch" | "ailisting" | "premium" | "buyer" | "seller">;
  ts: number;
}

interface SiteStats {
  users: number;
  listings: number;
  sold: number;
  rating: number;
}

interface PricingPlan {
  type: string;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    quarterly?: number;
    annual?: number;
  };
  features: string[];
  isPopular: boolean;
}

interface LandingContent {
  heroTitle: string;
  heroSubtitle: string;
  heroCarouselImages?: string[] | null;
  aiFeatures?: {
    mixmatch?: { title?: string; desc?: string; girlImages?: string[] | null; boyImages?: string[] | null };
    ailisting?: { title?: string; desc?: string; images?: string[] | null };
    search?: { title?: string; desc?: string; images?: string[] | null };
  };
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<SiteStats>({ users: 12000, listings: 38000, sold: 9400, rating: 4.8 });
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [landingContent, setLandingContent] = useState<LandingContent>({
    heroTitle: 'Discover outfits powered by AI',
    heroSubtitle: 'Mix & Match is an AI outfit recommender that builds looks from listed items. Snap, list, and get smart suggestions instantly.',
    heroCarouselImages: undefined,
    aiFeatures: undefined,
  });
  const [loading, setLoading] = useState(true);

  const FILTERS = [
    { key: "all", label: "All (Past 3 weeks)" },
    { key: "mixmatch", label: "Mix & Match" },
    { key: "ailisting", label: "AI Listing" },
    { key: "premium", label: "Premium Member" },
    { key: "buyer", label: "From Buyer" },
    { key: "seller", label: "From Seller" },
  ] as const;

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [testimonialsRes, statsRes, plansRes, contentRes] = await Promise.all([
          fetch('/api/feedback'),
          fetch('/api/site-stats'),
          fetch('/api/pricing-plans'),
          fetch('/api/landing-content')
        ]);

        if (testimonialsRes.ok) {
          const testimonialsData = await testimonialsRes.json();
          setTestimonials(testimonialsData.testimonials);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPricingPlans(plansData.plans);
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setLandingContent(contentData);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const threeWeeks = 21 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const visible = testimonials.filter((t) =>
    filter === "all"
      ? now - t.ts <= threeWeeks
      : t.tags.includes(filter as Testimonial["tags"][number])
  );
  return (
    <div className="flex flex-col gap-24">
      {/* Hero with carousel */}
      <section id="hero" className="grid grid-cols-1 md:grid-cols-2 items-center gap-12">
        <div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            {landingContent.heroTitle}
          </h1>
          <p className="mt-4 text-lg text-black/70 max-w-prose">
            {landingContent.heroSubtitle}
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
          <AppScreensCarousel
            className="w-full max-w-[320px] md:max-w-[380px] mx-auto"
            images={landingContent.heroCarouselImages ?? undefined}
          />
        </div>
      </section>

      {/* AI Features with screenshots + carousels */}
      <div id="features">
        <AIFeatures config={landingContent.aiFeatures} />
      </div>

      {/* Social proof + Stats merged */}
      <section id="community">
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
          {visible.map((t) => {
            const tags = (t.tags ?? []) as Testimonial["tags"];
            const from = tags.includes('buyer') ? 'from buyer' : (tags.includes('seller') ? 'from seller' : undefined);
            return (
             <div key={t.id} className="rounded-xl border border-black/10 p-6 shadow-sm bg-white">
               <div className="flex items-center gap-2">
                 <div className="h-8 w-8 rounded-full bg-black/10" />
                 <span className="text-sm font-medium">{t.user}</span>
               </div>
              <p className="mt-3 text-sm text-black/70">“{t.text}” {from && (<span className="text-black/50">— {from}</span>)}</p>
                <div className="mt-3 text-[var(--brand-color)]">{"★★★★★".slice(0, t.rating)}</div>
              </div>
          );})}
        </div>

        {/* Inline Stats */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">{stats.users >= 1000 ? `${Math.floor(stats.users/1000)}k+` : stats.users}</div>
            <div className="text-xs text-black/60">Users</div>
          </div>
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">{stats.listings >= 1000 ? `${Math.floor(stats.listings/1000)}k+` : stats.listings}</div>
            <div className="text-xs text-black/60">Items listed</div>
          </div>
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">{stats.sold >= 1000 ? `${(stats.sold/1000).toFixed(1)}k` : stats.sold}</div>
            <div className="text-xs text-black/60">Items sold</div>
          </div>
          <div className="rounded-xl border border-black/10 p-6 text-center bg-white">
            <div className="text-3xl font-semibold">{stats.rating}★</div>
            <div className="text-xs text-black/60">Avg. rating</div>
          </div>
        </div>
      </section>


      {/* Pricing */}
      <section id="pricing">
        <h2 className="text-3xl font-semibold tracking-tight">Plans & Pricing</h2>
        {loading ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="animate-pulse rounded-2xl border border-black/10 p-6 bg-white shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
            <div className="animate-pulse rounded-2xl border border-black/10 p-6 bg-white shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.type} 
                className={`relative rounded-2xl border border-black/10 p-6 shadow-sm ${
                  plan.isPopular ? 'bg-gradient-to-b from-white to-[#fff5f4]' : 'bg-white'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 right-4 text-[10px] px-2 py-1 rounded-full bg-[var(--brand-color)] text-white shadow">POPULAR</div>
                )}
                <div className="text-xs font-medium tracking-wide text-black/60">
                  {plan.type === 'free' ? 'Starter' : 'Pro'}
                </div>
                <h3 className="mt-1 text-xl font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm">{plan.description}</p>
                <ul className="mt-4 text-sm space-y-2 text-black/80">
                  {plan.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
                {!isAuthenticated ? (
                  <Link 
                    href="/register" 
                    className={`mt-6 inline-flex items-center rounded-md px-4 py-2 text-sm hover:opacity-90 ${
                      plan.isPopular 
                        ? 'bg-[var(--brand-color)] text-white' 
                        : 'text-[var(--brand-color)] hover:underline'
                    }`}
                  >
                    {plan.type === 'free' ? 'Get started' : 'Upgrade'}
                  </Link>
                ) : (
                  <a 
                    href="#download" 
                    className={`mt-6 inline-flex items-center rounded-md px-4 py-2 text-sm hover:opacity-90 ${
                      plan.isPopular 
                        ? 'bg-[var(--brand-color)] text-white' 
                        : 'text-[var(--brand-color)] hover:underline'
                    }`}
                  >
                    Download the app
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section id="download" className="text-center">
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

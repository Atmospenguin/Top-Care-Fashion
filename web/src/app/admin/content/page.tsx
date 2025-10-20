"use client";
import { useEffect, useState } from "react";
import ImageListManager from "@/components/admin/ImageListManager";
import FeatureCardManager from "@/components/admin/FeatureCardManager";
import AssetLibraryManager from "../../../components/admin/AssetLibraryManager";

interface SiteStats {
  users: number;
  listings: number;
  sold: number;
  rating: number;
}

interface LandingContent {
  heroTitle: string;
  heroSubtitle: string;
  heroCarouselImages?: string[];
  aiFeatures?: {
    mixmatch?: { title?: string; desc?: string; images?: string[]; girlImages?: string[]; boyImages?: string[] };
    ailisting?: { title?: string; desc?: string; images?: string[] };
    search?: { title?: string; desc?: string; images?: string[] };
  };
}

interface Testimonial {
  id?: number;
  user: string;
  text: string;
  rating: number;
  tags: string[];
  featured: boolean;
}

interface PricingPlan {
  type: string;
  name: string;
  description: string;
  pricing: {
    monthly: string | null;
    quarterly: string | null;
    annual: string | null;
  };
  listingLimit: number | null;
  promotionPrice: string;
  promotionDiscount: string | null;
  commissionRate: string;
  mixMatchLimit: number | null;
  freePromotionCredits: number;
  sellerBadge: string | null;
  features: string[];
  isPopular: boolean;
}

export default function ContentManagementPage() {
  const [stats, setStats] = useState<SiteStats>({ users: 0, listings: 0, sold: 0, rating: 0 });
  const [content, setContent] = useState<LandingContent>({ heroTitle: "", heroSubtitle: "", heroCarouselImages: [], aiFeatures: {} });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>({ user: "", text: "", rating: 5, tags: [], featured: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetTarget, setAssetTarget] = useState<"carousel" | "feature1" | "feature2" | "feature3">("carousel");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [statsRes, contentRes, testimonialsRes, pricingRes, tagsRes] = await Promise.all([
        fetch("/api/site-stats"),
        fetch("/api/landing-content"),
        fetch("/api/feedback"),
        fetch("/api/pricing-plans"),
        fetch("/api/feedback/tags"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }
      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setContent(contentData);
      }
      if (testimonialsRes.ok) {
        const testimonialsData = await testimonialsRes.json();
        setTestimonials(testimonialsData.testimonials);
      }
      if (pricingRes.ok) {
        const pricingData = await pricingRes.json();
        setPricingPlans(pricingData.plans);
      }
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData.tags || []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStats() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/site-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stats),
      });
      alert(response.ok ? "Site stats updated successfully!" : "Failed to update site stats");
    } finally {
      setSaving(false);
    }
  }

  async function updateLandingContent() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/landing-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      alert(response.ok ? "Landing content updated successfully!" : "Failed to update landing content");
    } finally {
      setSaving(false);
    }
  }

  async function addTestimonial() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTestimonial),
      });
      if (response.ok) {
        setNewTestimonial({ user: "", text: "", rating: 5, tags: [], featured: true });
        fetchData();
        alert("Feedback added successfully!");
      } else {
        alert("Failed to add feedback");
      }
    } finally {
      setSaving(false);
    }
  }

  async function updatePricingPlans() {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/pricing-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans: pricingPlans }),
      });
      alert(response.ok ? "Pricing plans updated successfully!" : "Failed to update pricing plans");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const applyAssetsToHero = (urls: string[]) => {
    setContent((prev) => ({ ...prev, heroCarouselImages: urls }));
  };
  const applyAssetsToAllFeatures = (urls: string[]) => {
    setContent((prev) => ({
      ...prev,
      aiFeatures: {
        ...prev.aiFeatures,
        mixmatch: {
          title: prev.aiFeatures?.mixmatch?.title,
          desc: prev.aiFeatures?.mixmatch?.desc,
          girlImages: urls.slice(0, Math.ceil(urls.length / 2)),
          boyImages: urls.slice(Math.ceil(urls.length / 2)),
        },
        ailisting: {
          title: prev.aiFeatures?.ailisting?.title,
          desc: prev.aiFeatures?.ailisting?.desc,
          images: urls,
        },
        search: {
          title: prev.aiFeatures?.search?.title,
          desc: prev.aiFeatures?.search?.desc,
          images: urls,
        },
      },
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Content Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* (Moved) Site Statistics will appear after Feedback */}

        {/* Landing Page Content (full width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Landing Page Content</h2>
          {/* Assets managers for fixed subfolders */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">Assets subfolder:</span>
              <button className={`px-3 py-1 border rounded ${assetTarget === "carousel" ? "bg-black text-white" : ""}`} onClick={() => setAssetTarget("carousel")}>assets/carousel</button>
              <button className={`px-3 py-1 border rounded ${assetTarget === "feature1" ? "bg-black text-white" : ""}`} onClick={() => setAssetTarget("feature1")}>assets/feature1</button>
              <button className={`px-3 py-1 border rounded ${assetTarget === "feature2" ? "bg-black text-white" : ""}`} onClick={() => setAssetTarget("feature2")}>assets/feature2</button>
              <button className={`px-3 py-1 border rounded ${assetTarget === "feature3" ? "bg-black text-white" : ""}`} onClick={() => setAssetTarget("feature3")}>assets/feature3</button>
            </div>
            {assetTarget === "carousel" && (
              <AssetLibraryManager title="Assets (assets/carousel)" prefix="assets/carousel/" initialSelectedUrls={content.heroCarouselImages || []} onApply={applyAssetsToHero} />
            )}
            {assetTarget === "feature1" && (
              <AssetLibraryManager title="Assets (assets/feature1)" prefix="assets/feature1/" initialSelectedUrls={
                (content.aiFeatures?.mixmatch?.images && content.aiFeatures.mixmatch.images.length > 0)
                  ? content.aiFeatures.mixmatch.images
                  : (
                      (content.aiFeatures?.mixmatch?.girlImages && content.aiFeatures.mixmatch.girlImages.length > 0)
                        ? content.aiFeatures.mixmatch.girlImages
                        : (content.aiFeatures?.mixmatch?.boyImages || [])
                    )
              } onApply={(urls: string[]) => setContent((prev) => ({
                ...prev,
                aiFeatures: {
                  ...prev.aiFeatures,
                  mixmatch: {
                    title: prev.aiFeatures?.mixmatch?.title,
                    desc: prev.aiFeatures?.mixmatch?.desc,
                    // unified field
                    images: urls,
                    // clear legacy fields on write
                    girlImages: [],
                    boyImages: [],
                  },
                },
              }))} />
            )}
            {assetTarget === "feature2" && (
              <AssetLibraryManager title="Assets (assets/feature2)" prefix="assets/feature2/" initialSelectedUrls={content.aiFeatures?.ailisting?.images || []} onApply={(urls: string[]) => setContent((prev) => ({
                ...prev,
                aiFeatures: {
                  ...prev.aiFeatures,
                  ailisting: { title: prev.aiFeatures?.ailisting?.title, desc: prev.aiFeatures?.ailisting?.desc, images: urls },
                },
              }))} />
            )}
            {assetTarget === "feature3" && (
              <AssetLibraryManager title="Assets (assets/feature3)" prefix="assets/feature3/" initialSelectedUrls={content.aiFeatures?.search?.images || []} onApply={(urls: string[]) => setContent((prev) => ({
                ...prev,
                aiFeatures: {
                  ...prev.aiFeatures,
                  search: { title: prev.aiFeatures?.search?.title, desc: prev.aiFeatures?.search?.desc, images: urls },
                },
              }))} />
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="heroTitle" className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
              <input id="heroTitle" type="text" value={content.heroTitle} onChange={(e) => setContent({ ...content, heroTitle: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="heroSubtitle" className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
              <textarea id="heroSubtitle" value={content.heroSubtitle} onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <FeatureCardManager
                  label="Feature 1"
                  value={{
                    title: content.aiFeatures?.mixmatch?.title,
                    desc: content.aiFeatures?.mixmatch?.desc,
                    // unified field (fallback to legacy if empty)
                    images:
                      (content.aiFeatures?.mixmatch?.images && content.aiFeatures.mixmatch.images.length > 0)
                        ? content.aiFeatures.mixmatch.images
                        : (content.aiFeatures?.mixmatch?.girlImages || []),
                  }}
                  showImages={false}
                  onChange={(next) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      mixmatch: {
                        title: next.title,
                        desc: next.desc,
                        images: next.images || [],
                        girlImages: [],
                        boyImages: [],
                      },
                    },
                  })}
                />
              </div>
              <FeatureCardManager
                label="Feature 2"
                value={{
                  title: content.aiFeatures?.ailisting?.title,
                  desc: content.aiFeatures?.ailisting?.desc,
                  images: content.aiFeatures?.ailisting?.images || [],
                }}
                showImages={false}
                onChange={(next) => setContent({
                  ...content,
                  aiFeatures: {
                    ...content.aiFeatures,
                    ailisting: { title: next.title, desc: next.desc, images: next.images || [] },
                  },
                })}
              />
              <FeatureCardManager
                label="Feature 3"
                value={{
                  title: content.aiFeatures?.search?.title,
                  desc: content.aiFeatures?.search?.desc,
                  images: content.aiFeatures?.search?.images || [],
                }}
                showImages={false}
                onChange={(next) => setContent({
                  ...content,
                  aiFeatures: {
                    ...content.aiFeatures,
                    search: { title: next.title, desc: next.desc, images: next.images || [] },
                  },
                })}
              />
            </div>

            <button onClick={updateLandingContent} disabled={saving} className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50">{saving ? "Updating..." : "Update Content"}</button>
          </div>
        </div>

        {/* Featured Feedback (merged) */}
  <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 max-h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Featured Feedback</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-col min-h-0">
              <h3 className="font-medium mb-2">Add New</h3>
              <div className="space-y-4 flex-1">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                  <input id="userName" type="text" value={newTestimonial.user} onChange={(e) => setNewTestimonial({ ...newTestimonial, user: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="testimonialText" className="block text-sm font-medium text-gray-700 mb-1">Feedback Text</label>
                  <textarea id="testimonialText" value={newTestimonial.text} onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label htmlFor="testimonialRating" className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                  <input id="testimonialRating" type="number" min={1} max={5} value={newTestimonial.rating} onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) || 5 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const checked = newTestimonial.tags.includes(tag);
                      return (
                        <label key={tag} className={`text-xs px-2 py-1 rounded-full cursor-pointer border ${checked ? 'bg-[var(--brand-color)] text-white border-[var(--brand-color)]' : 'bg-white text-black border-black/10'}`}>
                          <input type="checkbox" className="hidden" checked={checked} onChange={(e) => {
                            setNewTestimonial({
                              ...newTestimonial,
                              tags: e.target.checked ? [...newTestimonial.tags, tag] : newTestimonial.tags.filter((t) => t !== tag),
                            });
                          }} />
                          <span>#{tag}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center">
                  <input id="testimonialFeatured" type="checkbox" checked={newTestimonial.featured} onChange={(e) => setNewTestimonial({ ...newTestimonial, featured: e.target.checked })} className="mr-2" />
                  <label htmlFor="testimonialFeatured" className="text-sm font-medium text-gray-700">Featured on homepage</label>
                </div>
                <button onClick={addTestimonial} disabled={saving || !newTestimonial.user || !newTestimonial.text} className="mt-auto w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50">{saving ? "Adding..." : "Add Feedback"}</button>
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              <h3 className="font-medium mb-2">Current</h3>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-sm font-medium">{testimonial.user}</strong>
                      <div className="text-yellow-500">{"*".repeat(testimonial.rating)}</div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">"{testimonial.text}"</p>
                    <div className="flex flex-wrap gap-1">
                      {testimonial.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Site Statistics (moved after feedback) */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Site Statistics</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="users" className="block text-sm font-medium text-gray-700 mb-1">Total Users</label>
              <input id="users" type="number" value={stats.users} onChange={(e) => setStats({ ...stats, users: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="listings" className="block text-sm font-medium text-gray-700 mb-1">Total Listings</label>
              <input id="listings" type="number" value={stats.listings} onChange={(e) => setStats({ ...stats, listings: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="sold" className="block text-sm font-medium text-gray-700 mb-1">Items Sold</label>
              <input id="sold" type="number" value={stats.sold} onChange={(e) => setStats({ ...stats, sold: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">Average Rating</label>
              <input id="rating" type="number" step="0.1" min="0" max="5" value={stats.rating} onChange={(e) => setStats({ ...stats, rating: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={updateStats} disabled={saving} className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50">{saving ? "Updating..." : "Update Statistics"}</button>
          </div>
        </div>

        {/* Pricing Plans Management */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Pricing Plans Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pricingPlans.map((plan, planIndex) => (
              <div key={plan.type} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 capitalize">{plan.type} Plan</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`${plan.type}-name`} className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                    <input id={`${plan.type}-name`} type="text" value={plan.name} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].name = e.target.value; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label htmlFor={`${plan.type}-description`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input id={`${plan.type}-description`} type="text" value={plan.description} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].description = e.target.value; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`${plan.type}-monthly`} className="block text-sm font-medium text-gray-700 mb-1">Monthly Price</label>
                      <input id={`${plan.type}-monthly`} type="number" step="0.01" value={plan.pricing.monthly || ''} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].pricing.monthly = e.target.value || null; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor={`${plan.type}-quarterly`} className="block text-sm font-medium text-gray-700 mb-1">Quarterly Price</label>
                      <input id={`${plan.type}-quarterly`} type="number" step="0.01" value={plan.pricing.quarterly || ''} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].pricing.quarterly = e.target.value || null; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor={`${plan.type}-annual`} className="block text-sm font-medium text-gray-700 mb-1">Annual Price</label>
                      <input id={`${plan.type}-annual`} type="number" step="0.01" value={plan.pricing.annual || ''} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].pricing.annual = e.target.value || null; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`${plan.type}-commission`} className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                      <input id={`${plan.type}-commission`} type="number" step="0.01" value={plan.commissionRate} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].commissionRate = e.target.value; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label htmlFor={`${plan.type}-promotion`} className="block text sm font-medium text-gray-700 mb-1">Promotion Price</label>
                      <input id={`${plan.type}-promotion`} type="number" step="0.01" value={plan.promotionPrice} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].promotionPrice = e.target.value; setPricingPlans(updated); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input id={`${plan.type}-popular`} type="checkbox" checked={plan.isPopular} onChange={(e) => { const updated = [...pricingPlans]; updated[planIndex].isPopular = e.target.checked; setPricingPlans(updated); }} className="mr-2" />
                    <label htmlFor={`${plan.type}-popular`} className="text-sm font-medium text-gray-700">Mark as Popular</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={updatePricingPlans} disabled={saving} className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50">{saving ? "Updating..." : "Update Pricing Plans"}</button>
        </div>
      </div>
    </div>
  );
}

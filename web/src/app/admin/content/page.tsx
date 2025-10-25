"use client";
import { useEffect, useMemo, useState } from "react";
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

interface FeedbackItem {
  id: number;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  message: string;
  rating?: number | null;
  tags: string[];
  featured: boolean;
  createdAt: string;
  associatedUserName?: string | null;
}

interface NewFeedbackForm {
  userName: string;
  userEmail: string;
  message: string;
  rating: number | null;
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
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [newFeedback, setNewFeedback] = useState<NewFeedbackForm>({ userName: "", userEmail: "", message: "", rating: 5, tags: [], featured: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetTarget, setAssetTarget] = useState<"carousel" | "feature1" | "feature2" | "feature3">("carousel");
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<number | null>(null);
  const [deletingFeedbackId, setDeletingFeedbackId] = useState<number | null>(null);
  const [feedbackQuery, setFeedbackQuery] = useState("");
  const filteredFeedbacks = useMemo(() => {
    const term = feedbackQuery.trim().toLowerCase();
    if (!term) return feedbacks;
    return feedbacks.filter((feedback) => {
      const fields = [
        feedback.userName,
        feedback.userEmail,
        feedback.userId,
        feedback.associatedUserName,
        feedback.message,
        ...(feedback.tags || []),
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return fields.some((value) => value.includes(term));
    });
  }, [feedbackQuery, feedbacks]);
  const featuredFeedbacks = useMemo(() => filteredFeedbacks.filter((feedback) => feedback.featured), [filteredFeedbacks]);
  const nonFeaturedFeedbacks = useMemo(() => filteredFeedbacks.filter((feedback) => !feedback.featured), [filteredFeedbacks]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [statsRes, contentRes, feedbackRes, pricingRes, tagsRes] = await Promise.all([
        fetch("/api/site-stats"),
        fetch("/api/landing-content"),
        fetch("/api/admin/feedback", { cache: "no-store" }),
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
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        const items = (feedbackData.feedbacks || []) as any[];
        setFeedbacks(
          items.map((item) => ({
            id: Number(item.id),
            userId: item.userId ?? null,
            userEmail: item.userEmail ?? null,
            userName: item.userName ?? null,
            message: item.message ?? "",
            rating: item.rating === null || item.rating === undefined ? null : Number(item.rating),
            tags: Array.isArray(item.tags) ? item.tags : [],
            featured: Boolean(item.featured),
            createdAt: item.createdAt ?? "",
            associatedUserName: item.associatedUserName ?? null,
          }))
        );
      } else {
        setFeedbacks([]);
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

  async function addFeedback() {
    if (!newFeedback.message.trim()) {
      alert("Feedback message cannot be empty");
      return;
    }
    if (newFeedback.featured && !newFeedback.userName.trim()) {
      alert("User name is required for featured feedback");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        userName: newFeedback.userName.trim() || undefined,
        userEmail: newFeedback.userEmail.trim() || undefined,
        message: newFeedback.message.trim(),
        rating: newFeedback.rating ?? undefined,
        tags: newFeedback.tags,
        featured: newFeedback.featured,
      };
      const response = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setNewFeedback({ userName: "", userEmail: "", message: "", rating: 5, tags: [], featured: true });
        fetchData();
        alert("Feedback added successfully!");
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to add feedback");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleFeedbackFeatured(feedback: FeedbackItem) {
    const nextFeatured = !feedback.featured;
    if (!nextFeatured) {
      const confirmed = confirm("Remove this feedback from featured items?");
      if (!confirmed) return;
    }
    try {
      setUpdatingFeedbackId(feedback.id);
      const response = await fetch(`/api/admin/feedback/${feedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to update feedback");
        return;
      }
      fetchData();
    } finally {
      setUpdatingFeedbackId(null);
    }
  }

  async function deleteFeedback(id: number) {
    if (!confirm("Delete this feedback entry? This action cannot be undone.")) {
      return;
    }
    try {
      setDeletingFeedbackId(id);
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || "Failed to delete feedback");
        return;
      }
      fetchData();
    } finally {
      setDeletingFeedbackId(null);
    }
  }

  const formatDate = (value: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing {filteredFeedbacks.length} of {feedbacks.length} entries
              {feedbackQuery.trim() ? ` for “${feedbackQuery.trim()}”` : ""}
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none md:w-64">
                <input
                  type="search"
                  value={feedbackQuery}
                  onChange={(e) => setFeedbackQuery(e.target.value)}
                  placeholder="Search by name, email, tag, or message…"
                  className="w-full rounded-md border border-gray-300 pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {feedbackQuery && (
                  <button
                    type="button"
                    onClick={() => setFeedbackQuery("")}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-col min-h-0">
              <h3 className="font-medium mb-2">Add New</h3>
              <div className="space-y-4 flex-1">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    id="userName"
                    type="text"
                    value={newFeedback.userName}
                    onChange={(e) => setNewFeedback({ ...newFeedback, userName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name to show publicly"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required when marking the feedback as featured.</p>
                </div>
                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input
                    id="userEmail"
                    type="email"
                    value={newFeedback.userEmail}
                    onChange={(e) => setNewFeedback({ ...newFeedback, userEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="testimonialText" className="block text-sm font-medium text-gray-700 mb-1">Feedback Message</label>
                  <textarea
                    id="testimonialText"
                    value={newFeedback.message}
                    onChange={(e) => setNewFeedback({ ...newFeedback, message: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What did they say?"
                  />
                </div>
                <div>
                  <label htmlFor="testimonialRating" className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5, optional)</label>
                  <input
                    id="testimonialRating"
                    type="number"
                    min={1}
                    max={5}
                    value={newFeedback.rating ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setNewFeedback({ ...newFeedback, rating: null });
                        return;
                      }
                      const numeric = Number(value);
                      if (Number.isNaN(numeric)) {
                        return;
                      }
                      const clamped = Math.max(1, Math.min(5, Math.round(numeric)));
                      setNewFeedback({ ...newFeedback, rating: clamped });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-1">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const checked = newFeedback.tags.includes(tag);
                      return (
                        <label key={tag} className={`text-xs px-2 py-1 rounded-full cursor-pointer border ${checked ? 'bg-[var(--brand-color)] text-white border-[var(--brand-color)]' : 'bg-white text-black border-black/10'}`}>
                          <input type="checkbox" className="hidden" checked={checked} onChange={(e) => {
                            setNewFeedback({
                              ...newFeedback,
                              tags: e.target.checked ? [...newFeedback.tags, tag] : newFeedback.tags.filter((t) => t !== tag),
                            });
                          }} />
                          <span>#{tag}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center">
                  <input id="testimonialFeatured" type="checkbox" checked={newFeedback.featured} onChange={(e) => setNewFeedback({ ...newFeedback, featured: e.target.checked })} className="mr-2" />
                  <label htmlFor="testimonialFeatured" className="text-sm font-medium text-gray-700">Featured on homepage</label>
                </div>
                <button
                  onClick={addFeedback}
                  disabled={
                    saving ||
                    !newFeedback.message.trim() ||
                    (newFeedback.featured && !newFeedback.userName.trim())
                  }
                  className="mt-auto w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Feedback"}
                </button>
              </div>
            </div>
            <div className="flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                <section>
                  <h3 className="font-medium mb-2">Current Featured</h3>
                  <div className="space-y-4">
                    {featuredFeedbacks.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-center text-gray-500 bg-gray-50">
                        {feedbackQuery.trim()
                          ? "No featured feedback matches your search."
                          : "No featured feedback yet. Add one on the left to populate the landing page."}
                      </div>
                    ) : (
                      featuredFeedbacks.map((feedback) => (
                        <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-gray-400">Feedback #{feedback.id}</div>
                              <div className="text-base font-semibold text-gray-900">
                                {feedback.userName || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {feedback.userEmail || "No email provided"}
                              </div>
                              {feedback.userId && (
                                <div className="text-xs text-gray-500">
                                  User ID: {feedback.userId}
                                  {feedback.associatedUserName ? ` (${feedback.associatedUserName})` : ""}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              {typeof feedback.rating === "number" && !Number.isNaN(feedback.rating) ? (
                                <div className="text-yellow-500 font-semibold">
                                  {"★".repeat(Math.round(feedback.rating))}{"☆".repeat(5 - Math.round(feedback.rating))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No rating</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">{formatDate(feedback.createdAt)}</div>
                            </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {feedback.message}
                          </div>

                          {feedback.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {feedback.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              Featured · Added {formatDate(feedback.createdAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              {feedback.userEmail && (
                                <button
                                  onClick={() => {
                                    window.location.href = `mailto:${feedback.userEmail}?subject=Re: Your feedback&body=Hi ${feedback.userName || ""},%0A%0AThank you for your feedback about our platform.%0A%0ABest regards,%0ATop Care Fashion Team`;
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Reply via Email
                                </button>
                              )}
                              <button
                                onClick={() => toggleFeedbackFeatured(feedback)}
                                disabled={updatingFeedbackId === feedback.id}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                              >
                                {updatingFeedbackId === feedback.id ? "Saving..." : "Remove Featured"}
                              </button>
                              <button
                                onClick={() => deleteFeedback(feedback.id)}
                                disabled={deletingFeedbackId === feedback.id}
                                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingFeedbackId === feedback.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="font-medium mb-2">Other Feedback</h3>
                  <div className="space-y-4">
                    {nonFeaturedFeedbacks.length === 0 ? (
                      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-sm text-center text-gray-500 bg-gray-50">
                        {feedbackQuery.trim()
                          ? "No feedback matches your search."
                          : "All feedback is currently featured."}
                      </div>
                    ) : (
                      nonFeaturedFeedbacks.map((feedback) => (
                        <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-wide text-gray-400">Feedback #{feedback.id}</div>
                              <div className="text-base font-semibold text-gray-900">
                                {feedback.userName || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {feedback.userEmail || "No email provided"}
                              </div>
                              {feedback.userId && (
                                <div className="text-xs text-gray-500">
                                  User ID: {feedback.userId}
                                  {feedback.associatedUserName ? ` (${feedback.associatedUserName})` : ""}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              {typeof feedback.rating === "number" && !Number.isNaN(feedback.rating) ? (
                                <div className="text-yellow-500 font-semibold">
                                  {"★".repeat(Math.round(feedback.rating))}{"☆".repeat(5 - Math.round(feedback.rating))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-400">No rating</div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">{formatDate(feedback.createdAt)}</div>
                            </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {feedback.message}
                          </div>

                          {feedback.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {feedback.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                              Submitted {formatDate(feedback.createdAt)}
                            </div>
                            <div className="flex items-center gap-2">
                              {feedback.userEmail && (
                                <button
                                  onClick={() => {
                                    window.location.href = `mailto:${feedback.userEmail}?subject=Re: Your feedback&body=Hi ${feedback.userName || ""},%0A%0AThank you for your feedback about our platform.%0A%0ABest regards,%0ATop Care Fashion Team`;
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                  Reply via Email
                                </button>
                              )}
                              <button
                                onClick={() => toggleFeedbackFeatured(feedback)}
                                disabled={updatingFeedbackId === feedback.id}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                              >
                                {updatingFeedbackId === feedback.id ? "Saving..." : "Mark Featured"}
                              </button>
                              <button
                                onClick={() => deleteFeedback(feedback.id)}
                                disabled={deletingFeedbackId === feedback.id}
                                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingFeedbackId === feedback.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
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

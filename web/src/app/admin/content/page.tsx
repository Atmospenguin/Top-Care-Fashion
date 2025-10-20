"use client";
import { useState, useEffect } from "react";

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
    mixmatch?: { title?: string; desc?: string; girlImages?: string[]; boyImages?: string[] };
    ailisting?: { title?: string; desc?: string; images?: string[] };
    search?: { title?: string; desc?: string; images?: string[] };
  }
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
  const [content, setContent] = useState<LandingContent>({ heroTitle: '', heroSubtitle: '', heroCarouselImages: [], aiFeatures: {} });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [newTestimonial, setNewTestimonial] = useState<Testimonial>({
    user: '', text: '', rating: 5, tags: [], featured: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, contentRes, testimonialsRes, pricingRes, tagsRes] = await Promise.all([
        fetch('/api/site-stats'),
        fetch('/api/landing-content'),
        fetch('/api/feedback'), // Unified feedback endpoint
        fetch('/api/pricing-plans'),
        fetch('/api/feedback/tags')
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
    } catch (error) {
      console.error('Error fetching content management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/site-stats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      });

      if (response.ok) {
        alert('Site stats updated successfully!');
      } else {
        alert('Failed to update site stats');
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      alert('Error updating stats');
    } finally {
      setSaving(false);
    }
  };

  const updateLandingContent = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/landing-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });

      if (response.ok) {
        alert('Landing content updated successfully!');
      } else {
        alert('Failed to update landing content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Error updating content');
    } finally {
      setSaving(false);
    }
  };

  const addTestimonial = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTestimonial)
      });

      if (response.ok) {
        setNewTestimonial({ user: '', text: '', rating: 5, tags: [], featured: true });
        fetchData(); // Refresh testimonials
        alert('Feedback added successfully!');
      } else {
        alert('Failed to add feedback');
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
      alert('Error adding feedback');
    } finally {
      setSaving(false);
    }
  };

  const updatePricingPlans = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/pricing-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans: pricingPlans })
      });

      if (response.ok) {
        alert('Pricing plans updated successfully!');
      } else {
        alert('Failed to update pricing plans');
      }
    } catch (error) {
      console.error('Error updating pricing plans:', error);
      alert('Error updating pricing plans');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8">Content Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Site Statistics */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Site Statistics</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="users" className="block text-sm font-medium text-gray-700 mb-1">
                Total Users
              </label>
              <input
                id="users"
                type="number"
                value={stats.users}
                onChange={(e) => setStats({...stats, users: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="listings" className="block text-sm font-medium text-gray-700 mb-1">
                Total Listings
              </label>
              <input
                id="listings"
                type="number"
                value={stats.listings}
                onChange={(e) => setStats({...stats, listings: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="sold" className="block text-sm font-medium text-gray-700 mb-1">
                Items Sold
              </label>
              <input
                id="sold"
                type="number"
                value={stats.sold}
                onChange={(e) => setStats({...stats, sold: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
                Average Rating
              </label>
              <input
                id="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={stats.rating}
                onChange={(e) => setStats({...stats, rating: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={updateStats}
              disabled={saving}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Statistics'}
            </button>
          </div>
        </div>

        {/* Landing Page Content */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Landing Page Content</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="heroTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Hero Title
              </label>
              <input
                id="heroTitle"
                type="text"
                value={content.heroTitle}
                onChange={(e) => setContent({...content, heroTitle: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="heroSubtitle" className="block text-sm font-medium text-gray-700 mb-1">
                Hero Subtitle
              </label>
              <textarea
                id="heroSubtitle"
                value={content.heroSubtitle}
                onChange={(e) => setContent({...content, heroSubtitle: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Hero Carousel Images (comma separated URLs or paths) */}
            <div>
              <label htmlFor="heroImages" className="block text-sm font-medium text-gray-700 mb-1">
                Hero Carousel Images (comma separated)
              </label>
              <input
                id="heroImages"
                type="text"
                value={(content.heroCarouselImages || []).join(", ")}
                onChange={(e) => setContent({ ...content, heroCarouselImages: e.target.value.split(/\s*,\s*/).filter(Boolean) })}
                placeholder="/TOPApp/Cart.png, /TOPApp/Listing%20Detail.png, ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* AI Features editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mix & Match */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-medium mb-2">Mix &amp; Match</h3>
                <input
                  type="text"
                  placeholder="Title"
                  value={content.aiFeatures?.mixmatch?.title || ''}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      mixmatch: { ...(content.aiFeatures?.mixmatch || {}), title: e.target.value }
                    }
                  })}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={content.aiFeatures?.mixmatch?.desc || ''}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      mixmatch: { ...(content.aiFeatures?.mixmatch || {}), desc: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="mixmatch-girl-images" className="block text-xs text-gray-600 mb-1">Girl Images (comma separated)</label>
                <input
                  id="mixmatch-girl-images"
                  type="text"
                  value={(content.aiFeatures?.mixmatch?.girlImages || []).join(", ")}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      mixmatch: { ...(content.aiFeatures?.mixmatch || {}), girlImages: e.target.value.split(/\s*,\s*/).filter(Boolean) }
                    }
                  })}
                  placeholder="/TOPApp/mixnmatch1/Mix%20%26%20Match.png, ..."
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="mixmatch-boy-images" className="block text-xs text-gray-600 mb-1">Boy Images (comma separated)</label>
                <input
                  id="mixmatch-boy-images"
                  type="text"
                  value={(content.aiFeatures?.mixmatch?.boyImages || []).join(", ")}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      mixmatch: { ...(content.aiFeatures?.mixmatch || {}), boyImages: e.target.value.split(/\s*,\s*/).filter(Boolean) }
                    }
                  })}
                  placeholder="/TOPApp/mixnmatch2/Mix%20%26%20Match.png, ..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* AI Listing */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-medium mb-2">AI Listing</h3>
                <input
                  type="text"
                  placeholder="Title"
                  value={content.aiFeatures?.ailisting?.title || ''}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      ailisting: { ...(content.aiFeatures?.ailisting || {}), title: e.target.value }
                    }
                  })}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={content.aiFeatures?.ailisting?.desc || ''}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      ailisting: { ...(content.aiFeatures?.ailisting || {}), desc: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="ailisting-images" className="block text-xs text-gray-600 mb-1">Images (comma separated)</label>
                <input
                  id="ailisting-images"
                  type="text"
                  value={(content.aiFeatures?.ailisting?.images || []).join(", ")}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      ailisting: { ...(content.aiFeatures?.ailisting || {}), images: e.target.value.split(/\s*,\s*/).filter(Boolean) }
                    }
                  })}
                  placeholder="/TOPApp/AI-Listing.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Search */}
              <div className="border border-gray-200 rounded-lg p-3">
                <h3 className="font-medium mb-2">Search</h3>
                <input
                  type="text"
                  placeholder="Title"
                  value={content.aiFeatures?.search?.title || ''}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      search: { ...(content.aiFeatures?.search || {}), title: e.target.value }
                    }
                  })}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Description"
                  value={content.aiFeatures?.search?.desc || ''}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      search: { ...(content.aiFeatures?.search || {}), desc: e.target.value }
                    }
                  })}
                  rows={2}
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="search-images" className="block text-xs text-gray-600 mb-1">Images (comma separated)</label>
                <input
                  id="search-images"
                  type="text"
                  value={(content.aiFeatures?.search?.images || []).join(", ")}
                  onChange={(e) => setContent({
                    ...content,
                    aiFeatures: {
                      ...content.aiFeatures,
                      search: { ...(content.aiFeatures?.search || {}), images: e.target.value.split(/\s*,\s*/).filter(Boolean) }
                    }
                  })}
                  placeholder="/TOPApp/Search%20Result.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={updateLandingContent}
              disabled={saving}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Content'}
            </button>
          </div>
        </div>

        {/* Add New Featured Feedback */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Add New Featured Feedback</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                User Name
              </label>
              <input
                id="userName"
                type="text"
                value={newTestimonial.user}
                onChange={(e) => setNewTestimonial({...newTestimonial, user: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="testimonialText" className="block text-sm font-medium text-gray-700 mb-1">
                Feedback Text
              </label>
              <textarea
                id="testimonialText"
                value={newTestimonial.text}
                onChange={(e) => setNewTestimonial({...newTestimonial, text: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="testimonialRating" className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <input
                id="testimonialRating"
                type="number"
                min="1"
                max="5"
                value={newTestimonial.rating}
                onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value) || 5})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-1">Tags</div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const checked = newTestimonial.tags.includes(tag);
                  return (
                    <label key={tag} className={`text-xs px-2 py-1 rounded-full cursor-pointer border ${checked ? 'bg-[var(--brand-color)] text-white border-[var(--brand-color)]' : 'bg-white text-black border-black/10'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={(e) => {
                          setNewTestimonial({
                            ...newTestimonial,
                            tags: e.target.checked
                              ? [...newTestimonial.tags, tag]
                              : newTestimonial.tags.filter((t) => t !== tag)
                          });
                        }}
                      />
                      <span>#{tag}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <input
                id="testimonialFeatured"
                type="checkbox"
                checked={newTestimonial.featured}
                onChange={(e) => setNewTestimonial({...newTestimonial, featured: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="testimonialFeatured" className="text-sm font-medium text-gray-700">Featured on homepage</label>
            </div>
            <button
              onClick={addTestimonial}
              disabled={saving || !newTestimonial.user || !newTestimonial.text}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Feedback'}
            </button>
          </div>
        </div>

        {/* Current Featured Feedback */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Current Featured Feedback</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <strong className="text-sm font-medium">{testimonial.user}</strong>
                  <div className="text-yellow-500">
                    {"*".repeat(testimonial.rating)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">"{testimonial.text}"</p>
                <div className="flex flex-wrap gap-1">
                  {testimonial.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
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
                    <label htmlFor={`${plan.type}-name`} className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <input
                      id={`${plan.type}-name`}
                      type="text"
                      value={plan.name}
                      onChange={(e) => {
                        const updatedPlans = [...pricingPlans];
                        updatedPlans[planIndex].name = e.target.value;
                        setPricingPlans(updatedPlans);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor={`${plan.type}-description`} className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <input
                      id={`${plan.type}-description`}
                      type="text"
                      value={plan.description}
                      onChange={(e) => {
                        const updatedPlans = [...pricingPlans];
                        updatedPlans[planIndex].description = e.target.value;
                        setPricingPlans(updatedPlans);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor={`${plan.type}-monthly`} className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Price
                      </label>
                      <input
                        id={`${plan.type}-monthly`}
                        type="number"
                        step="0.01"
                        value={plan.pricing.monthly || ''}
                        onChange={(e) => {
                          const updatedPlans = [...pricingPlans];
                          updatedPlans[planIndex].pricing.monthly = e.target.value || null;
                          setPricingPlans(updatedPlans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${plan.type}-quarterly`} className="block text-sm font-medium text-gray-700 mb-1">
                        Quarterly Price
                      </label>
                      <input
                        id={`${plan.type}-quarterly`}
                        type="number"
                        step="0.01"
                        value={plan.pricing.quarterly || ''}
                        onChange={(e) => {
                          const updatedPlans = [...pricingPlans];
                          updatedPlans[planIndex].pricing.quarterly = e.target.value || null;
                          setPricingPlans(updatedPlans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${plan.type}-annual`} className="block text-sm font-medium text-gray-700 mb-1">
                        Annual Price
                      </label>
                      <input
                        id={`${plan.type}-annual`}
                        type="number"
                        step="0.01"
                        value={plan.pricing.annual || ''}
                        onChange={(e) => {
                          const updatedPlans = [...pricingPlans];
                          updatedPlans[planIndex].pricing.annual = e.target.value || null;
                          setPricingPlans(updatedPlans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={`${plan.type}-commission`} className="block text-sm font-medium text-gray-700 mb-1">
                        Commission Rate (%)
                      </label>
                      <input
                        id={`${plan.type}-commission`}
                        type="number"
                        step="0.01"
                        value={plan.commissionRate}
                        onChange={(e) => {
                          const updatedPlans = [...pricingPlans];
                          updatedPlans[planIndex].commissionRate = e.target.value;
                          setPricingPlans(updatedPlans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${plan.type}-promotion`} className="block text-sm font-medium text-gray-700 mb-1">
                        Promotion Price
                      </label>
                      <input
                        id={`${plan.type}-promotion`}
                        type="number"
                        step="0.01"
                        value={plan.promotionPrice}
                        onChange={(e) => {
                          const updatedPlans = [...pricingPlans];
                          updatedPlans[planIndex].promotionPrice = e.target.value;
                          setPricingPlans(updatedPlans);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id={`${plan.type}-popular`}
                      type="checkbox"
                      checked={plan.isPopular}
                      onChange={(e) => {
                        const updatedPlans = [...pricingPlans];
                        updatedPlans[planIndex].isPopular = e.target.checked;
                        setPricingPlans(updatedPlans);
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`${plan.type}-popular`} className="text-sm font-medium text-gray-700">
                      Mark as Popular
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={updatePricingPlans}
            disabled={saving}
            className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Pricing Plans'}
          </button>
        </div>
      </div>
    </div>
  );
}

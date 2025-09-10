"use client";

import { useEffect, useState } from "react";
import type { Feedback, FeedbackType } from "@/types/admin";

interface ExtendedFeedback extends Feedback {
  selected?: boolean;
}

interface NewFeedback {
  userEmail?: string;
  userName?: string;
  message: string;
  rating?: number;
  tags: string[];
  featured: boolean;
  feedbackType: FeedbackType;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<ExtendedFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<ExtendedFeedback | null>(null);
  const [filter, setFilter] = useState<"all" | "feedback" | "testimonial" | "with-email" | "anonymous">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState<NewFeedback>({
    message: '',
    tags: [],
    featured: false,
    feedbackType: 'feedback'
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/feedback", { cache: "no-store" });
      const json = await res.json();
      setFeedbacks((json.feedbacks || []).map((f: Feedback) => ({ ...f, selected: false })));
    } catch (e: any) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const deleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(id);
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        load();
      } else {
        console.error('Failed to delete feedback');
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
    } finally {
      setDeleting(null);
    }
  };

  const addFeedback = async () => {
    if (!newFeedback.message) return;
    
    // Validate testimonial requirements
    if (newFeedback.feedbackType === 'testimonial' && !newFeedback.userName) {
      alert('User name is required for testimonials');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newFeedback)
      });

      if (res.ok) {
        setNewFeedback({
          message: '',
          tags: [],
          featured: false,
          feedbackType: 'feedback'
        });
        setShowAddForm(false);
        load();
      } else {
        console.error('Failed to add feedback');
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    switch (filter) {
      case "feedback": return feedback.feedbackType === 'feedback';
      case "testimonial": return feedback.feedbackType === 'testimonial';
      case "with-email": return feedback.userEmail;
      case "anonymous": return !feedback.userEmail;
      default: return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Feedback & Testimonials Management</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Feedback & Testimonials Management</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">Error: {error}</div>
          <button 
            onClick={load}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Feedback & Testimonials Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {feedbacks.length} total • {feedbacks.filter(f => f.feedbackType === 'testimonial').length} testimonials • {feedbacks.filter(f => f.feedbackType === 'feedback').length} feedback
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add New
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "all", label: "All" },
          { key: "feedback", label: "Feedback" },
          { key: "testimonial", label: "Testimonials" },
          { key: "with-email", label: "With Email" },
          { key: "anonymous", label: "Anonymous" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-2 text-sm rounded-md transition-colors ${
              filter === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
              {tab.key === "all" ? feedbacks.length :
               tab.key === "feedback" ? feedbacks.filter(f => f.feedbackType === 'feedback').length :
               tab.key === "testimonial" ? feedbacks.filter(f => f.feedbackType === 'testimonial').length :
               tab.key === "with-email" ? feedbacks.filter(f => f.userEmail).length :
               feedbacks.filter(f => !f.userEmail).length}
            </span>
          </button>
        ))}
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Add New Item</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newFeedback.feedbackType}
                onChange={(e) => setNewFeedback({...newFeedback, feedbackType: e.target.value as FeedbackType})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="feedback">Feedback</option>
                <option value="testimonial">Testimonial</option>
              </select>
            </div>

            {newFeedback.feedbackType === 'testimonial' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Name *</label>
                  <input
                    type="text"
                    value={newFeedback.userName || ''}
                    onChange={(e) => setNewFeedback({...newFeedback, userName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Display name for testimonial"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={newFeedback.rating || 5}
                    onChange={(e) => setNewFeedback({...newFeedback, rating: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <input
                    type="text"
                    value={newFeedback.tags.join(', ')}
                    onChange={(e) => setNewFeedback({
                      ...newFeedback, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="mixmatch, ailisting, premium"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newFeedback.featured}
                    onChange={(e) => setNewFeedback({...newFeedback, featured: e.target.checked})}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">Featured on homepage</label>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
              <input
                type="email"
                value={newFeedback.userEmail || ''}
                onChange={(e) => setNewFeedback({...newFeedback, userEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={newFeedback.message}
                onChange={(e) => setNewFeedback({...newFeedback, message: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the message..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addFeedback}
                disabled={saving || !newFeedback.message || (newFeedback.feedbackType === 'testimonial' && !newFeedback.userName)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="grid gap-4">
        {filteredFeedbacks.map((feedback) => (
          <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium">
                      {feedback.feedbackType === 'testimonial' ? 'Testimonial' : 'Feedback'} #{feedback.id}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feedback.feedbackType === 'testimonial' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {feedback.feedbackType === 'testimonial' ? 'Testimonial' : 'Feedback'}
                    </span>
                    {feedback.featured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feedback.userEmail 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {feedback.userEmail ? 'Registered' : 'Anonymous'}
                    </span>
                  </div>
                  
                  <div className="mb-3 space-y-1">
                    {feedback.userEmail && (
                      <p className="text-gray-600">
                        <strong>Email:</strong> {feedback.userEmail}
                      </p>
                    )}
                    {feedback.userName && (
                      <p className="text-gray-600">
                        <strong>Name:</strong> {feedback.userName}
                      </p>
                    )}
                    {feedback.rating && (
                      <p className="text-gray-600">
                        <strong>Rating:</strong> 
                        <span className="ml-2 text-yellow-500">
                          {"★".repeat(feedback.rating)}{"☆".repeat(5 - feedback.rating)}
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md mb-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{feedback.message}</p>
                  </div>
                  
                  {feedback.tags && feedback.tags.length > 0 && (
                    <div className="mb-3">
                      <strong className="text-gray-600 text-sm">Tags:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feedback.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <div className="font-medium">{feedback.id}</div>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium">
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium capitalize">
                    {feedback.feedbackType}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => setSelectedFeedback(feedback)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Full Details
                </button>
                <div className="flex items-center space-x-3">
                  {feedback.userEmail && (
                    <button
                      onClick={() => {
                        window.location.href = `mailto:${feedback.userEmail}?subject=Re: Your ${feedback.feedbackType}&body=Hi,\n\nThank you for your ${feedback.feedbackType} about our platform.\n\nBest regards,\nTop Care Fashion Team`;
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Reply via Email
                    </button>
                  )}
                  <button
                    onClick={() => deleteFeedback(feedback.id)}
                    disabled={deleting === feedback.id}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting === feedback.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFeedbacks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {filter === "all" 
            ? "No items found. User feedback and testimonials will appear here when submitted."
            : filter === "feedback"
            ? "No feedback found."
            : filter === "testimonial"
            ? "No testimonials found."
            : filter === "with-email"
            ? "No items from registered users found."
            : "No anonymous items found."
          }
        </div>
      )}

      {/* Details Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedFeedback(null)}>
          <div className="bg-white rounded-lg p-6 w-[min(90vw,600px)] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {selectedFeedback.feedbackType === 'testimonial' ? 'Testimonial' : 'Feedback'} Details
              </h3>
              <button 
                onClick={() => setSelectedFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">ID:</span>
                  <div>{selectedFeedback.id}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <div className="capitalize">{selectedFeedback.feedbackType}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <div>{selectedFeedback.userEmail || 'Not provided'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <div>{selectedFeedback.userName || 'Not provided'}</div>
                </div>
                {selectedFeedback.rating && (
                  <div>
                    <span className="font-medium text-gray-700">Rating:</span>
                    <div className="text-yellow-500">
                      {"★".repeat(selectedFeedback.rating)}{"☆".repeat(5 - selectedFeedback.rating)}
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Created:</span>
                  <div>{formatDate(selectedFeedback.createdAt)}</div>
                </div>
              </div>
              
              {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                <div>
                  <span className="font-medium text-gray-700">Tags:</span>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedFeedback.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="font-medium text-gray-700">Message:</span>
                <div className="mt-2 p-4 bg-gray-50 rounded-md">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                {selectedFeedback.userEmail && (
                  <button
                    onClick={() => {
                      window.location.href = `mailto:${selectedFeedback.userEmail}?subject=Re: Your ${selectedFeedback.feedbackType}&body=Hi,\n\nThank you for your ${selectedFeedback.feedbackType} about our platform.\n\nBest regards,\nTop Care Fashion Team`;
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Reply via Email
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedFeedback(null);
                    deleteFeedback(selectedFeedback.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
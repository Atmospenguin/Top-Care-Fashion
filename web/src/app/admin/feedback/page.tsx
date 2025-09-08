"use client";

import { useEffect, useState } from "react";
import type { Feedback } from "@/types/admin";

interface ExtendedFeedback extends Feedback {
  selected?: boolean;
}

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<ExtendedFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<ExtendedFeedback | null>(null);
  const [filter, setFilter] = useState<"all" | "with-email" | "anonymous">("all");

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
    if (!confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
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

  const filteredFeedbacks = feedbacks.filter(feedback => {
    switch (filter) {
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
        <h2 className="text-xl font-semibold">Feedback Management</h2>
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
        <h2 className="text-xl font-semibold">Feedback Management</h2>
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
        <h2 className="text-xl font-semibold">Feedback Management</h2>
        <div className="text-sm text-gray-600">
          {feedbacks.length} total • {feedbacks.filter(f => f.userEmail).length} with email
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "all", label: "All Feedback" },
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
               tab.key === "with-email" ? feedbacks.filter(f => f.userEmail).length :
               feedbacks.filter(f => !f.userEmail).length}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <div className="grid gap-4">
        {filteredFeedbacks.map((feedback) => (
          <div key={feedback.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium">Feedback #{feedback.id}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feedback.userEmail 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {feedback.userEmail ? 'Registered User' : 'Anonymous'}
                    </span>
                  </div>
                  
                  {feedback.userEmail && (
                    <p className="text-gray-600 mb-3">
                      <strong>From:</strong> {feedback.userEmail}
                    </p>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-md mb-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{feedback.message}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Feedback ID:</span>
                  <div className="font-medium">{feedback.id}</div>
                </div>
                <div>
                  <span className="text-gray-500">Received:</span>
                  <div className="font-medium">
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <div className="font-medium">
                    {feedback.userEmail ? 'Registered' : 'Anonymous'}
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
                        window.location.href = `mailto:${feedback.userEmail}?subject=Re: Your feedback&body=Hi,\n\nThank you for your feedback about our platform.\n\nBest regards,\nTop Care Fashion Team`;
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
            ? "No feedback found. User feedback will appear here when submitted."
            : filter === "with-email"
            ? "No feedback from registered users found."
            : "No anonymous feedback found."
          }
        </div>
      )}

      {/* Feedback Details Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedFeedback(null)}>
          <div className="bg-white rounded-lg p-6 w-[min(90vw,600px)] max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Feedback Details</h3>
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
                  <span className="font-medium text-gray-700">Feedback ID:</span>
                  <div>{selectedFeedback.id}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <div>{selectedFeedback.userEmail ? 'Registered User' : 'Anonymous'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <div>{selectedFeedback.userEmail || 'Not provided'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Received:</span>
                  <div>{formatDate(selectedFeedback.createdAt)}</div>
                </div>
              </div>
              
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
                      window.location.href = `mailto:${selectedFeedback.userEmail}?subject=Re: Your feedback&body=Hi,\n\nThank you for your feedback about our platform.\n\nBest regards,\nTop Care Fashion Team`;
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
                  Delete Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

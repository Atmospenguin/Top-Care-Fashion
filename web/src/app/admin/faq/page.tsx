"use client";

import { useEffect, useState } from "react";
import type { FaqQuery } from "@/types/admin";

interface ExtendedFaq extends FaqQuery {
  editing?: boolean;
  associatedUserName?: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<ExtendedFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "answered" | "pending">("all");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/faq", { cache: "no-store" });
      const json = await res.json();
      setFaqs((json.faqs || []).map((faq: FaqQuery) => ({ ...faq, editing: false })));
    } catch (e: any) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (id: string) => {
    setFaqs(faqs.map(faq => ({ 
      ...faq, 
      editing: faq.id === id ? true : false 
    })));
  };

  const cancelEdit = (id: string) => {
    setFaqs(faqs.map(faq => ({ 
      ...faq, 
      editing: faq.id === id ? false : faq.editing 
    })));
    load(); // Reload to reset changes
  };

  const saveEdit = async (faq: ExtendedFaq) => {
    try {
      setSaving(faq.id);
      const updateData = {
        id: faq.id,
        answer: faq.answer
      };

      const res = await fetch("/api/admin/faq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        setFaqs(faqs.map(f => ({ 
          ...f, 
          editing: f.id === faq.id ? false : f.editing 
        })));
        load();
      } else {
        console.error('Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
    } finally {
      setSaving(null);
    }
  };

  const quickAnswer = async (id: string, answer: string) => {
    try {
      setSaving(id);
      const res = await fetch("/api/admin/faq", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, answer })
      });

      if (res.ok) {
        load();
      } else {
        console.error('Failed to update answer');
      }
    } catch (error) {
      console.error('Error updating answer:', error);
    } finally {
      setSaving(null);
    }
  };

  const updateField = (id: string, field: keyof FaqQuery, value: any) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  const filteredFaqs = faqs.filter(faq => {
    switch (filter) {
      case "answered": return faq.answer && faq.answer.trim();
      case "pending": return !faq.answer || !faq.answer.trim();
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
        <h2 className="text-xl font-semibold">FAQ Management</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">FAQ Management</h2>
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
        <h2 className="text-xl font-semibold">FAQ Management</h2>
        <div className="text-sm text-gray-600">
          {faqs.length} total • {faqs.filter(f => !f.answer || !f.answer.trim()).length} pending
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "all", label: "All Questions" },
          { key: "pending", label: "Pending Answer" },
          { key: "answered", label: "Answered" }
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
              {tab.key === "all" ? faqs.length :
               tab.key === "answered" ? faqs.filter(f => f.answer && f.answer.trim()).length :
               faqs.filter(f => !f.answer || !f.answer.trim()).length}
            </span>
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="grid gap-4">
        {filteredFaqs.map((faq) => (
          <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            {faq.editing ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label htmlFor={`question-${faq.id}`} className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                    {faq.question}
                  </div>
                </div>
                <div>
                  <label htmlFor={`answer-${faq.id}`} className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                  <textarea
                    id={`answer-${faq.id}`}
                    value={faq.answer || ''}
                    onChange={(e) => updateField(faq.id, 'answer', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Provide a helpful answer to this question..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => cancelEdit(faq.id)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={saving === faq.id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(faq)}
                    disabled={saving === faq.id}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === faq.id ? 'Saving...' : 'Save Answer'}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium">FAQ #{faq.id}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        faq.answer && faq.answer.trim()
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {faq.answer && faq.answer.trim() ? 'Answered' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Question:</p>
                      <p className="text-gray-900 font-medium">{faq.question}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Answer:</p>
                      {faq.answer && faq.answer.trim() ? (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">{faq.answer}</p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <p className="text-yellow-800 italic">Answer pending...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="mb-3 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Asked by:</span>
                    {faq.userId ? (
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          User: {faq.associatedUserName || faq.userId}
                        </span>
                        {faq.userEmail && (
                          <span className="text-sm text-gray-600">{faq.userEmail}</span>
                        )}
                      </div>
                    ) : faq.userEmail ? (
                      <span className="text-sm text-gray-600">{faq.userEmail}</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Anonymous</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">FAQ ID:</span>
                    <div className="font-medium">{faq.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Asked:</span>
                    <div className="font-medium">
                      {formatDate(faq.createdAt)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <div className="font-medium">
                      {faq.answer && faq.answer.trim() ? 'Answered' : 'Pending'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Answered:</span>
                    <div className="font-medium">
                      {faq.answeredAt ? formatDate(faq.answeredAt) : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Provide clear, helpful answers to improve user experience
                  </div>
                  <div className="flex items-center space-x-3">
                    {(!faq.answer || !faq.answer.trim()) && (
                      <button
                        onClick={() => {
                          const answer = prompt("Provide an answer:", "");
                          if (answer !== null && answer.trim()) {
                            quickAnswer(faq.id, answer);
                          }
                        }}
                        disabled={saving === faq.id}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Quick Answer
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(faq.id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {faq.answer && faq.answer.trim() ? 'Edit Answer' : 'Answer'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFaqs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {filter === "all" 
            ? "No FAQ questions found. User questions will appear here when submitted."
            : filter === "pending"
            ? "No pending questions found. Great job keeping up with user questions!"
            : "No answered questions found."
          }
        </div>
      )}
    </div>
  );
}

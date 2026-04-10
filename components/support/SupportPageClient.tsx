"use client";

import { useState, useEffect } from "react";

interface Reply {
  from: string;
  adminName?: string;
  message: string;
  createdAt: string;
}

interface SupportRequest {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  ticketNumber?: string;
  replies: Reply[];
}

const CATEGORIES = [
  { value: "bug", label: "Something isn't working" },
  { value: "content", label: "Content issue or suggestion" },
  { value: "account", label: "Account or subscription" },
  { value: "feedback", label: "General feedback" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  content: "Content Issue",
  account: "Account",
  feedback: "Feedback",
  other: "Other",
};

export default function SupportPageClient() {
  // Form state
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  // Requests state
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchRequests = () => {
    fetch("/api/support")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: SupportRequest[]) => setRequests(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !message.trim()) return;

    setSending(true);
    setFormError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      setSent(true);
      setCategory("");
      setSubject("");
      setMessage("");
      // Refresh the list after a short delay
      setTimeout(() => {
        fetchRequests();
        setSent(false);
      }, 2000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (requestId: string) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyToRequestId: requestId, message: replyText.trim() }),
      });
      if (!res.ok) throw new Error();
      setReplyText("");
      fetchRequests();
    } catch {
      // Error
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-8">
      {/* New Request Form */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
          New Request
        </h2>

        {sent ? (
          <div className="py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium">Request sent!</p>
            <p className="text-sm text-gray-500 mt-1">We&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">What do you need help with?</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder="Tell us what's happening..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
            )}

            <button
              type="submit"
              disabled={sending || !category || !message.trim()}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        )}
      </div>

      {/* Request History */}
      {!loading && requests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">
            My Requests
          </h2>
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {req.ticketNumber && (
                          <span className="text-[10px] font-mono font-bold text-gray-600">
                            #{req.ticketNumber}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          req.status === "open"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-green-50 text-green-600"
                        }`}>
                          {req.status === "open" ? "Open" : "Resolved"}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {CATEGORY_LABELS[req.category] || req.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1 truncate">
                        {req.subject || req.message.slice(0, 60)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {req.replies.length > 0 && (
                        <span className="text-[10px] text-blue-600 font-medium">
                          {req.replies.length} {req.replies.length === 1 ? "reply" : "replies"}
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === req.id ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {expandedId === req.id && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {/* Original message */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">You wrote</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.message}</p>
                    </div>

                    {/* Replies */}
                    {req.replies.map((r, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-3 ${
                          r.from === "admin"
                            ? "bg-blue-50 ml-4"
                            : "bg-gray-50 mr-4"
                        }`}
                      >
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          {r.from === "admin" ? "CogniLift Team" : "You"}
                          <span className="text-gray-400 ml-2">{formatDate(r.createdAt)}</span>
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
                      </div>
                    ))}

                    {/* User reply form — for open tickets that have admin replies */}
                    {req.status === "open" && req.replies.some((r) => r.from === "admin") && (
                      <div className="space-y-2 pt-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          rows={2}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleReply(req.id)}
                          disabled={replying || !replyText.trim()}
                          className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {replying ? "Sending..." : "Reply"}
                        </button>
                      </div>
                    )}

                    {/* Closed ticket message */}
                    {req.status === "closed" && (
                      <p className="text-xs text-gray-400 text-center py-2">This request has been resolved.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

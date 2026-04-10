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
  uid: string;
  userName: string;
  userEmail: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  ticketNumber?: string;
  createdAt: string;
  replies: Reply[];
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug Report",
  content: "Content Issue",
  account: "Account",
  feedback: "Feedback",
  other: "Other",
};

export default function SupportManager() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRepliesFor, setShowRepliesFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  // Direct message state
  const [dmOpen, setDmOpen] = useState(false);
  const [dmUid, setDmUid] = useState("");
  const [dmTitle, setDmTitle] = useState("");
  const [dmMessage, setDmMessage] = useState("");
  const [dmSending, setDmSending] = useState(false);
  const [dmSent, setDmSent] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/admin/support" : `/api/admin/support?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRequests(data);
    } catch {
      // Error fetching
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleReply = async (requestId: string, closeTicket: boolean) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, message: replyText.trim(), closeTicket }),
      });
      if (!res.ok) throw new Error();
      setReplyText("");
      fetchRequests();
    } catch {
      // Error replying
    } finally {
      setReplying(false);
    }
  };

  const toggleStatus = async (requestId: string, newStatus: string) => {
    await fetch("/api/admin/support", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, status: newStatus }),
    });
    fetchRequests();
  };

  const sendDirectMessage = async () => {
    if (!dmUid.trim() || !dmMessage.trim()) return;
    setDmSending(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendToUid: dmUid.trim(), message: dmMessage.trim(), notificationTitle: dmTitle.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      setDmSent(true);
      setDmMessage("");
      setDmTitle("");
      setDmUid("");
      setTimeout(() => { setDmSent(false); setDmOpen(false); }, 2000);
    } catch {
      // Error sending
    } finally {
      setDmSending(false);
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
    <div className="space-y-6">
      {/* Header with filter and DM button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["open", "closed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === f
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f === "open" ? "Open" : "Closed"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDmOpen(!dmOpen)}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Send Direct Message
        </button>
      </div>

      {/* Direct Message Panel */}
      {dmOpen && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-800">Send notification to a user</h3>
          <input
            type="text"
            value={dmUid}
            onChange={(e) => setDmUid(e.target.value)}
            placeholder="User UID"
            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          <input
            type="text"
            value={dmTitle}
            onChange={(e) => setDmTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white"
          />
          <textarea
            value={dmMessage}
            onChange={(e) => setDmMessage(e.target.value)}
            placeholder="Message"
            rows={3}
            className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm bg-white resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={sendDirectMessage}
              disabled={dmSending || !dmUid.trim() || !dmMessage.trim()}
              className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {dmSending ? "Sending..." : dmSent ? "Sent!" : "Send"}
            </button>
            <button
              onClick={() => setDmOpen(false)}
              className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Support Requests */}
      {loading ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">Loading support requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-400">No {filter !== "all" ? filter : ""} support requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Request header */}
              <button
                onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {req.ticketNumber && (
                        <span className="text-[10px] font-mono font-bold text-gray-700">
                          #{req.ticketNumber}
                        </span>
                      )}
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        req.status === "open"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {req.status}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {CATEGORY_LABELS[req.category] || req.category}
                      </span>
                      {req.replies.length > 0 && (
                        <span className="text-[10px] text-gray-400">
                          {req.replies.length} {req.replies.length === 1 ? "reply" : "replies"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-800 mt-1">
                      {req.subject || req.message.slice(0, 80)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {req.userName} ({req.userEmail}) · {formatDate(req.createdAt)}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${expandedId === req.id ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded content */}
              {expandedId === req.id && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                  {/* Original message */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">User message</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.message}</p>
                  </div>

                  {/* UID for quick DM */}
                  <p className="text-[10px] text-gray-400 font-mono">UID: {req.uid}</p>

                  {/* Replies thread — collapsed for closed tickets */}
                  {req.replies.length > 0 && (
                    <>
                      {req.status === "closed" && showRepliesFor !== req.id ? (
                        <button
                          onClick={() => setShowRepliesFor(req.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Show {req.replies.length} {req.replies.length === 1 ? "reply" : "replies"}
                        </button>
                      ) : (
                        <div className="space-y-2">
                          {req.status === "closed" && (
                            <button
                              onClick={() => setShowRepliesFor(null)}
                              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                            >
                              Hide replies
                            </button>
                          )}
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
                                {r.from === "admin" ? `Admin (${r.adminName || "Admin"})` : "User"}
                                <span className="text-gray-400 ml-2">{formatDate(r.createdAt)}</span>
                              </p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Reply form — only for open tickets */}
                  {req.status === "open" && (
                    <div className="space-y-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(req.id, false)}
                          disabled={replying || !replyText.trim()}
                          className="px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {replying ? "Sending..." : "Reply"}
                        </button>
                        <button
                          onClick={() => handleReply(req.id, true)}
                          disabled={replying || !replyText.trim()}
                          className="px-4 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Reply & Close
                        </button>
                        <button
                          onClick={() => toggleStatus(req.id, "closed")}
                          className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Close without reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reopen closed ticket */}
                  {req.status === "closed" && (
                    <button
                      onClick={() => toggleStatus(req.id, "open")}
                      className="px-4 py-2 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

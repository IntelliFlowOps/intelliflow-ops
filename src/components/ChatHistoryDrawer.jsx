import { useEffect, useState } from "react";

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

export default function ChatHistoryDrawer({ open, onClose, onLoadChat }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(Array.isArray(data.history) ? data.history : []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteChat(id) {
    setDeleting(id);
    try {
      await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setHistory(prev => prev.filter(c => c.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {}
    setDeleting(null);
  }

  async function deleteAll() {
    if (!confirm("Delete all chat history?")) return;
    await fetch("/api/history", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setHistory([]);
    setExpanded(null);
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[150] md:hidden bg-black/40" onClick={onClose} />
      )}
      <div className={`fixed top-0 right-0 h-full z-[160] w-full max-w-sm bg-[#08131f] border-l border-white/[0.06] shadow-[−4px_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div>
            <div className="text-sm font-semibold text-white">Chat History</div>
            <div className="text-xs text-slate-500">Last {history.length} conversations</div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button type="button" onClick={deleteAll} className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 rounded-lg hover:bg-red-500/10">
                Clear all
              </button>
            )}
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 hover:text-white transition">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 rounded-full border-2 border-white/10 border-t-cyan-400 animate-spin" />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm text-slate-400">No chat history yet</div>
              <div className="text-xs text-slate-600 mt-1">Conversations are saved automatically</div>
            </div>
          )}

          {!loading && history.map(chat => (
            <div key={chat.id} className="rounded-[18px] border border-white/[0.06] bg-white/[0.03] overflow-hidden">
              <div
                className="flex items-start justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition"
                onClick={() => setExpanded(expanded === chat.id ? null : chat.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${chat.assistantType === "marketer" ? "bg-violet-500/15 text-violet-400" : "bg-cyan-500/15 text-cyan-400"}`}>
                      {chat.assistantType === "marketer" ? "Marketer" : "Founder"}
                    </span>
                    <span className="text-[10px] text-slate-500">{timeAgo(chat.savedAt)}</span>
                  </div>
                  <div className="text-sm text-slate-300 truncate">{chat.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{chat.messages.length} messages</div>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                    disabled={deleting === chat.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  >
                    {deleting === chat.id ? "..." : "✕"}
                  </button>
                </div>
              </div>

              {expanded === chat.id && (
                <div className="border-t border-white/[0.04] px-4 py-3 space-y-3 max-h-80 overflow-y-auto">
                  {chat.messages.filter(m => m.role !== "system").map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === "user" ? "bg-white/[0.06] text-white" : "bg-cyan-300/[0.06] text-slate-200"}`}>
                        {typeof msg.content === "string" ? msg.content : "[Image attached]"}
                      </div>
                    </div>
                  ))}
                  {onLoadChat && (
                    <button
                      type="button"
                      onClick={() => { onLoadChat(chat); onClose(); }}
                      className="w-full rounded-xl bg-cyan-400/10 border border-cyan-400/20 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-400/20 transition mt-1"
                    >
                      Load this conversation
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

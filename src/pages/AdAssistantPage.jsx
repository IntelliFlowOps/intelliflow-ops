import { useEffect, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import ChatHistoryDrawer from "../components/ChatHistoryDrawer.jsx";
import { buildFounderAssistantContext } from "../lib/assistantContextBuilders.js";

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [] }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full items-end gap-2 message-enter ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-cyan-300"
          style={{background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(2,132,199,0.1))", border: "1px solid rgba(6,182,212,0.25)"}}>
          IF
        </div>
      )}
      <div
        className={`relative max-w-[78%] overflow-hidden text-sm leading-7 whitespace-pre-wrap backdrop-blur-3xl transition-all duration-200 ${
          isUser
            ? "rounded-[28px] rounded-br-[8px] px-5 py-3.5 text-white"
            : "rounded-[28px] rounded-bl-[8px] px-5 py-3.5 text-slate-100"
        }`}
        style={isUser ? {
          background: "linear-gradient(135deg, #0e7490, #0891b2)",
          boxShadow: "0 4px 24px rgba(6,182,212,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
        } : {
          background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)"
        }}
      >
        <div className="relative z-10">
          {attachments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-2xl bg-white/[0.05] shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                >
                  {attachment.previewUrl && attachment.type?.startsWith("image/") ? (
                    <img
                      src={attachment.previewUrl}
                      alt={attachment.name}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center px-3 text-center text-xs text-slate-300">
                      {attachment.name}
                    </div>
                  )}
                  <div className="px-2 py-1 text-[11px] text-slate-300 truncate">
                    {attachment.name}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>{content}</div>
        </div>
      </div>
      {isUser && (
        <div className="shrink-0 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{background: "linear-gradient(135deg, #0e7490, #0891b2)", border: "1px solid rgba(6,182,212,0.4)"}}>
          U
        </div>
      )}
    </div>
  );
}

function AttachmentChip({ attachment, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100 shadow-[0_10px_24px_rgba(34,211,238,0.08)] backdrop-blur-2xl">
      <span className="max-w-[150px] truncate">{attachment.name}</span>
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        className="text-cyan-100/70 transition hover:text-white"
        aria-label={`Remove ${attachment.name}`}
      >
        ✕
      </button>
    </div>
  );
}

export default function AdAssistantPage() {
  const { data } = useSheetData();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.memories)) setMemories(d.memories); })
      .catch(() => {});
  }, []);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Drop the problem, the numbers, or the messy situation. I’ll help you find the strongest next move.",
      attachments: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, [attachments]);

  function normalizeFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;
    if (remainingSlots <= 0) return;
    incoming.slice(0, remainingSlots)
      .filter(file => file.size <= MAX_FILE_SIZE_MB * 1024 * 1024)
      .forEach(file => {
        if (file.type?.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              const MAX_DIM = 1024;
              let w = img.width;
              let h = img.height;
              if (w > MAX_DIM || h > MAX_DIM) {
                if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
                else { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
              }
              canvas.width = w;
              canvas.height = h;
              canvas.getContext("2d").drawImage(img, 0, 0, w, h);
              const compressed = canvas.toDataURL("image/jpeg", 0.7);
              const base64 = compressed.split(",")[1];
              setAttachments((prev) => [...prev, {
                id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
                name: file.name,
                type: "image/jpeg",
                file,
                previewUrl: URL.createObjectURL(file),
                base64,
              }]);
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
  }

  function removeAttachment(id) {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function handleFileChange(event) {
    normalizeFiles(event.target.files);
    event.target.value = "";
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();

    const related = event.relatedTarget;
    if (!event.currentTarget.contains(related)) {
      setDragActive(false);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer?.files?.length) {
      normalizeFiles(event.dataTransfer.files);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || loading) return;

    const userMessage = {
      role: "user",
      content: trimmed || "Review the attached files/screenshots and help me.",
      attachments,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setAttachments([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantType: "founder",
          memories: memories,
          message: trimmed,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          attachments: attachments.map((attachment) => ({
            name: attachment.name,
            type: attachment.type,
            base64: attachment.base64 || null,
          })),
          context: buildFounderAssistantContext(data),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get founder assistant response.");
      }

      const dataResponse = await response.json();
      const reply =
        dataResponse?.reply ||
        dataResponse?.message ||
        dataResponse?.content ||
        "I couldn’t generate a response. Check the chat route and response shape.";

      const finalMessages = [...nextMessages, { role: "assistant", content: reply, attachments: [] }];
      setMessages(finalMessages);
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assistantType: "founder",
            title: (trimmed || "Conversation").slice(0, 60),
            messages: finalMessages.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content : "[attachment]" })),
            savedAt: new Date().toISOString(),
          }),
        });
      } catch (_) {}
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "The founder assistant request failed. Check the API route wiring and make sure the response returns a reply, message, or content field.",
          attachments: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#040a12] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[8%] h-64 w-64 rounded-full bg-cyan-400/7 blur-3xl" />
        <div className="absolute right-[8%] top-[16%] h-80 w-80 rounded-full bg-sky-400/7 blur-3xl" />
        <div className="absolute bottom-[6%] left-1/3 h-72 w-72 rounded-full bg-white/4 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[42px] bg-white/[0.04] shadow-[0_40px_120px_rgba(0,0,0,0.50)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-0 rounded-[42px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent_16%,transparent_84%,rgba(255,255,255,0.018))]" />

          <div className="grid min-h-[82vh] grid-rows-[1fr_auto]">
            <div
              ref={scrollRef}
              className="relative overflow-y-auto px-4 py-6 md:px-6 md:py-7"
            >
              <div className="mb-5 flex justify-center">
                <div className="rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-300 shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
                  Founder Assistant
                </div>
              </div>

              <div className="space-y-5">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${index}`}
                    role={message.role}
                    content={message.content}
                    attachments={message.attachments || []}
                  />
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="relative overflow-hidden rounded-[30px] bg-cyan-300/[0.06] px-5 py-4 shadow-[0_22px_80px_rgba(34,211,238,0.10)] backdrop-blur-3xl">
                      <div className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_34%,rgba(34,211,238,0.05))]" />
                      <div className="relative z-10 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300" />
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" />
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment) => (
                      <AttachmentChip
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={removeAttachment}
                      />
                    ))}
                  </div>
                )}

                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden rounded-[34px] p-3 shadow-[0_22px_70px_rgba(0,0,0,0.30)] backdrop-blur-3xl transition ${
                    dragActive ? "bg-cyan-400/[0.08]" : "bg-white/[0.045]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_26%,rgba(34,211,238,0.05),transparent_72%)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-2xl text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/14"
                      aria-label="Add files"
                      title="Add files or screenshots"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!loading && (input.trim() || attachments.length > 0)) {
                              handleSubmit(e);
                            }
                          }
                        }}
                        rows={3}
                        placeholder="Ask about growth, delivery, pricing, churn, hiring, sales, ops, objections, or the next move. Enter to send, Shift+Enter for new line."
                        className="min-h-[92px] w-full resize-none rounded-[24px] bg-[#071521]/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-2xl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || (!input.trim() && attachments.length === 0)}
                      className="h-[54px] rounded-[22px] bg-cyan-300/10 px-5 text-sm font-medium text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Thinking..." : "Send"}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    <ChatHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import ChatHistoryDrawer from "../components/ChatHistoryDrawer.jsx";
import { buildFounderAssistantContext } from "../lib/assistantContextBuilders.js";
import TypewriterText from "../components/TypewriterText.jsx";

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [], isLast = false, animating = false, onAnimComplete }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full items-end gap-2.5 ${isUser ? "justify-end user-send" : "justify-start ai-fade-in"}`}>
      {!isUser && (
        <div className="shrink-0 mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-cyan-300 avatar-pulse"
          style={{background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(2,132,199,0.08))", border: "1px solid rgba(6,182,212,0.2)"}}>
          IF
        </div>
      )}
      <div
        className={`relative max-w-[85%] sm:max-w-[78%] overflow-hidden text-[15px] leading-7 whitespace-pre-wrap break-words ${
          isUser
            ? "rounded-[20px] rounded-br-[6px] px-4 sm:px-5 py-3 sm:py-3.5 text-white"
            : "border-l-2 border-cyan-500/50 pl-4 py-3 text-zinc-200"
        }`}
        style={isUser ? {
          background: "linear-gradient(135deg, #0e5c73, #0891b2)",
          boxShadow: "0 8px 32px rgba(8,145,178,0.18)"
        } : {}}
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
          <div>{animating ? <TypewriterText text={content} speed={8} onComplete={onAnimComplete} /> : content}</div>
          {!isUser && isLast && !animating && (
            <div className="relative h-[1px] mt-2">
              <div className="trace-bottom absolute left-0 top-0 h-full bg-cyan-400/40 rounded-full" />
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div className="shrink-0 mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{background: "linear-gradient(135deg, #0e7490, #0891b2)", border: "1px solid rgba(6,182,212,0.4)", boxShadow: "0 4px 12px rgba(6,182,212,0.15)"}}>
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

  const defaultFounderMessages = [
    { role: "assistant", content: "Drop the problem, the numbers, or the messy situation. I will help you find the strongest next move.", attachments: [] },
  ];
  const [messages, setMessages] = useState(function () {
    try {
      var saved = sessionStorage.getItem("chat_founder");
      return saved ? JSON.parse(saved) : defaultFounderMessages;
    } catch (_e) {
      return defaultFounderMessages;
    }
  });
  useEffect(function () { sessionStorage.setItem("chat_founder", JSON.stringify(messages)); }, [messages]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const prevLengthRef = useRef(messages.length);
  const [animatingIndex, setAnimatingIndex] = useState(-1);

  useEffect(function () {
    if (messages.length > prevLengthRef.current) {
      var lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") {
        setAnimatingIndex(messages.length - 1);
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

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
          "x-api-secret": "INTELLIFLOW_OPS_2026",
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
          body: JSON.stringify({ chat: {
            assistantType: "founder",
            title: (trimmed || "Conversation").slice(0, 60),
            messages: finalMessages.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content : "[attachment]" })),
            savedAt: new Date().toISOString(),
          } }),
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
    <div className="min-h-screen overflow-x-hidden w-full max-w-[100vw] text-white" style={{ background: 'linear-gradient(180deg, #08090b 0%, #0c0e14 100%)' }}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[10%] top-[15%] h-[300px] w-[300px] rounded-full blur-[120px]" style={{ background: 'rgba(6,182,212,0.04)' }} />
        <div className="absolute right-[5%] bottom-[20%] h-[250px] w-[250px] rounded-full blur-[100px]" style={{ background: 'rgba(6,182,212,0.03)' }} />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-3 sm:px-4 py-4 sm:py-6">
        <div className="overflow-hidden rounded-[20px] sm:rounded-[28px]"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 40px 100px rgba(0,0,0,0.4)' }}>

          <div className="grid min-h-[85vh] sm:min-h-[82vh] grid-rows-[1fr_auto]">
            <div
              ref={scrollRef}
              className="relative overflow-y-auto overflow-x-hidden px-3 sm:px-5 py-4 sm:py-6"
            >
              <div className="mb-4 sm:mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl text-sm avatar-pulse"
                    style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(2,132,199,0.08))', border: '1px solid rgba(6,182,212,0.2)' }}>
                    ⬡
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-white">Founder Intelligence</div>
                    <div className="text-[11px] text-zinc-500">Strategic co-founder</div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center space-y-4 prompts-slide-up">
                    <div className="flex justify-center mb-4" style={{ transform: 'scale(1.5)' }}>
                      <div className="quantum-icon">
                        <div className="q-ring" />
                        <div className="q-ring2" />
                        <div className="q-dot q-d1" />
                        <div className="q-dot q-d2" />
                        <div className="q-dot q-d3" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-light tracking-wide gradient-text-cyan">
                      Strategic Partner
                    </div>
                    <div className="text-[13px] italic text-zinc-500 max-w-xs">
                      Growth strategy, financial analysis, team decisions, and the next move.
                    </div>
                  </div>
                )}
                {messages.map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${index}`}
                    role={message.role}
                    content={message.content}
                    attachments={message.attachments || []}
                    isLast={index === messages.length - 1}
                    animating={index === animatingIndex}
                    onAnimComplete={function () { setAnimatingIndex(-1); }}
                  />
                ))}
                {messages.length > 0 && !loading && (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <div className="quantum-icon">
                      <div className="q-ring" />
                      <div className="q-ring2" />
                      <div className="q-dot q-d1" />
                      <div className="q-dot q-d2" />
                      <div className="q-dot q-d3" />
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-3 px-4 py-3 ai-fade-in">
                    <div className="relative w-full h-[2px] bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="trace-sweep absolute inset-y-0 w-[40%] rounded-full"
                           style={{ background: 'linear-gradient(90deg, transparent, #0891b2, transparent)' }} />
                    </div>
                    <div className="cursor-blink w-[2px] h-4 bg-cyan-400 rounded-full shrink-0" />
                  </div>
                )}
                {false && (
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

            <div className="px-3 pb-3 sm:px-5 sm:pb-4" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
              <form onSubmit={handleSubmit} className="space-y-2">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-1">
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
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-xl transition-all duration-200 ${
                    dragActive ? "bg-cyan-400/[0.06]" : ""
                  }`}
                  style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="relative z-10 flex items-end gap-2 sm:gap-3 p-2 sm:p-3">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg text-zinc-400 transition-colors hover:text-cyan-300 hover:bg-white/[0.04]"
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
                        rows={2}
                        placeholder="Strategy, finances, team, growth, operations — ask anything..."
                        className="assistant-input min-h-[44px] w-full resize-none rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-300"
                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || (!input.trim() && attachments.length === 0)}
                      className="send-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-30"
                      style={{ background: (loading || (!input.trim() && attachments.length === 0)) ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #0891b2, #06b6d4)' }}
                    >
                      <span className="text-sm font-medium text-white">{loading ? "..." : "\u2191"}</span>
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

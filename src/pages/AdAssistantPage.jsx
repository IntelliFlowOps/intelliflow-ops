import { useEffect, useMemo, useRef, useState } from "react";

const EXAMPLE_QUESTIONS = [
  "What is the highest-leverage move to get us closer to 25 clients this month?",
  "What breaks at scale if we keep onboarding this way?",
  "What is our weakest conversion bottleneck right now?",
  "Should we broaden ICP or fix close rate first?",
  "What should we change on the offer to improve sign-up rate?",
  "Where are we leaking revenue operationally?",
];

const MODES = [
  {
    id: "founder",
    label: "Founder Mode",
    description: "Growth, bottlenecks, CAC, churn, scale decisions",
  },
  {
    id: "ad-builder",
    label: "Ad Builder",
    description: "Hooks, offers, angles, CTA, creatives, copy",
  },
];

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [], mode }) {
  const isUser = role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "relative max-w-[90%] overflow-hidden rounded-[24px] px-4 py-3 whitespace-pre-wrap text-sm leading-6 backdrop-blur-xl",
          isUser
            ? "border border-white/8 bg-white/[0.06] text-white shadow-[0_10px_35px_rgba(0,0,0,0.22)]"
            : "border border-cyan-300/12 bg-cyan-400/[0.08] text-slate-100 shadow-[0_0_30px_rgba(34,211,238,0.08)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_38%,rgba(34,211,238,0.05))]" />

        {!isUser && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_45%)]" />
        )}

        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-70">
            <span>{isUser ? "Founder" : "Assistant"}</span>
            {mode && (
              <span className="rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-0.5 text-[9px] text-cyan-100/80">
                {mode === "ad-builder" ? "Ad Builder" : "Founder Mode"}
              </span>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.05] backdrop-blur-xl"
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

                  <div className="border-t border-white/8 px-2 py-1 text-[11px] text-slate-300 truncate">
                    {attachment.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>{content}</div>
        </div>
      </div>
    </div>
  );
}

function AttachmentChip({ attachment, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 backdrop-blur-xl">
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

function ModePill({ mode, activeMode, onClick }) {
  const active = activeMode === mode.id;

  return (
    <button
      type="button"
      onClick={() => onClick(mode.id)}
      className={[
        "rounded-full px-3 py-1.5 text-xs transition backdrop-blur-xl",
        active
          ? "border border-cyan-300/20 bg-cyan-400/12 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)]"
          : "border border-white/8 bg-white/[0.04] text-slate-300 hover:border-cyan-300/15 hover:bg-cyan-400/[0.08] hover:text-slate-100",
      ].join(" ")}
      title={mode.description}
    >
      {mode.label}
    </button>
  );
}

export default function AdAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      mode: "founder",
      content:
        "I’m locked in on the path to 2,000 clients. Bring me the bottleneck, the numbers, or the decision you need pressure-tested.",
      attachments: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("founder");
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

  const compactExamples = useMemo(() => EXAMPLE_QUESTIONS.slice(0, 6), []);

  function normalizeFiles(fileList) {
    const incoming = Array.from(fileList || []);
    const remainingSlots = MAX_ATTACHMENTS - attachments.length;

    if (remainingSlots <= 0) return;

    const nextFiles = incoming.slice(0, remainingSlots).reduce((acc, file) => {
      const tooLarge = file.size > MAX_FILE_SIZE_MB * 1024 * 1024;
      if (tooLarge) return acc;

      acc.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type || "application/octet-stream",
        file,
        previewUrl: file.type?.startsWith("image/") ? URL.createObjectURL(file) : "",
      });

      return acc;
    }, []);

    if (nextFiles.length) {
      setAttachments((prev) => [...prev, ...nextFiles]);
    }
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

  function handleExampleClick(example) {
    setInput(example);
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
      mode: activeMode,
      content: trimmed || "Review the attached files/screenshots and help me.",
      attachments,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setAttachments([]);

    try {
      const response = await fetch("/api/founder-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          mode: activeMode,
          messages: nextMessages.map((message) => ({
            role: message.role,
            mode: message.mode,
            content: message.content,
            attachments: (message.attachments || []).map((attachment) => ({
              name: attachment.name,
              type: attachment.type,
            })),
          })),
          attachments: attachments.map((attachment) => ({
            name: attachment.name,
            type: attachment.type,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get assistant response.");
      }

      const data = await response.json();
      const reply =
        data?.reply ||
        data?.message ||
        data?.content ||
        "I couldn’t generate a response. Check the assistant route and response shape.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          mode: activeMode,
          content: reply,
          attachments: [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          mode: activeMode,
          content:
            "The assistant request failed. Check the API route wiring and make sure the response returns a reply, message, or content field.",
          attachments: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),rgba(7,17,31,0.97)_42%)] shadow-[0_0_60px_rgba(34,211,238,0.06)] backdrop-blur-2xl">
          <div className="border-b border-white/6 px-5 py-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-2xl border border-cyan-300/18 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.14)] backdrop-blur-xl">
                  <div className="absolute inset-2 rounded-xl border border-cyan-300/12" />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
                  <div className="absolute inset-0 animate-pulse rounded-2xl border border-cyan-200/8" />
                </div>

                <div>
                  <h1 className="text-lg font-semibold tracking-wide text-white">
                    Ad Assistant
                  </h1>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/65">
                    IntelliFlow Communications
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 md:flex">
                {MODES.map((mode) => (
                  <ModePill
                    key={mode.id}
                    mode={mode}
                    activeMode={activeMode}
                    onClick={setActiveMode}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-h-[80vh] flex-col">
            <div
              ref={scrollRef}
              className="relative flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6"
            >
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute left-[8%] top-12 h-32 w-32 rounded-full bg-cyan-400/6 blur-3xl" />
                <div className="absolute right-[12%] top-24 h-36 w-36 rounded-full bg-cyan-300/6 blur-3xl" />
                <div className="absolute bottom-24 left-1/3 h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl" />
              </div>

              <div className="relative z-10 space-y-4">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${index}`}
                    role={message.role}
                    content={message.content}
                    attachments={message.attachments || []}
                    mode={message.mode}
                  />
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] border border-cyan-300/12 bg-cyan-400/[0.08] px-4 py-3 text-sm text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.08)] backdrop-blur-xl">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] opacity-60">
                        Assistant
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-white/6 px-4 py-4 md:px-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="md:hidden">
                  <div className="flex flex-wrap gap-2">
                    {MODES.map((mode) => (
                      <ModePill
                        key={mode.id}
                        mode={mode}
                        activeMode={activeMode}
                        onClick={setActiveMode}
                      />
                    ))}
                  </div>
                </div>

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
                  className={[
                    "relative overflow-hidden rounded-[26px] border p-3 transition backdrop-blur-2xl",
                    dragActive
                      ? "border-cyan-300/20 bg-cyan-400/[0.08] shadow-[0_0_35px_rgba(34,211,238,0.10)]"
                      : "border-white/6 bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,0.04),transparent)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.08] text-2xl text-cyan-100 transition backdrop-blur-xl hover:bg-cyan-400/[0.14]"
                      aria-label="Add files"
                      title="Add files or screenshots"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        rows={3}
                        placeholder={
                          activeMode === "ad-builder"
                            ? "Drop screenshots, ads, landing pages, or ask for hooks, offers, CTA, creatives, and copy..."
                            : "Ask about growth, bottlenecks, churn, CAC, close rate, onboarding, or what breaks at scale..."
                        }
                        className="min-h-[88px] w-full resize-none rounded-[22px] border border-cyan-300/10 bg-[#081a2c]/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-xl transition focus:border-cyan-300/22"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="rounded-full border border-cyan-300/15 bg-cyan-400/[0.08] px-3 py-1.5 text-xs text-cyan-100 backdrop-blur-xl">
                        {activeMode === "ad-builder" ? "Ad Builder" : "Founder Mode"}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || (!input.trim() && attachments.length === 0)}
                        className="h-[52px] rounded-[22px] border border-cyan-300/15 bg-cyan-400/[0.10] px-5 text-sm font-medium text-cyan-100 transition backdrop-blur-xl hover:bg-cyan-400/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? "Thinking..." : "Send"}
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>Drag and drop screenshots or files here</span>
                    <span className="h-1 w-1 rounded-full bg-slate-500/60" />
                    <span>Up to 4 files</span>
                    <span className="h-1 w-1 rounded-full bg-slate-500/60" />
                    <span>Max 8MB each</span>
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/6 bg-white/[0.03] p-3 backdrop-blur-2xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Example prompts
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {compactExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition backdrop-blur-xl hover:border-cyan-300/15 hover:bg-cyan-400/[0.08]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import { buildFounderAssistantContext } from "../lib/assistantContextBuilders.js";

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [] }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group relative max-w-[86%] overflow-hidden rounded-[30px] px-5 py-4 text-sm leading-7 whitespace-pre-wrap backdrop-blur-2xl transition-all duration-200 ${
          isUser
            ? "border border-white/10 bg-white/[0.08] text-white shadow-[0_18px_60px_rgba(0,0,0,0.32)]"
            : "border border-cyan-300/16 bg-cyan-300/[0.09] text-slate-100 shadow-[0_20px_70px_rgba(34,211,238,0.10)]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),transparent_32%,rgba(34,211,238,0.08))]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/25" />
        {!isUser && (
          <div className="pointer-events-none absolute -left-10 top-0 h-24 w-24 rounded-full bg-cyan-300/12 blur-2xl" />
        )}

        <div className="relative z-10">
          {attachments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl"
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

                  <div className="border-t border-white/10 px-2 py-1 text-[11px] text-slate-300 truncate">
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
    <div className="flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100 shadow-[0_8px_24px_rgba(34,211,238,0.08)] backdrop-blur-xl">
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

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Locked on the path to 2,000 clients. Bring the bottleneck, numbers, or decision.",
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
          message: trimmed,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          attachments: attachments.map((attachment) => ({
            name: attachment.name,
            type: attachment.type,
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

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          attachments: [],
        },
      ]);
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
    <div className="min-h-screen overflow-hidden bg-[#06101c] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[10%] top-[18%] h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[8%] left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-white/20" />

          <div className="grid min-h-[82vh] grid-rows-[1fr_auto]">
            <div
              ref={scrollRef}
              className="relative overflow-y-auto px-4 py-5 md:px-6 md:py-6"
            >
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
                    <div className="relative overflow-hidden rounded-[28px] border border-cyan-300/16 bg-cyan-300/[0.09] px-5 py-4 shadow-[0_20px_70px_rgba(34,211,238,0.10)] backdrop-blur-2xl">
                      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_38%,rgba(34,211,238,0.08))]" />
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

            <div className="border-t border-white/8 bg-black/10 px-4 py-4 md:px-6">
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
                  className={`relative overflow-hidden rounded-[30px] border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition ${
                    dragActive
                      ? "border-cyan-300/20 bg-cyan-400/[0.10]"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_26%,rgba(34,211,238,0.06),transparent_72%)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={openFilePicker}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/10 text-2xl text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/14"
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
                        placeholder="Type your question..."
                        className="min-h-[92px] w-full resize-none rounded-[24px] border border-white/10 bg-[#08192b]/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-xl transition focus:border-cyan-300/24"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || (!input.trim() && attachments.length === 0)}
                      className="h-[54px] rounded-[22px] border border-cyan-300/18 bg-cyan-300/10 px-5 text-sm font-medium text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import { buildMarketerAssistantContext } from "../lib/assistantContextBuilders.js";

const PLATFORMS = ["Meta", "Google Ads", "Google Search"];

const NICHES = [
  "HVAC",
  "Chiropractor",
  "Dentist",
  "Roofer",
  "Med Spa",
  "Plumbing",
  "Auto Repair",
  "Construction",
  "Pest Control",
  "Lawn Care",
  "Vet",
];

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [], badge }) {
  const isUser = role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "relative max-w-[88%] overflow-hidden rounded-[28px] px-5 py-4 whitespace-pre-wrap text-sm leading-7 backdrop-blur-2xl",
          isUser
            ? "bg-white/[0.07] text-white shadow-[0_12px_36px_rgba(0,0,0,0.24)]"
            : "bg-cyan-400/[0.10] text-slate-100 shadow-[0_0_30px_rgba(34,211,238,0.08)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_42%,rgba(34,211,238,0.04))]" />

        <div className="relative z-10">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-65">
            <span>{isUser ? "You" : "Marketer Assistant"}</span>
            {badge && (
              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] text-cyan-100/85">
                {badge}
              </span>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-2xl bg-white/[0.05]"
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
    </div>
  );
}

function AttachmentChip({ attachment, onRemove }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 backdrop-blur-xl">
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

function buildAttachmentObjects(fileList, existingAttachments) {
  const incoming = Array.from(fileList || []);
  const remainingSlots = MAX_ATTACHMENTS - existingAttachments.length;

  if (remainingSlots <= 0) return [];

  return incoming.slice(0, remainingSlots).reduce((acc, file) => {
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
}

export default function MarketerAssistantPage() {
  const { data } = useSheetData();

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Ask about ad performance, budget allocation, LinkedIn content, hooks, offers, creative direction, niche targeting, or what is underperforming.",
      attachments: [],
      badge: "Chat",
    },
  ]);

  const [builderMessages, setBuilderMessages] = useState([
    {
      role: "assistant",
      content:
        "Build Ad mode is ready. This builds ads for IntelliFlow Communications targeted at the selected niche.",
      attachments: [],
      badge: "Build Ad",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [buildInput, setBuildInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Meta");
  const [selectedNiche, setSelectedNiche] = useState("HVAC");
  const [buildAdOpen, setBuildAdOpen] = useState(false);

  const [chatAttachments, setChatAttachments] = useState([]);
  const [buildAttachments, setBuildAttachments] = useState([]);

  const [chatDragActive, setChatDragActive] = useState(false);
  const [buildDragActive, setBuildDragActive] = useState(false);

  const chatScrollRef = useRef(null);
  const buildScrollRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const buildFileInputRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, loadingChat]);

  useEffect(() => {
    if (buildScrollRef.current) {
      buildScrollRef.current.scrollTop = buildScrollRef.current.scrollHeight;
    }
  }, [builderMessages, loadingBuild, buildAdOpen]);

  useEffect(() => {
    return () => {
      [...chatAttachments, ...buildAttachments].forEach((attachment) => {
        if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
      });
    };
  }, [chatAttachments, buildAttachments]);

  function addChatFiles(fileList) {
    const nextFiles = buildAttachmentObjects(fileList, chatAttachments);
    if (nextFiles.length) setChatAttachments((prev) => [...prev, ...nextFiles]);
  }

  function addBuildFiles(fileList) {
    const nextFiles = buildAttachmentObjects(fileList, buildAttachments);
    if (nextFiles.length) setBuildAttachments((prev) => [...prev, ...nextFiles]);
  }

  function removeChatAttachment(id) {
    setChatAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  function removeBuildAttachment(id) {
    setBuildAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function sendToAssistant({ messageText, mode, attachments, nextMessages }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assistantType: "marketer",
        marketerMode: mode,
        platform: selectedPlatform,
        niche: selectedNiche,
        message: messageText,
        context: buildMarketerAssistantContext(data, {
          marketerMode: mode,
          platform: selectedPlatform,
          niche: selectedNiche,
        }),
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        attachments: attachments.map((attachment) => ({
          name: attachment.name,
          type: attachment.type,
        })),
      }),
    });

    if (!response.ok) throw new Error("Failed to get marketer assistant response.");

    const dataResponse = await response.json();
    return (
      dataResponse?.reply ||
      dataResponse?.message ||
      dataResponse?.content ||
      "I couldn’t generate a response. Check the chat route and response shape."
    );
  }

  async function handleChatSubmit(event) {
    event.preventDefault();

    const trimmed = chatInput.trim();
    if ((!trimmed && chatAttachments.length === 0) || loadingChat) return;

    const userMessage = {
      role: "user",
      content: trimmed || "Review the attached files/screenshots and help me.",
      attachments: chatAttachments,
      badge: "Chat",
    };

    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setChatInput("");
    setLoadingChat(true);
    setChatAttachments([]);

    try {
      const reply = await sendToAssistant({
        messageText: trimmed,
        mode: "chat",
        attachments: chatAttachments,
        nextMessages,
      });

      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, attachments: [], badge: "Chat" },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "The marketer assistant request failed. Check the API route wiring and make sure the response returns a reply, message, or content field.",
          attachments: [],
          badge: "Chat",
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  }

  async function handleBuildSubmit(event) {
    event.preventDefault();

    const trimmed = buildInput.trim();
    if ((!trimmed && buildAttachments.length === 0) || loadingBuild) return;

    const userMessage = {
      role: "user",
      content: trimmed || "Build the ad using the attached files/screenshots.",
      attachments: buildAttachments,
      badge: "Build Ad",
    };

    const nextMessages = [...builderMessages, userMessage];
    setBuilderMessages(nextMessages);
    setBuildInput("");
    setLoadingBuild(true);
    setBuildAttachments([]);

    try {
      const reply = await sendToAssistant({
        messageText: trimmed,
        mode: "build-ad",
        attachments: buildAttachments,
        nextMessages,
      });

      setBuilderMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply, attachments: [], badge: "Build Ad" },
      ]);
    } catch {
      setBuilderMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "The build-ad request failed. Check the API route wiring and make sure the response returns a reply, message, or content field.",
          attachments: [],
          badge: "Build Ad",
        },
      ]);
    } finally {
      setLoadingBuild(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
        <div className="space-y-4">
          {buildAdOpen && (
            <div className="rounded-[30px] bg-white/[0.035] p-4 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-white">Build Ad</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/60">
                    IntelliFlow ad targeted at {selectedNiche}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBuildAdOpen(false)}
                  className="rounded-full bg-cyan-400/[0.10] px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-400/[0.16]"
                >
                  Close
                </button>
              </div>

              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] bg-white/[0.03] p-3 backdrop-blur-xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Platform
                  </div>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full rounded-[16px] bg-[#081a2c]/60 px-3 py-2 text-sm text-white outline-none"
                  >
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform} className="bg-[#081a2c]">
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[22px] bg-white/[0.03] p-3 backdrop-blur-xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Target Niche
                  </div>
                  <select
                    value={selectedNiche}
                    onChange={(e) => setSelectedNiche(e.target.value)}
                    className="w-full rounded-[16px] bg-[#081a2c]/60 px-3 py-2 text-sm text-white outline-none"
                  >
                    {NICHES.map((niche) => (
                      <option key={niche} value={niche} className="bg-[#081a2c]">
                        {niche}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                ref={buildScrollRef}
                className="mb-4 max-h-[300px] space-y-4 overflow-y-auto rounded-[26px] bg-[#081726]/65 p-4"
              >
                {builderMessages.map((message, index) => (
                  <MessageBubble
                    key={`build-${message.role}-${index}`}
                    role={message.role}
                    content={message.content}
                    attachments={message.attachments || []}
                    badge={message.badge}
                  />
                ))}

                {loadingBuild && (
                  <div className="flex justify-start">
                    <div className="rounded-[24px] bg-cyan-400/[0.08] px-4 py-3 text-sm text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.08)] backdrop-blur-xl">
                      <div className="mb-1 text-[10px] uppercase tracking-[0.18em] opacity-60">
                        Marketer Assistant
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

              <form onSubmit={handleBuildSubmit} className="space-y-3">
                {buildAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {buildAttachments.map((attachment) => (
                      <AttachmentChip
                        key={attachment.id}
                        attachment={attachment}
                        onRemove={removeBuildAttachment}
                      />
                    ))}
                  </div>
                )}

                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBuildDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const related = e.relatedTarget;
                    if (!e.currentTarget.contains(related)) setBuildDragActive(false);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBuildDragActive(true);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBuildDragActive(false);
                    if (e.dataTransfer?.files?.length) addBuildFiles(e.dataTransfer.files);
                  }}
                  className={[
                    "relative overflow-hidden rounded-[28px] p-4 transition backdrop-blur-2xl",
                    buildDragActive
                      ? "bg-cyan-400/[0.08] shadow-[0_0_35px_rgba(34,211,238,0.10)]"
                      : "bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => buildFileInputRef.current?.click()}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-cyan-400/[0.08] text-2xl text-cyan-100 transition hover:bg-cyan-400/[0.14]"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={buildInput}
                        onChange={(e) => setBuildInput(e.target.value)}
                        rows={3}
                        placeholder={`Build an IntelliFlow Communications ${selectedPlatform} ad targeted at ${selectedNiche}...`}
                        className="min-h-[92px] w-full resize-none rounded-[24px] bg-[#081a2c]/70 px-4 py-3 text-sm text
import { useEffect, useMemo, useRef, useState } from 'react';

const MODES = [
  { id: 'founder', label: 'Founder Assistant' },
  { id: 'marketer', label: 'Marketer Assistant' },
];

function BubbleMessage({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] md:max-w-[75%]',
          'rounded-[28px] px-5 py-4',
          'shadow-sm border',
          'text-sm md:text-[15px] leading-7 whitespace-pre-wrap',
          isUser
            ? 'bg-white/10 border-white/15 text-white rounded-br-md'
            : 'bg-white/[0.06] border-white/10 text-white/95 rounded-bl-md',
        ].join(' ')}
      >
        {content}
      </div>
    </div>
  );
}

export default function AdAssistantPage() {
  const [mode, setMode] = useState('founder');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Keep your existing message logic/state shape if you already have one.
  // This fallback preserves a working UI shell.
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'How can I help?',
    },
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const placeholder = useMemo(() => {
    return mode === 'founder'
      ? 'Ask your founder assistant anything...'
      : 'Ask your marketer assistant anything...';
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextUserMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, nextUserMessage]);
    setInput('');
    setLoading(true);

    try {
      // IMPORTANT:
      // Keep your existing API / assistant logic here.
      // Replace ONLY the inside of this try block with your current request code if needed.
      // The UI shell is the main change.
      await new Promise((resolve) => setTimeout(resolve, 500));

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            mode === 'founder'
              ? 'Founder assistant response placeholder. Keep your current logic here exactly as-is.'
              : 'Marketer assistant response placeholder. Keep your current logic here exactly as-is.',
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white px-4 md:px-6 py-6">
      <div className="mx-auto max-w-5xl">
        {/* Top mode switch only */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
            {MODES.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={[
                    'rounded-full px-4 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/75 hover:text-white hover:bg-white/5',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* One big bubbly assistant shell */}
        <div className="rounded-[34px] border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] overflow-hidden">
          {/* Chat area */}
          <div className="h-[68vh] md:h-[72vh] overflow-y-auto px-4 md:px-6 py-5 space-y-4">
            {messages.map((message, index) => (
              <BubbleMessage
                key={`${message.role}-${index}`}
                role={message.role}
                content={message.content}
              />
            ))}

            {loading && (
              <div className="w-full flex justify-start">
                <div className="max-w-[140px] rounded-[28px] rounded-bl-md px-5 py-4 border border-white/10 bg-white/[0.06] text-white/75 text-sm">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-white/10 px-4 md:px-6 py-4 bg-black/10">
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <div className="flex-1 rounded-[28px] border border-white/10 bg-white/[0.05] px-4 py-3 shadow-inner">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={1}
                  placeholder={placeholder}
                  className="w-full resize-none bg-transparent text-white placeholder:text-white/40 outline-none text-sm md:text-[15px] leading-6 max-h-40"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="h-[52px] min-w-[52px] rounded-full border border-white/10 bg-white text-black font-medium px-5 disabled:opacity-40 disabled:cursor-not-allowed transition hover:scale-[1.02]"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

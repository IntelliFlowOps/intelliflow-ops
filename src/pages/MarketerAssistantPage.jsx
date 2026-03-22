import { useEffect, useMemo, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import { buildMarketerAssistantContext } from "../lib/assistantContextBuilders.js";

const CHAT_EXAMPLES = [
  "What is underperforming most right now across our ad data?",
  "How should I allocate budget between Meta and Google Search this week?",
  "Which niche looks strongest based on customers won, CAC, and close rate?",
  "What hooks are likely to work best for HVAC right now?",
  "Why did this campaign likely work better than the others?",
  "What should I test next for a roofer offer?",
];

const BUILD_EXAMPLES = [
  "Build 3 hook options for a Meta ad for HVAC.",
  "Build headlines and primary text for a Google Search campaign for dentists.",
  "Give me CTA options and creative direction for a chiropractor ad.",
  "Build an ad test matrix for plumbing on Meta.",
];

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
          "relative max-w-[90%] overflow-hidden rounded-[24px] px-4 py-3 whitespace-pre-wrap text-sm leading-6 backdrop-blur-xl",
          isUser
            ? "bg-white/[0.06] text-white shadow-[0_10px_35px_rgba(0,0,0,0.22)]"
            : "bg-cyan-400/[0.08] text-slate-100 shadow-[0_0_30px_rgba(34,211,238,0.08)]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%,rgba(34,211,238,0.05))]" />
        {!isUser && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_45%)]" />
        )}

        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-70">
            <span>{isUser ? "Marketer" : "Marketer Assistant"}</span>
            {badge && (
              <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] text-cyan-100/80">
                {badge}
              </span>
            )}
          </div>

          {attachments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="overflow-hidden rounded-2xl bg-white/[0.05] backdrop-blur-xl"
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
        "Ask about ad performance, budget allocation, platforms, hooks, offers, creative direction, or what is underperforming.",
      attachments: [],
      badge: "Chat",
    },
  ]);

  const [builderMessages, setBuilderMessages] = useState([
    {
      role: "assistant",
      content:
        "Build Ad mode is ready. Pick a platform and niche, then ask for hooks, headlines, primary text, CTA, creative direction, or a testing matrix.",
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

  const chatExamples = useMemo(() => CHAT_EXAMPLES, []);
  const buildExamples = useMemo(() => BUILD_EXAMPLES, []);

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
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[30px] bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.10),rgba(7,17,31,0.97)_42%)] shadow-[0_0_60px_rgba(34,211,238,0.06)] backdrop-blur-2xl">
          <div className="px-5 py-4 md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-11 w-11 rounded-2xl bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.14)] backdrop-blur-xl">
                  <div className="absolute inset-2 rounded-xl bg-white/[0.03]" />
                  <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
                  <div className="absolute inset-0 animate-pulse rounded-2xl bg-cyan-200/5" />
                </div>

                <div>
                  <h1 className="text-lg font-semibold tracking-wide text-white">
                    Marketer Assistant
                  </h1>
                  <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/65">
                    IntelliFlow Communications
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBuildAdOpen((prev) => !prev)}
                className="rounded-full bg-cyan-400/12 px-4 py-2 text-sm text-cyan-100 backdrop-blur-xl transition hover:bg-cyan-400/18"
              >
                {buildAdOpen ? "Close Build Ad" : "Build An Ad"}
              </button>
            </div>
          </div>

          {buildAdOpen && (
            <div className="mx-4 mb-4 rounded-[26px] bg-white/[0.035] p-4 backdrop-blur-2xl md:mx-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Build Ad</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/60">
                    Structured ad output
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[20px] bg-white/[0.03] p-3 backdrop-blur-2xl">
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

                <div className="rounded-[20px] bg-white/[0.03] p-3 backdrop-blur-2xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Niche
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
                className="mt-4 max-h-[320px] space-y-4 overflow-y-auto"
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

              <form onSubmit={handleBuildSubmit} className="mt-4 space-y-3">
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
                    "relative overflow-hidden rounded-[26px] p-3 transition backdrop-blur-2xl",
                    buildDragActive
                      ? "bg-cyan-400/[0.08] shadow-[0_0_35px_rgba(34,211,238,0.10)]"
                      : "bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,0.04),transparent)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => buildFileInputRef.current?.click()}
                      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-cyan-400/[0.08] text-2xl text-cyan-100 transition backdrop-blur-xl hover:bg-cyan-400/[0.14]"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={buildInput}
                        onChange={(e) => setBuildInput(e.target.value)}
                        rows={3}
                        placeholder={`Build a ${selectedPlatform} ad for ${selectedNiche}...`}
                        className="min-h-[88px] w-full resize-none rounded-[22px] bg-[#081a2c]/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-xl"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="rounded-full bg-cyan-400/[0.08] px-3 py-1.5 text-xs text-cyan-100 backdrop-blur-xl">
                        Build Ad
                      </div>

                      <button
                        type="submit"
                        disabled={loadingBuild || (!buildInput.trim() && buildAttachments.length === 0)}
                        className="h-[52px] rounded-[22px] bg-cyan-400/[0.10] px-5 text-sm font-medium text-cyan-100 transition backdrop-blur-xl hover:bg-cyan-400/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingBuild ? "Thinking..." : "Send"}
                      </button>
                    </div>
                  </div>

                  <input
                    ref={buildFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.doc,.docx"
                    onChange={(e) => {
                      addBuildFiles(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />

                  <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>Drag and drop screenshots or files here</span>
                    <span>•</span>
                    <span>Up to 4 files</span>
                    <span>•</span>
                    <span>Max 8MB each</span>
                  </div>
                </div>

                <div className="rounded-[22px] bg-white/[0.03] p-3 backdrop-blur-2xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Build Ad prompts
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {buildExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setBuildInput(example)}
                        className="rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition backdrop-blur-xl hover:bg-cyan-400/[0.08]"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          )}

          <div className="px-4 pb-4 md:px-6">
            <div
              ref={chatScrollRef}
              className="relative max-h-[360px] overflow-y-auto rounded-[26px] bg-white/[0.03] px-4 py-4 backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute left-[8%] top-12 h-32 w-32 rounded-full bg-cyan-400/6 blur-3xl" />
                <div className="absolute right-[12%] top-24 h-36 w-36 rounded-full bg-cyan-300/6 blur-3xl" />
              </div>

              <div className="relative z-10 space-y-4">
                {chatMessages.map((message, index) => (
                  <MessageBubble
                    key={`chat-${message.role}-${index}`}
                    role={message.role}
                    content={message.content}
                    attachments={message.attachments || []}
                    badge={message.badge}
                  />
                ))}

                {loadingChat && (
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
            </div>

            <form onSubmit={handleChatSubmit} className="mt-4 space-y-3">
              {chatAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {chatAttachments.map((attachment) => (
                    <AttachmentChip
                      key={attachment.id}
                      attachment={attachment}
                      onRemove={removeChatAttachment}
                    />
                  ))}
                </div>
              )}

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setChatDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const related = e.relatedTarget;
                  if (!e.currentTarget.contains(related)) setChatDragActive(false);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setChatDragActive(true);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setChatDragActive(false);
                  if (e.dataTransfer?.files?.length) addChatFiles(e.dataTransfer.files);
                }}
                className={[
                  "relative overflow-hidden rounded-[26px] p-3 transition backdrop-blur-2xl",
                  chatDragActive
                    ? "bg-cyan-400/[0.08] shadow-[0_0_35px_rgba(34,211,238,0.10)]"
                    : "bg-white/[0.03]",
                ].join(" ")}
              >
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(34,211,238,0.04),transparent)]" />

                <div className="relative z-10 flex items-end gap-3">
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-cyan-400/[0.08] text-2xl text-cyan-100 transition backdrop-blur-xl hover:bg-cyan-400/[0.14]"
                  >
                    +
                  </button>

                  <div className="flex-1">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      rows={3}
                      placeholder={`Ask about ${selectedPlatform} performance, budget, hooks, CAC, CPL, close rate, what is underperforming, or drop screenshots for review...`}
                      className="min-h-[88px] w-full resize-none rounded-[22px] bg-[#081a2c]/60 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-xl"
                    />
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="rounded-full bg-cyan-400/[0.08] px-3 py-1.5 text-xs text-cyan-100 backdrop-blur-xl">
                      Chat
                    </div>

                    <button
                      type="submit"
                      disabled={loadingChat || (!chatInput.trim() && chatAttachments.length === 0)}
                      className="h-[52px] rounded-[22px] bg-cyan-400/[0.10] px-5 text-sm font-medium text-cyan-100 transition backdrop-blur-xl hover:bg-cyan-400/[0.16] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingChat ? "Thinking..." : "Send"}
                    </button>
                  </div>
                </div>

                <input
                  ref={chatFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={(e) => {
                    addChatFiles(e.target.files);
                    e.target.value = "";
                  }}
                  className="hidden"
                />

                <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span>Drag and drop screenshots or files here</span>
                  <span>•</span>
                  <span>Up to 4 files</span>
                  <span>•</span>
                  <span>Max 8MB each</span>
                </div>
              </div>

              <div className="rounded-[22px] bg-white/[0.03] p-3 backdrop-blur-2xl">
                <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Example prompts
                </div>

                <div className="flex flex-wrap gap-2">
                  {chatExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setChatInput(example)}
                      className="rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition backdrop-blur-xl hover:bg-cyan-400/[0.08]"
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
  );
}

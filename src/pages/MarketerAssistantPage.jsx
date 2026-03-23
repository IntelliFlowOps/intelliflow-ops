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
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[86%] overflow-hidden rounded-[30px] px-5 py-4 text-sm leading-7 whitespace-pre-wrap backdrop-blur-2xl transition-all duration-200 ${
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
          {badge && !isUser && (
            <div className="mb-2">
              <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-100/80">
                {badge}
              </span>
            </div>
          )}

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
        "Ask about ad performance, budget allocation, content, hooks, offers, creative direction, niche targeting, or what is underperforming.",
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
    <div className="min-h-screen overflow-hidden bg-[#06101c] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8%] top-[8%] h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-[10%] top-[18%] h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute bottom-[8%] left-1/3 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setBuildAdOpen((prev) => !prev)}
            className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-[0_14px_40px_rgba(34,211,238,0.08)] backdrop-blur-xl transition hover:bg-cyan-300/14"
          >
            {buildAdOpen ? "Close Build Ad" : "Build An Ad"}
          </button>
        </div>

        {buildAdOpen && (
          <div className="mb-4 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.05] shadow-[0_24px_90px_rgba(0,0,0,0.36)] backdrop-blur-3xl">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_26%,transparent_74%,rgba(255,255,255,0.03))]" />

            <div className="relative z-10 p-4 md:p-5">
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-3 backdrop-blur-2xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Platform
                  </div>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="w-full rounded-[18px] border border-white/10 bg-[#08192b]/70 px-3 py-2 text-sm text-white outline-none"
                  >
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform} className="bg-[#08192b]">
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-3 backdrop-blur-2xl">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Target Niche
                  </div>
                  <select
                    value={selectedNiche}
                    onChange={(e) => setSelectedNiche(e.target.value)}
                    className="w-full rounded-[18px] border border-white/10 bg-[#08192b]/70 px-3 py-2 text-sm text-white outline-none"
                  >
                    {NICHES.map((niche) => (
                      <option key={niche} value={niche} className="bg-[#08192b]">
                        {niche}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                ref={buildScrollRef}
                className="max-h-[320px] overflow-y-auto rounded-[28px] border border-white/10 bg-black/10 px-4 py-4"
              >
                <div className="space-y-5">
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
                  className={`relative overflow-hidden rounded-[30px] border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition ${
                    buildDragActive
                      ? "border-cyan-300/20 bg-cyan-400/[0.10]"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_26%,rgba(34,211,238,0.06),transparent_72%)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => buildFileInputRef.current?.click()}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/10 text-2xl text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/14"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={buildInput}
                        onChange={(e) => setBuildInput(e.target.value)}
                        rows={3}
                        placeholder={`Build an IntelliFlow Communications ${selectedPlatform} ad targeted at ${selectedNiche}...`}
                        className="min-h-[92px] w-full resize-none rounded-[24px] border border-white/10 bg-[#08192b]/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingBuild || (!buildInput.trim() && buildAttachments.length === 0)}
                      className="h-[54px] rounded-[22px] border border-cyan-300/18 bg-cyan-300/10 px-5 text-sm font-medium text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingBuild ? "Thinking..." : "Send"}
                    </button>
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
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-[38px] border border-white/10 bg-white/[0.05] shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_22%,transparent_78%,rgba(255,255,255,0.03))]" />
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-white/20" />

          <div className="grid min-h-[72vh] grid-rows-[1fr_auto]">
            <div
              ref={chatScrollRef}
              className="relative overflow-y-auto px-4 py-5 md:px-6 md:py-6"
            >
              <div className="space-y-5">
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
              <form onSubmit={handleChatSubmit} className="space-y-3">
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
                  className={`relative overflow-hidden rounded-[30px] border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition ${
                    chatDragActive
                      ? "border-cyan-300/20 bg-cyan-400/[0.10]"
                      : "border-white/10 bg-white/[0.05]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_26%,rgba(34,211,238,0.06),transparent_72%)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-300/10 text-2xl text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/14"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        rows={3}
                        placeholder="Type your question..."
                        className="min-h-[92px] w-full resize-none rounded-[24px] border border-white/10 bg-[#08192b]/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingChat || (!chatInput.trim() && chatAttachments.length === 0)}
                      className="h-[54px] rounded-[22px] border border-cyan-300/18 bg-cyan-300/10 px-5 text-sm font-medium text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingChat ? "Thinking..." : "Send"}
                    </button>
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
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import { buildMarketerAssistantContext } from "../lib/assistantContextBuilders.js";

const PLATFORMS = ["Meta", "Google Ads", "Google Search"];

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [], badge }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`relative max-w-[84%] overflow-hidden rounded-[34px] px-5 py-4 text-sm leading-7 whitespace-pre-wrap backdrop-blur-3xl transition-all duration-200 ${
          isUser
            ? "bg-white/[0.05] text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
            : "bg-cyan-300/[0.06] text-slate-100 shadow-[0_26px_90px_rgba(34,211,238,0.10)]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[linear-gradient(135deg,rgba(255,255,255,0.06),transparent_35%,rgba(34,211,238,0.05))]" />
        <div className="pointer-events-none absolute inset-[1px] rounded-[33px] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),transparent_26%,transparent_72%,rgba(255,255,255,0.018))]" />

        {!isUser && (
          <>
            <div className="pointer-events-none absolute -left-8 top-0 h-20 w-20 rounded-full bg-cyan-300/10 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 rounded-full bg-sky-300/8 blur-2xl" />
          </>
        )}

        <div className="relative z-10">
          {badge && !isUser && (
            <div className="mb-2">
              <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">
                {badge}
              </span>
            </div>
          )}

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
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.memories)) setMemories(d.memories); })
      .catch(() => {});
  }, []);

  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Ask for social posts, budget allocation, hooks, offers, campaign ideas, messaging, creative direction, testing plans, platform strategy, reporting help, or anything else marketing-related.",
      attachments: [],
      badge: "Chat",
    },
  ]);

  const [builderMessages, setBuilderMessages] = useState([
    {
      role: "assistant",
      content:
        "Build Ad mode is ready. Give me a niche, platform, screenshot, offer, angle, rough idea, or ask me to build the whole concept from scratch.",
      attachments: [],
      badge: "Build Ad",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [buildInput, setBuildInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("Meta");
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
        memories: memories,
        marketerMode: mode,
        platform: selectedPlatform,
        message: messageText,
        context: buildMarketerAssistantContext(data, {
          marketerMode: mode,
          platform: selectedPlatform,
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
    <div className="min-h-screen overflow-hidden bg-[#040a12] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[8%] h-64 w-64 rounded-full bg-cyan-400/7 blur-3xl" />
        <div className="absolute right-[8%] top-[16%] h-80 w-80 rounded-full bg-sky-400/7 blur-3xl" />
        <div className="absolute bottom-[6%] left-1/3 h-72 w-72 rounded-full bg-white/4 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-300 shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
            Marketer Assistant
          </div>

          <button
            type="button"
            onClick={() => setBuildAdOpen((prev) => !prev)}
            className="rounded-full bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 shadow-[0_14px_40px_rgba(34,211,238,0.08)] backdrop-blur-2xl transition hover:bg-cyan-300/14"
          >
            {buildAdOpen ? "Close Build Ad" : "Build An Ad"}
          </button>
        </div>

        {buildAdOpen && (
          <div className="mb-4 overflow-hidden rounded-[40px] bg-white/[0.04] shadow-[0_34px_110px_rgba(0,0,0,0.44)] backdrop-blur-3xl">
            <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent_16%,transparent_84%,rgba(255,255,255,0.018))]" />

            <div className="relative z-10 p-4 md:p-5">

              <div
                ref={buildScrollRef}
                className="max-h-[320px] overflow-y-auto rounded-[32px] bg-black/10 px-4 py-4"
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
                  className={`relative overflow-hidden rounded-[34px] p-3 shadow-[0_22px_70px_rgba(0,0,0,0.30)] backdrop-blur-3xl transition ${
                    buildDragActive ? "bg-cyan-400/[0.08]" : "bg-white/[0.045]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_26%,rgba(34,211,238,0.05),transparent_72%)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => buildFileInputRef.current?.click()}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-2xl text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/14"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={buildInput}
                        onChange={(e) => setBuildInput(e.target.value)}
                        rows={3}
                        placeholder={`Build an ${selectedPlatform} ad. Give me a rough angle, offer, screenshot, headline idea, or tell me to build it from scratch.`}
                        className="min-h-[92px] w-full resize-none rounded-[24px] bg-[#071521]/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-2xl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingBuild || (!buildInput.trim() && buildAttachments.length === 0)}
                      className="h-[54px] rounded-[22px] bg-cyan-300/10 px-5 text-sm font-medium text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
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

        <div className="overflow-hidden rounded-[42px] bg-white/[0.04] shadow-[0_40px_120px_rgba(0,0,0,0.50)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-0 rounded-[42px] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),transparent_16%,transparent_84%,rgba(255,255,255,0.018))]" />

          <div className="grid min-h-[72vh] grid-rows-[1fr_auto]">
            <div
              ref={chatScrollRef}
              className="relative overflow-y-auto px-4 py-6 md:px-6 md:py-7"
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
                  className={`relative overflow-hidden rounded-[34px] p-3 shadow-[0_22px_70px_rgba(0,0,0,0.30)] backdrop-blur-3xl transition ${
                    chatDragActive ? "bg-cyan-400/[0.08]" : "bg-white/[0.045]"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_26%,rgba(34,211,238,0.05),transparent_72%)]" />

                  <div className="relative z-10 flex items-end gap-3">
                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-2xl text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/14"
                    >
                      +
                    </button>

                    <div className="flex-1">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        rows={3}
                        placeholder="Ask about social posts, ad strategy, budget allocation, platform mix, hooks, offers, messaging, campaigns, reporting, or any other marketing question."
                        className="min-h-[92px] w-full resize-none rounded-[24px] bg-[#071521]/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur-2xl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingChat || (!chatInput.trim() && chatAttachments.length === 0)}
                      className="h-[54px] rounded-[22px] bg-cyan-300/10 px-5 text-sm font-medium text-cyan-100 shadow-[0_12px_30px_rgba(34,211,238,0.10)] transition hover:bg-cyan-300/16 disabled:cursor-not-allowed disabled:opacity-50"
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

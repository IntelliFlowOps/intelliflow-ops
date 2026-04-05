import { useEffect, useRef, useState } from "react";
import { useSheetData } from "../hooks/useSheetData.jsx";
import ChatHistoryDrawer from "../components/ChatHistoryDrawer.jsx";
import { buildMarketerAssistantContext } from "../lib/assistantContextBuilders.js";
import TypewriterText from "../components/TypewriterText.jsx";

const PLATFORMS = ["Meta", "Google Ads", "Google Search"];

const MAX_ATTACHMENTS = 4;
const MAX_FILE_SIZE_MB = 8;

function MessageBubble({ role, content, attachments = [], badge, animating = false, onAnimComplete }) {
  const isUser = role === "user";
  return (
    <div className={["flex w-full items-end gap-2.5", isUser ? "justify-end user-send" : "justify-start ai-fade-in"].join(" ")}>
      {!isUser && (
        <div className="shrink-0 mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-cyan-300 avatar-pulse"
          style={{background:"linear-gradient(135deg,rgba(6,182,212,0.2),rgba(2,132,199,0.08))",border:"1px solid rgba(6,182,212,0.2)"}}>
          IF
        </div>
      )}
      <div
        className={["relative max-w-[85%] sm:max-w-[78%] text-[15px] leading-7 whitespace-pre-wrap break-words", isUser ? "rounded-[20px] rounded-br-[6px] px-4 sm:px-5 py-3 sm:py-3.5 text-white" : "border-l-2 border-cyan-500/50 pl-4 py-3 text-zinc-200"].join(" ")}
        style={isUser ? {
          background: "linear-gradient(135deg,#0e5c73,#0891b2)",
          boxShadow: "0 8px 32px rgba(8,145,178,0.18)"
        } : {}}
      >
        <div className="relative z-10">
          {badge && !isUser && (
            <div className="mb-2">
              <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">{badge}</span>
            </div>
          )}
          {attachments.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="overflow-hidden rounded-2xl bg-white/[0.05] shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                  {attachment.previewUrl && attachment.type?.startsWith("image/") ? (
                    <img src={attachment.previewUrl} alt={attachment.name} className="h-28 w-full object-cover" />
                  ) : (
                    <div className="flex h-28 items-center justify-center px-3 text-center text-xs text-slate-300">{attachment.name}</div>
                  )}
                  <div className="px-2 py-1 text-[11px] text-slate-300 truncate">{attachment.name}</div>
                </div>
              ))}
            </div>
          )}
          <div>{animating ? <TypewriterText text={content} speed={8} onComplete={onAnimComplete} /> : content}</div>
        </div>
      </div>
      {isUser && (
        <div className="shrink-0 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{background:"linear-gradient(135deg,#0e7490,#0891b2)",border:"1px solid rgba(6,182,212,0.4)"}}>
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

function normalizeFiles(fileList, existingAttachments, setAttachments) {
  const incoming = Array.from(fileList || []);
  const remainingSlots = MAX_ATTACHMENTS - existingAttachments.length;
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

export default function MarketerAssistantPage() {
  const { data } = useSheetData();
  const [memories, setMemories] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.memories)) setMemories(d.memories); })
      .catch(() => {});
  }, []);

  const defaultChat = [{ role: "assistant", content: "Ask for social posts, budget allocation, hooks, offers, campaign ideas, messaging, creative direction, testing plans, platform strategy, reporting help, or anything else marketing-related.", attachments: [], badge: "Chat" }];
  const defaultBuild = [{ role: "assistant", content: "Build Ad mode is ready. Give me a niche, platform, screenshot, offer, angle, rough idea, or ask me to build the whole concept from scratch.", attachments: [], badge: "Build Ad" }];

  const [chatMessages, setChatMessages] = useState(() => {
    try { const saved = sessionStorage.getItem('chat_marketer'); return saved ? JSON.parse(saved) : defaultChat; }
    catch (_e) { return defaultChat; }
  });
  const [builderMessages, setBuilderMessages] = useState(() => {
    try { const saved = sessionStorage.getItem('chat_marketer_build'); return saved ? JSON.parse(saved) : defaultBuild; }
    catch (_e) { return defaultBuild; }
  });
  useEffect(() => { sessionStorage.setItem('chat_marketer', JSON.stringify(chatMessages)); }, [chatMessages]);
  useEffect(() => { sessionStorage.setItem('chat_marketer_build', JSON.stringify(builderMessages)); }, [builderMessages]);

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
  const chatPrevLen = useRef(chatMessages.length);
  const buildPrevLen = useRef(builderMessages.length);
  const [chatAnimIdx, setChatAnimIdx] = useState(-1);
  const [buildAnimIdx, setBuildAnimIdx] = useState(-1);

  useEffect(function () {
    if (chatMessages.length > chatPrevLen.current) {
      var last = chatMessages[chatMessages.length - 1];
      if (last.role === "assistant") setChatAnimIdx(chatMessages.length - 1);
    }
    chatPrevLen.current = chatMessages.length;
  }, [chatMessages.length]);

  useEffect(function () {
    if (builderMessages.length > buildPrevLen.current) {
      var last = builderMessages[builderMessages.length - 1];
      if (last.role === "assistant") setBuildAnimIdx(builderMessages.length - 1);
    }
    buildPrevLen.current = builderMessages.length;
  }, [builderMessages.length]);

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
    normalizeFiles(fileList, chatAttachments, setChatAttachments);
  }

  function addBuildFiles(fileList) {
    normalizeFiles(fileList, buildAttachments, setBuildAttachments);
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
        "x-api-secret": "INTELLIFLOW_OPS_2026",
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
          base64: attachment.base64 || null,
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

      const newChatMsg = { role: "assistant", content: reply, attachments: [], badge: "Chat" };
      setChatMessages((prev) => [...prev, newChatMsg]);
      try {
        const allMsgs = [...chatMessages, { role: "user", content: chatInput }, newChatMsg];
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat: {
            assistantType: "marketer",
            title: (chatInput || "Conversation").slice(0, 60),
            messages: allMsgs.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content : "[attachment]" })),
            savedAt: new Date().toISOString(),
          } }),
        });
      } catch (_) {}
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

      const newBuildMsg = { role: "assistant", content: reply, attachments: [], badge: "Build Ad" };
      setBuilderMessages((prev) => [...prev, newBuildMsg]);
      try {
        const allMsgs = [...builderMessages, { role: "user", content: buildInput }, newBuildMsg];
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat: {
            assistantType: "marketer",
            title: (buildInput || "Build Ad").slice(0, 60),
            messages: allMsgs.map(m => ({ role: m.role, content: typeof m.content === "string" ? m.content : "[attachment]" })),
            savedAt: new Date().toISOString(),
          } }),
        });
      } catch (_) {}
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
    <div className="min-h-screen overflow-x-hidden w-full max-w-[100vw] text-white" style={{ background: 'linear-gradient(180deg, #08090b 0%, #0c0e14 100%)' }}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[10%] top-[15%] h-[280px] w-[280px] rounded-full blur-[120px]" style={{ background: 'rgba(6,182,212,0.04)' }} />
        <div className="absolute right-[5%] bottom-[20%] h-[220px] w-[220px] rounded-full blur-[100px]" style={{ background: 'rgba(59,130,246,0.03)' }} />
      </div>

      <div className="relative mx-auto w-full max-w-3xl px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-white/[0.04] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-300 shadow-[0_12px_30px_rgba(0,0,0,0.20)] backdrop-blur-2xl">
              Marketer Assistant
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="rounded-full bg-white/[0.04] px-3 py-2 text-[11px] text-slate-400 hover:text-white hover:bg-white/[0.08] transition backdrop-blur-2xl"
            >
              History
            </button>
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
                      animating={index === buildAnimIdx}
                      onAnimComplete={function () { setBuildAnimIdx(-1); }}
                      attachments={message.attachments || []}
                      badge={message.badge}
                    />
                  ))}
                  {builderMessages.length > 0 && !loadingBuild && (
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

        <div className="overflow-hidden rounded-[28px] sm:rounded-[42px] glass-card">
          <div className="pointer-events-none absolute inset-0 rounded-[28px] sm:rounded-[42px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_14%,transparent_86%,rgba(255,255,255,0.02))]" />

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
                    animating={index === chatAnimIdx}
                    onAnimComplete={function () { setChatAnimIdx(-1); }}
                  />
                ))}
                {chatMessages.length > 0 && !loadingChat && (
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

                {chatMessages.length === 0 && !loadingChat && (
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
                      Creative Partner
                    </div>
                    <div className="text-[13px] italic text-zinc-500 max-w-xs">
                      Campaigns, hooks, ad builds, budget strategy, and creative direction.
                    </div>
                  </div>
                )}
                {loadingChat && (
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!loadingChat && (chatInput.trim() || chatAttachments.length > 0)) {
                              handleChatSubmit(e);
                            }
                          }
                        }}
                        rows={3}
                        placeholder="Ads, hooks, campaigns, creative, budget — ask anything..."
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
    <ChatHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}

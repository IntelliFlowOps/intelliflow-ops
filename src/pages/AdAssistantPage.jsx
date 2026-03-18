import { useMemo, useRef, useState, useEffect } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const STORAGE_KEY = 'intelliflow-assistant-conversations-v3';

const STARTER_PROMPTS = [
  'Which campaign should get more budget this week to help us reach 25 paying clients fastest?',
  'What is the best first hook for an HVAC ad if our only goal is more paying clients?',
  'Should our next ad be video or image based on what gives us the best shot at 25 clients?',
  'What should we cut first if spend is leaking and we need profitable growth?',
  'Write 3 better ad hooks for chiropractors focused on booked calls and paying clients.',
  'What should we test next based on our current numbers to get to 25 clients faster?'
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeTitle(text) {
  const clean = (text || '').trim().replace(/\s+/g, ' ');
  if (!clean) return 'New chat';
  return clean.length > 36 ? `${clean.slice(0, 36)}...` : clean;
}

export default function AdAssistantPage() {
  const { data } = useSheetData();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef(null);
  const historyRef = useRef(null);

  const slimRows = (rows, limit = 6) => Array.isArray(rows) ? rows.slice(0, limit) : [];

  const context = useMemo(() => {
    return {
      goal: 'Get to 25 paying clients',
      dashboard: data?.DASHBOARD || {},
      marketers: slimRows(data?.MARKETERS, 4),
      campaigns: slimRows(data?.CAMPAIGNS, 6),
      creativeInsights: slimRows(data?.CREATIVE_INSIGHTS, 6),
      foundersKpis: slimRows(data?.FOUNDERS_KPIS, 4),
      analytics: slimRows(data?.ALL_ANALYTICS, 6)
    };
  }, [data]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          setActiveId(parsed[0].id);
          return;
        }
      }
    } catch {}

    const firstId = makeId();
    const firstChat = {
      id: firstId,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    setConversations([firstChat]);
    setActiveId(firstId);
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeId, loading]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setHistoryOpen(false);
      }
    }

    if (historyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [historyOpen]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) || conversations[0] || null;

  const messages = activeConversation?.messages || [];
  const isEmpty = messages.length === 0;

  function createNewChat() {
    const id = makeId();
    const newChat = {
      id,
      title: 'New chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveId(id);
    setInput('');
    setHistoryOpen(false);
  }

  function deleteChat(id) {
    const remaining = conversations.filter((c) => c.id !== id);

    if (remaining.length === 0) {
      const newId = makeId();
      const freshChat = {
        id: newId,
        title: 'New chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: []
      };
      setConversations([freshChat]);
      setActiveId(newId);
      setHistoryOpen(false);
      return;
    }

    setConversations(remaining);
    if (activeId === id) {
      setActiveId(remaining[0].id);
    }
  }

  async function sendMessage(prefilled) {
    const messageToSend = (prefilled ?? input).trim();
    if (!messageToSend || loading || !activeConversation) return;

    const userMessage = { role: 'user', content: messageToSend };
    const nextMessages = [...activeConversation.messages, userMessage];
    const nextTitle =
      activeConversation.messages.length === 0
        ? makeTitle(messageToSend)
        : activeConversation.title;

    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === activeConversation.id
          ? {
              ...chat,
              title: nextTitle,
              updatedAt: Date.now(),
              messages: nextMessages
            }
          : chat
      )
    );

    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          context,
          history: nextMessages
        })
      });

      const result = await res.json();

      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeConversation.id
            ? {
                ...chat,
                title: nextTitle,
                updatedAt: Date.now(),
                messages: [
                  ...nextMessages,
                  {
                    role: 'assistant',
                    content: result.reply || result.error || 'Something went wrong.'
                  }
                ]
              }
            : chat
        )
      );
    } catch {
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeConversation.id
            ? {
                ...chat,
                title: nextTitle,
                updatedAt: Date.now(),
                messages: [
                  ...nextMessages,
                  {
                    role: 'assistant',
                    content: 'Something went wrong connecting to the assistant.'
                  }
                ]
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="h-[calc(100vh-112px)] overflow-hidden rounded-[32px] relative border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(84,180,255,0.28),transparent_28%),linear-gradient(180deg,#0a3e63_0%,#0a2740_26%,#08192d_55%,#040913_100%)] shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.18),transparent_35%)] opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)] opacity-20 pointer-events-none"></div>

      <div className="relative z-[1] h-full flex flex-col">
        <div className="px-6 lg:px-10 pt-5 pb-3 flex items-center justify-between border-b border-white/10 bg-[#0b1324]/40">
          <div>
            <div className="text-sm uppercase tracking-[0.35em] text-cyan-200/70 mb-1">
              IntelliFlow Assistant
            </div>
            <div className="text-2xl font-semibold text-white">
              Watchu Need?
            </div>
          </div>

          <div className="flex items-center gap-3 relative" ref={historyRef}>
            <button
              onClick={createNewChat}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-medium shadow-lg shadow-cyan-500/20"
            >
              + New Chat
            </button>

            <button
              onClick={() => setHistoryOpen((prev) => !prev)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm text-white transition border border-white/10"
            >
              History
            </button>

            <div
              className={`absolute right-0 top-14 w-80 rounded-3xl border border-white/10 bg-[#0d1627]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden transition-all duration-300 origin-top ${
                historyOpen
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
              }`}
            >
              <div className="px-4 py-3 border-b border-white/10 text-xs uppercase tracking-[0.25em] text-cyan-200/70">
                Past Chats
              </div>

              <div className="max-h-96 overflow-y-auto p-3 space-y-2">
                {conversations.map((chat) => (
                  <div
                    key={chat.id}
                    className={`rounded-2xl border ${
                      chat.id === activeId
                        ? 'border-cyan-300/20 bg-white/10'
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveId(chat.id);
                        setHistoryOpen(false);
                      }}
                      className="w-full text-left px-4 py-3"
                    >
                      <div className="text-sm text-white truncate">{chat.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        {new Date(chat.updatedAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </button>

                    <div className="px-4 pb-3">
                      <button
                        onClick={() => deleteChat(chat.id)}
                        className="text-[11px] text-zinc-400 hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-full max-w-5xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-[20px] overflow-hidden border border-white/15 bg-black/25 mb-6 shadow-2xl shadow-cyan-500/10">
                <img src="/logo.png" alt="IntelliFlow logo" className="w-full h-full object-cover" />
              </div>

              <div className="mt-3 text-center text-sm text-zinc-300">
                Locked on one goal: 25 paying clients.
              </div>

              <div className="mt-10 w-full max-w-3xl rounded-[30px] border border-white/10 bg-[#111a2c]/85 backdrop-blur-2xl shadow-2xl shadow-black/40 p-5">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="w-full bg-transparent text-white text-lg placeholder:text-zinc-400 resize-none min-h-[48px] max-h-40 focus:outline-none"
                />

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/8 border border-white/10 px-3 py-2 text-sm text-zinc-200">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] text-white">IF</span>
                    Data-based answers
                  </div>

                  <button
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    ↑
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-5 max-w-5xl">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="px-4 py-2 rounded-full bg-[#26354f]/85 hover:bg-[#314361] text-sm text-zinc-200 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-[28px] px-5 py-4 shadow-xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 text-zinc-100'
                      }`}
                    >
                      <div className="text-[11px] uppercase tracking-[0.2em] opacity-70 mb-2">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <div className="whitespace-pre-wrap text-[15px] leading-7">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl rounded-[28px] px-5 py-4 bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 text-zinc-100">
                      <div className="text-[11px] uppercase tracking-[0.2em] opacity-70 mb-2">
                        Assistant
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 typing-dot"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 typing-dot"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 typing-dot"></span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>
            </div>

            <div className="px-6 lg:px-10 py-5 border-t border-white/10 bg-[#0b1324]/80 backdrop-blur-2xl">
              <div className="max-w-4xl mx-auto">
                <div className="rounded-[30px] border border-white/10 bg-[#10172a]/85 px-5 py-4 flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything"
                    className="flex-1 bg-transparent text-white text-base placeholder:text-zinc-400 resize-none min-h-[40px] max-h-40 focus:outline-none"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading}
                    className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-lg shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

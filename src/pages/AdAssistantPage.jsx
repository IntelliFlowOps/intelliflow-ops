import { useMemo, useRef, useState, useEffect } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const STARTER_PROMPTS = [
  'Write a first draft',
  'Get advice on budget allocation',
  'Learn what our data says',
  'Create ad ideas',
  'Make a plan for this week',
  'Fix our worst campaign'
];

export default function AdAssistantPage() {
  const { data } = useSheetData();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const context = useMemo(() => {
    return {
      dashboard: data?.DASHBOARD || {},
      customers: data?.CUSTOMERS || [],
      marketers: data?.MARKETERS || [],
      campaigns: data?.CAMPAIGNS || [],
      creativeInsights: data?.CREATIVE_INSIGHTS || [],
      commissionRules: data?.COMMISSION_RULES || {},
      commissionLedger: data?.COMMISSION_LEDGER || [],
      foundersKpis: data?.FOUNDERS_KPIS || [],
      customerActivity: data?.CUSTOMER_ACTIVITY || [],
      analytics: data?.ALL_ANALYTICS || []
    };
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(prefilled) {
    const messageToSend = (prefilled ?? input).trim();
    if (!messageToSend || loading) return;

    const userMessage = { role: 'user', content: messageToSend };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          context
        })
      });

      const result = await res.json();

      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: result.reply || result.error || 'Something went wrong.'
        }
      ]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: 'Something went wrong connecting to the assistant.'
        }
      ]);
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

  const isEmpty = messages.length === 0;

  return (
    <div className="h-[calc(100vh-112px)] overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top,#0f5d8a_0%,#0b3450_28%,#081b31_58%,#040913_100%)] shadow-2xl shadow-black/40">
      {isEmpty ? (
        <div className="h-full flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.18),transparent_30%)] opacity-40"></div>
          <div className="absolute bottom-0 left-0 right-0 h-56 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_60%)] blur-3xl opacity-25"></div>

          <div className="relative z-[1] flex flex-col items-center">
            <div className="w-20 h-20 rounded-[24px] overflow-hidden border border-white/15 bg-black/25 mb-6 shadow-2xl shadow-cyan-500/10">
              <img src="/logo.png" alt="IntelliFlow logo" className="w-full h-full object-cover" />
            </div>

            <h1 className="text-4xl lg:text-6xl font-semibold text-white text-center tracking-tight">
              Good evening
            </h1>
            <h2 className="text-3xl lg:text-5xl font-semibold text-white text-center tracking-tight mt-2">
              What do you need help with?
            </h2>

            <div className="mt-10 w-full max-w-3xl">
              <div className="rounded-[30px] border border-white/10 bg-[#10172a]/85 backdrop-blur-2xl shadow-2xl shadow-black/40 px-5 py-5">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="w-full bg-transparent text-white text-base placeholder:text-zinc-400 resize-none min-h-[40px] focus:outline-none"
                />
                <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex flex-wrap gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-sm text-zinc-200 transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mt-10">
              <div className="rounded-[26px] bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/25">
                <div className="text-sm text-zinc-400 mb-3">Jump back into your data</div>
                <div className="space-y-3 text-sm">
                  <div className="text-zinc-200">Current dashboard snapshot</div>
                  <div className="text-zinc-500">Live Google Sheets context loaded</div>
                  <div className="text-zinc-500">Use this for real budget guidance</div>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/25">
                <div className="text-sm text-zinc-400 mb-3">Get guided ad help</div>
                <div className="grid grid-cols-3 gap-3 text-xs text-zinc-300">
                  <div className="rounded-2xl bg-white/5 p-4 text-center">Meta</div>
                  <div className="rounded-2xl bg-white/5 p-4 text-center">Google</div>
                  <div className="rounded-2xl bg-white/5 p-4 text-center">Hooks</div>
                  <div className="rounded-2xl bg-white/5 p-4 text-center">Copy</div>
                  <div className="rounded-2xl bg-white/5 p-4 text-center">Budget</div>
                  <div className="rounded-2xl bg-white/5 p-4 text-center">Creative</div>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/25">
                <div className="text-sm text-zinc-400 mb-3">Keep talking to your data</div>
                <div className="space-y-3 text-sm">
                  <div className="text-zinc-200">Ask where spend should move</div>
                  <div className="text-zinc-500">Ask what campaigns are weak</div>
                  <div className="text-zinc-500">Ask what ads to make next</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
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
                      {msg.role === 'user' ? 'You' : 'Ad Assistant'}
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
                      Ad Assistant
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
        </div>
      )}
    </div>
  );
}

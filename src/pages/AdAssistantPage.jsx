import { useMemo, useRef, useState, useEffect } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const STARTER_PROMPTS = [
  'Write a first draft',
  'Get advice',
  'Learn from our data',
  'Create an ad idea',
  'Make a budget plan',
  'Fix our weakest campaign'
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
    } catch {
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
    <div className="h-[calc(100vh-112px)] overflow-hidden rounded-[32px] relative border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(84,180,255,0.28),transparent_28%),linear-gradient(180deg,#0a3e63_0%,#0a2740_26%,#08192d_55%,#040913_100%)] shadow-2xl shadow-black/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(255,255,255,0.18),transparent_35%)] opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_55%)] opacity-20 pointer-events-none"></div>

      {isEmpty ? (
        <div className="h-full flex flex-col items-center justify-center px-6 relative z-[1]">
          <div className="w-full max-w-5xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-[20px] overflow-hidden border border-white/15 bg-black/25 mb-6 shadow-2xl shadow-cyan-500/10">
              <img src="/logo.png" alt="IntelliFlow logo" className="w-full h-full object-cover" />
            </div>

            <div className="text-center mb-2">
              <div className="text-sm uppercase tracking-[0.35em] text-cyan-200/70 mb-4">
                IntelliFlow Assistant
              </div>
              <h1 className="text-white text-center font-semibold tracking-tight text-4xl lg:text-6xl leading-tight">
                Watchu need help with?
              </h1>
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
                  Quick response
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

            <div className="flex flex-wrap items-center justify-center gap-3 mt-5 max-w-4xl">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mt-12">
              <div className="rounded-[26px] bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/25 min-h-[180px]">
                <div className="text-sm text-zinc-400 mb-3">Jump back into your data</div>
                <div className="space-y-3 text-sm">
                  <div className="text-zinc-200">Current dashboard snapshot</div>
                  <div className="text-zinc-500">Live Google Sheets context loaded</div>
                  <div className="text-zinc-500">Use this for real budget guidance</div>
                </div>
              </div>

              <div className="rounded-[26px] bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/25 min-h-[180px]">
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

              <div className="rounded-[26px] bg-[#121a2d]/80 backdrop-blur-xl border border-white/10 p-5 shadow-xl shadow-black/25 min-h-[180px]">
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

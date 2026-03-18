import { useMemo, useRef, useState, useEffect } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const STARTER_PROMPTS = [
  'How should we split this week’s budget based on current results?',
  'Should this ad be a video, image, or carousel?',
  'Write me 5 hooks for a dental practice ad.',
  'What should we change in our worst-performing campaign?',
  'Give me 3 Meta ad angles for HVAC.',
  'How do we improve our CTR and lower CPL?'
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
    <div className="h-[calc(100vh-112px)] flex flex-col text-zinc-100">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full px-4 lg:px-8">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="absolute inset-0 blur-3xl bg-indigo-500/20 rounded-full scale-150"></div>
                <div className="relative w-24 h-24 rounded-3xl bg-black/40 border border-white/10 glow-ring float-slow overflow-hidden flex items-center justify-center">
                  <img src="/logo.png" alt="IntelliFlow logo" className="w-full h-full object-cover" />
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-zinc-100 mb-3 text-center">
                IntelliFlow Ad Assistant
              </h1>

              <p className="text-zinc-400 text-center max-w-3xl mb-10 leading-7 text-base">
                Ask anything about ad copy, hooks, offers, creative direction, budget allocation,
                campaign performance, Meta, Google, video ideas, image ideas, or what your real data says you should do next.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200 px-5 py-4 shadow-lg shadow-black/20"
                  >
                    <div className="text-sm text-zinc-200 leading-6">{prompt}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-6">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex message-enter ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-3xl px-5 py-4 shadow-xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-indigo-500/20'
                        : 'bg-white/[0.04] backdrop-blur-xl border border-white/10 text-zinc-100 shadow-black/30'
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
                <div className="flex justify-start message-enter">
                  <div className="max-w-3xl rounded-3xl px-5 py-4 bg-white/[0.04] backdrop-blur-xl border border-white/10 text-zinc-100 shadow-black/30">
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
          )}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/20 backdrop-blur-2xl px-4 lg:px-8 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about budget, hooks, ad copy, videos, images, targeting, campaign performance, or what to do next..."
              className="flex-1 rounded-3xl bg-white/[0.04] border border-white/10 px-5 py-4 text-sm resize-none min-h-[68px] max-h-48 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="rounded-3xl px-6 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-medium disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

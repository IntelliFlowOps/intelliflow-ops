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
    <div className="h-[calc(100vh-64px)] bg-surface-900 text-zinc-100 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto h-full px-6">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-accent-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-zinc-100 mb-3 text-center">
                IntelliFlow Ad Assistant
              </h1>

              <p className="text-zinc-400 text-center max-w-2xl mb-10 leading-7">
                Ask anything about ad copy, hooks, creative direction, budget allocation, campaign performance,
                Meta, Google, images, video ideas, or what your real numbers say you should do next.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left rounded-2xl border border-surface-500/40 bg-surface-800/70 hover:bg-surface-700/80 transition px-5 py-4"
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
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-3xl px-5 py-4 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-accent text-white'
                        : 'bg-surface-800 border border-surface-500/40 text-zinc-100'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] opacity-70 mb-2">
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
                  <div className="max-w-3xl rounded-3xl px-5 py-4 bg-surface-800 border border-surface-500/40 text-zinc-100">
                    <div className="text-[11px] uppercase tracking-[0.18em] opacity-70 mb-2">
                      Ad Assistant
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.15s]"></span>
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.3s]"></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-surface-500/30 bg-surface-900/95 backdrop-blur px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about budget, hooks, ad copy, videos, images, targeting, campaign performance, or what to do next..."
              className="flex-1 rounded-3xl bg-surface-800 border border-surface-500/40 px-5 py-4 text-sm resize-none min-h-[68px] max-h-48 focus:outline-none text-zinc-100 placeholder:text-zinc-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="rounded-3xl px-6 py-4 bg-accent hover:bg-accent-dim text-white font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

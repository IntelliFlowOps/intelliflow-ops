import { useState } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

export default function AdAssistantPage() {
  const { data } = useSheetData();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hey — I’m IntelliFlow’s Ad Assistant. Ask me anything about ad strategy, copy, creative, budget allocation, hooks, images, videos, or how to improve current campaigns."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            dashboard: data?.DASHBOARD || {},
            campaigns: data?.CAMPAIGNS || [],
            creativeInsights: data?.CREATIVE_INSIGHTS || [],
            marketers: data?.MARKETERS || [],
            analytics: data?.ALL_ANALYTICS || []
          }
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

  return (
    <div className="h-full min-h-[calc(100vh-120px)] flex flex-col bg-surface-900 text-zinc-100">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
        <div className="py-6 border-b border-surface-500/30">
          <h1 className="text-2xl font-semibold">Ad Assistant</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Ask about copy, creative, offers, hooks, videos, images, budget, or campaign strategy.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-3xl rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'ml-auto bg-accent text-white'
                  : 'mr-auto bg-surface-700 border border-surface-500/40'
              }`}
            >
              <div className="text-xs uppercase tracking-wider mb-1 opacity-70">
                {msg.role === 'user' ? 'You' : 'Ad Assistant'}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-6">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="mr-auto bg-surface-700 border border-surface-500/40 rounded-2xl px-4 py-3 max-w-3xl">
              <div className="text-xs uppercase tracking-wider mb-1 opacity-70">
                Ad Assistant
              </div>
              <div className="text-sm text-zinc-400">Thinking...</div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 py-4 bg-surface-900">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about ad copy, videos, images, budget, targeting, or performance..."
              className="flex-1 rounded-2xl bg-surface-800 border border-surface-500/40 px-4 py-3 text-sm resize-none min-h-[72px] focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="px-5 py-3 rounded-2xl bg-accent text-white font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
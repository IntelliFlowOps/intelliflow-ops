import { useEffect, useMemo, useRef, useState } from "react";

const EXAMPLE_QUESTIONS = [
  "What is the highest-leverage move to get us closer to 25 clients this month?",
  "What breaks at scale if we keep onboarding this way?",
  "What is our weakest conversion bottleneck right now?",
  "Should we broaden ICP or fix close rate first?",
  "What should we change on the offer to improve sign-up rate?",
  "Where are we leaking revenue operationally?",
];

function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[88%] rounded-[22px] border px-4 py-3 shadow-lg whitespace-pre-wrap text-sm leading-6",
          isUser
            ? "bg-white/10 border-white/15 text-white"
            : "bg-cyan-400/10 border-cyan-300/20 text-slate-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]",
        ].join(" ")}
      >
        <div className="mb-1 text-[10px] uppercase tracking-[0.18em] opacity-60">
          {isUser ? "Founder" : "Founder Assistant"}
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}

export default function AdAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "I’m locked in on the path to 2,000 clients. Bring me the bottleneck, the numbers, or the decision you need pressure-tested.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const compactExamples = useMemo(() => EXAMPLE_QUESTIONS.slice(0, 6), []);

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/founder-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          messages: nextMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get founder assistant response.");
      }

      const data = await response.json();
      const reply =
        data?.reply ||
        data?.message ||
        data?.content ||
        "I couldn’t generate a response. Check the assistant route and response shape.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "The founder assistant request failed. Check the API route wiring and make sure the response returns a reply, message, or content field.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleExampleClick(example) {
    setInput(example);
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),rgba(7,17,31,0.96)_42%)] shadow-[0_0_60px_rgba(34,211,238,0.08)]">
          <div className="border-b border-white/8 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.18)]">
                <div className="absolute inset-2 rounded-xl border border-cyan-300/25" />
                <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
              </div>

              <div>
                <h1 className="text-lg font-semibold tracking-wide text-white">
                  Founder Assistant
                </h1>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">
                  IntelliFlow Communications
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-h-[78vh] flex-col">
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6"
            >
              {messages.map((message, index) => (
                <MessageBubble
                  key={`${message.role}-${index}`}
                  role={message.role}
                  content={message.content}
                />
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 shadow-lg">
                    <div className="mb-1 text-[10px] uppercase tracking-[0.18em] opacity-60">
                      Founder Assistant
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

            <div className="border-t border-white/8 px-4 py-4 md:px-6">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex items-end gap-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    placeholder="Ask about growth, bottlenecks, churn, CAC, close rate, onboarding, or what breaks at scale..."
                    className="min-h-[88px] w-full resize-none rounded-[22px] border border-cyan-300/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-cyan-300/40 focus:bg-white/7"
                  />

                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="h-[52px] rounded-[22px] border border-cyan-300/25 bg-cyan-400/15 px-5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>

                <div className="rounded-[22px] border border-white/8 bg-white/4 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Example prompts
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {compactExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => handleExampleClick(example)}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300/25 hover:bg-cyan-400/10"
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
    </div>
  );
}

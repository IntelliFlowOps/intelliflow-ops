import { useState, useEffect, useRef } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';
import { buildFounderAssistantContext } from '../lib/assistantContextBuilders.js';

const FOUNDER_PIN = '2343';

const STARTER_PROMPTS_V1 = [
  'Write me a cold call script for an HVAC company',
  'How do I handle "we already have someone for that"?',
  'What makes us better than Podium?',
  'Give me a 60-second pitch for a plumber',
  'How do I explain ROI to a skeptical owner?',
  'What do I say when they ask about price?',
  'Help me write a cold DM for a roofing company',
  'What are the top objections and how do I crush them?',
];

const STARTER_PROMPTS_V2 = [
  'Write me a cold call script using the V2 booking flow',
  'How do I explain the quote + booking dual flow to a prospect?',
  'What niches benefit most from the V2 calendar integrations?',
  'How does V2 handle after-hours calls differently?',
  'Give me a pitch that leads with revenue recovery for HVAC',
  'How do I explain the warm transfer escalation feature?',
  'Write a follow-up DM after a no-show demo',
  'What objections come up around AI voice and how do I handle them?',
];

const V1_CONTEXT = `
PRODUCT VERSION: V1 (Current — Live Product)

WHAT INTELLIFLOW DOES (V1):
IntelliFlow Communications is an AI-powered missed call and booking automation platform for service businesses. When a customer calls a client's business and nobody answers, IntelliFlow's AI automatically responds within 30-60 seconds via SMS to capture the lead, offer a booking link, or schedule a callback. During business hours, the AI can perform a warm transfer to a live person. After hours, it handles the caller with an AI voice agent (powered by Retell AI via Twilio) that offers two options: receive a booking/scheduling link via SMS, or leave info for a callback during operating hours.

V1 FEATURES:
- Missed call SMS follow-up within 30-60 seconds (configurable)
- AI voice agent (Retell AI) handles inbound calls with AI disclosure
- During hours: warm transfer to configured business number
- After hours: booking link via SMS or callback scheduling
- Per-tenant configuration: business hours, escalation number, agent prompt, booking link
- Dashboard for client staff to view logs and usage
- Multi-tenant: completely isolated per client
- Twilio subaccount per client for number management

WHAT V1 IS NOT:
- Not a full conversational booking flow (that is V2)
- Not a multi-step quote capture system (that is V2)
- Not integrated with calendars like Google Calendar or Jobber yet (that is V2)
V1 is reliable, fast, and production-ready. It recovers revenue from missed calls. That is the core value proposition.
`;

const V2_CONTEXT = `
PRODUCT VERSION: V2 (Coming Soon — Full Platform)

WHAT INTELLIFLOW DOES (V2):
IntelliFlow V2 is a complete AI-driven call behavior platform. When a customer calls, the system handles the ENTIRE conversation — routing between quote capture and appointment booking, letting callers choose SMS or live voice, collecting scheduling preferences, surfacing real calendar availability, escalating when needed, and pushing confirmed bookings into the client's calendar and CRM automatically.

V2 FEATURES:
- Full conversational booking AND quote capture in one flow
- Caller chooses their channel: SMS or stay on the call — for BOTH quote and booking intents
- Real calendar integration: Google Calendar, Outlook, Apple Calendar, Jobber, Housecall Pro, ServiceTitan
- CRM integration: HubSpot, Salesforce
- Warm transfer escalation with AI briefing: IntelliFlow calls the client's escalation number, Retell briefs the agent, then bridges the customer — they're live
- Industry-specific qualifying questions configured per client
- Booking window capped at 30 days, surfaces exactly 2 slot options
- Out-of-hours: Calendly link or scheduled callback
- Confirmation SMS to customer on booking
- ICS fallback for any calendar system not natively supported
- Client dashboard with real-time booking management

V2 DIFFERENTIATORS VS COMPETITORS:
1. Voice + SMS in one unified flow — competitors do one or the other
2. Revenue recovery focus, not just "AI receptionist" — we close the job
3. Client-specific qualifying questions — not generic
4. If no slot works, we don't dead-end — we escalate to a live person, send a booking link, or schedule a callback
5. Easy onboarding — live in a day. Competitors like RingCentral and Smith.ai require long setup
6. Fair transparent pricing — no upsell traps, no enterprise pricing games
`;

const SALES_SYSTEM_PROMPT = (version, context, sheetContext) => `
You are IntelliFlow's elite sales intelligence — the most knowledgeable person in the building about our product, our competitors, our customers, and how to close deals. You live inside IntelliFlow alongside the sales team. You know everything.

COMPANY: IntelliFlow Communications LLC
FOUNDERS: Kyle Kirkham + Brennan Balka (Fort Wayne, Indiana — 50/50)
WHAT WE ARE: AI-powered missed call and booking automation for service businesses. We frame ourselves as REVENUE RECOVERY — not just AI receptionist. Business owners care about money, not technology.

${context}

PRICING:
- Starter: $299/month or $3,289/year (1 month free)
- Pro: $499/month or $5,489/year (1 month free)  
- Premium: $999/month or $10,989/year (1 month free)
No free trial. The product is worth paying for. Demo call → close.

TARGET NICHES (in priority order):
1. HVAC (highest call volume, highest job value, most to lose from missed calls)
2. Plumbing
3. Roofing
4. Electrical
5. Landscaping
6. Pest Control
7. Chiropractic
8. Auto Repair
9. Other high-call-volume service businesses

GEOGRAPHIES WE ARE TARGETING RIGHT NOW:
- Fort Wayne, Indiana (home base — Kyle, Brennan, Emma, Wyatt)
- Northwest Indiana
- Indianapolis, Indiana
- Kentucky (statewide outreach)
- Texas (statewide outreach)
Each geography has a dedicated sales rep with a scraped leads list of ~500 prospects.

SALES PROCESS:
- No free trial — we are worth the investment
- Demo call → close
- Sales reps are cold calling and DMing from scraped lead lists
- Warm referrals from existing clients when available

OUR COMPETITORS AND HOW WE BEAT THEM:
1. RingCentral — enterprise product, complex setup, expensive, not focused on service businesses. We win on simplicity, speed to live, and price.
2. Podium — focused on reviews and messaging broadly, not revenue recovery specifically. Expensive. We win on focus and ROI framing.
3. Smith.ai — human-staffed answering service, much more expensive, slower to set up. We win on automation, price, and 24/7 availability without staffing cost.
4. Signpost — primarily reputation/review management. Not a direct competitor on the booking/recovery angle.
5. Numa — similar space but less sophisticated flow, smaller company, limited integrations. We win on product depth (especially V2) and support.

WHY WE WIN:
- Fair transparent pricing — no games, no upsells until you're ready
- Live in a day — competitors take weeks to onboard
- Revenue recovery framing — we show dollar value, not features
- Built specifically for service businesses — not a generic tool shoehorned in
- If a call can't be scheduled, we escalate — we don't dead-end leads

ROI FRAMING (use this to show prospects their dollar value):
- Average HVAC job: $300-$800. If they miss 5 calls/week that's $1,500-$4,000/week in potential revenue.
- At $299/month IntelliFlow pays for itself on ONE recovered job.
- For plumbers: average job $150-$400. Same math — one recovered call = paid.
- Roofing: average job $5,000-$15,000. One recovered call = 3-4 months paid.
- Use this framework: "How much is the average job worth? How many calls do you miss per week? We pay for ourselves in [X] jobs."

OBJECTION HANDLING:
- "It's too expensive" → "What's one missed HVAC call worth to you? $300? $500? IntelliFlow pays for itself in a single recovered job. You're not buying software — you're buying back revenue you're already losing."
- "We already have someone for that" → "Do they answer at 11pm on a Saturday? Do they respond in 30 seconds every time? IntelliFlow doesn't replace your team — it catches everything they can't."
- "We're not sure about AI" → "Your customer doesn't know it's AI unless you tell them. They get a response in under a minute instead of going to voicemail and calling your competitor. That's what matters."
- "We need to think about it" → "Totally fair. While you think about it, you're going to miss some calls this week. What would it take to make the decision today?"
- "We already use [competitor]" → "What do you like about it? [Listen]. What's missing? [Listen]. Most of our clients came from [competitor] because [specific gap]. Can I show you what that looks like with IntelliFlow?"
- "We're too small" → "Our Starter plan is $299/month. If you get one job from a recovered call this month, it paid for itself. There's no size requirement — just businesses that miss calls."

YOUR ROLE:
You are not a generic AI. You are IntelliFlow's internal sales expert. You know every detail of our product, every competitor weakness, every niche's pain point, and every objection word-for-word. You help sales reps:
- Write cold call scripts tailored to specific industries and cities
- Handle any objection they've encountered
- Build pitch decks and talking points
- Understand pricing and how to justify it
- Craft follow-up messages after no-shows or hangups
- Qualify leads and prioritize their list
- Role-play calls so they're ready before dialing
- Explain the product simply and powerfully
- Close on the first call when possible

PERSONALITY:
You are direct, confident, and ruthlessly focused on revenue. You sound like someone who has closed hundreds of these deals. You give real answers, not corporate hedging. You know the product cold. You care about the rep winning.

Current business metrics available: ${sheetContext || 'Loading...'}

Remember: Every answer should help the rep close more deals or handle more situations. Be specific. Be tactical. Be IntelliFlow.
`;

function PinModal({ onUnlock, onCancel, title }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  function attempt() {
    if (pin === FOUNDER_PIN) onUnlock();
    else { setError('Incorrect PIN'); setPin(''); }
  }
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] p-8 space-y-5 text-center"
        style={{ background: 'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(60px)', boxShadow: '0 48px 100px rgba(0,0,0,0.7)' }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto text-2xl"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>🔐</div>
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <div className="text-xs text-zinc-500 mt-1">Founder PIN required</div>
        </div>
        <input type="password" value={pin} onChange={e => { setPin(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') attempt(); }}
          placeholder="PIN" autoFocus
          className="w-full rounded-2xl px-4 py-3 text-center text-lg text-white outline-none tracking-[0.4em]"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
          <button onClick={attempt} className="flex-1 rounded-2xl py-2.5 text-sm font-medium"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}>Unlock</button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const { data } = useSheetData();
  const [version, setVersion] = useState('V1');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingVersion, setPendingVersion] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const context = version === 'V1' ? V1_CONTEXT : V2_CONTEXT;
  const prompts = version === 'V1' ? STARTER_PROMPTS_V1 : STARTER_PROMPTS_V2;

  function requestVersionChange(v) {
    if (v === version) return;
    setPendingVersion(v);
    setShowPinModal(true);
  }

  function confirmVersionChange() {
    setVersion(pendingVersion);
    setShowPinModal(false);
    setPendingVersion(null);
    setMessages([]);
  }

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const sheetContext = data ? buildFounderAssistantContext(data) : '';
    const systemPrompt = SALES_SYSTEM_PROMPT(version, context, sheetContext);
    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantType: 'sales',
          message: msg,
          messages: next,
          systemPrompt,
        }),
      });
      const d = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — try again.' }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] px-6 py-4 space-y-4">
      {showPinModal && (
        <PinModal
          title={`Switch to ${pendingVersion} Mode`}
          onUnlock={confirmVersionChange}
          onCancel={() => { setShowPinModal(false); setPendingVersion(null); }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
              style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(2,132,199,0.1))', border: '1px solid rgba(6,182,212,0.25)' }}>
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">IntelliFlow Sales Intelligence</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Ask anything — scripts, objections, pitches, competitor questions, lead strategy</p>
            </div>
          </div>
        </div>

        {/* Version toggle */}
        <div className="shrink-0 flex items-center gap-2 rounded-2xl p-1"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {['V1', 'V2'].map(v => (
            <button key={v} onClick={() => requestVersionChange(v)}
              className="rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5"
              style={version === v ? {
                background: v === 'V1' ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)',
                color: v === 'V1' ? '#67e8f9' : '#a5b4fc',
                border: `1px solid ${v === 'V1' ? 'rgba(6,182,212,0.3)' : 'rgba(99,102,241,0.3)'}`,
              } : { color: '#52525b' }}>
              {v === 'V2' && <span className="text-[9px]">🔐</span>}
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Version badge */}
      <div className="flex items-center gap-2">
        <div className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={version === 'V1' ? {
            background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)'
          } : {
            background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)'
          }}>
          {version === 'V1' ? 'V1 Mode — Current Product' : 'V2 Mode — Full Platform'}
        </div>
        <span className="text-[10px] text-zinc-600">
          {version === 'V1' ? 'Missed call + AI voice + warm transfer' : 'Full booking + quote + calendar integrations'}
        </span>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-[20px] p-4 space-y-3 min-h-0"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl"
              style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.15),rgba(2,132,199,0.1))', border: '1px solid rgba(6,182,212,0.2)' }}>
              ⚡
            </div>
            <div>
              <div className="text-base font-semibold text-white">IntelliFlow Sales Intelligence</div>
              <div className="text-sm text-zinc-400 mt-1 max-w-md leading-6">
                I know everything about IntelliFlow — the product, the pricing, every competitor, every objection, and every niche we target. Ask me anything or use the prompts below to get started.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {prompts.map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="rounded-full px-3 py-1.5 text-xs transition text-left"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex w-full items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="shrink-0 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(2,132,199,0.1))', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}>
                ⚡
              </div>
            )}
            <div className={`max-w-[78%] text-sm leading-7 whitespace-pre-wrap px-5 py-3.5 ${m.role === 'user' ? 'rounded-[28px] rounded-br-[8px] text-white' : 'rounded-[28px] rounded-bl-[8px] text-slate-100'}`}
              style={m.role === 'user' ? {
                background: 'linear-gradient(135deg,#0e7490,#0891b2)',
                boxShadow: '0 4px 24px rgba(6,182,212,0.2)',
              } : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start px-2">
            <div className="flex items-center gap-1 rounded-[20px] px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[0,150,300].map(d => (
                <div key={d} className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                  style={{ animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: d + 'ms' }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          placeholder="Ask anything — scripts, objections, competitor questions, pitch ideas..."
          className="flex-1 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="rounded-2xl px-5 py-3 text-sm font-medium transition disabled:opacity-40"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}>
          Send
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';
import { buildFounderAssistantContext } from '../lib/assistantContextBuilders.js';

const FOUNDER_PIN = '2343';

const STARTER_PROMPTS_V1 = [
  'Research [business name] and write me a personalized pitch for them',
  "Role-play a cold call — you be the skeptical HVAC owner, I'll pitch",
  'They said "we already have someone for that" — what do I say?',
  'Write a 60-second pitch for a plumbing company that runs Google Ads',
  'What makes us better than Podium? Give me talking points',
  'They want to think about it — how do I keep them on the line?',
  'Write a cold DM for a roofing company in Fort Wayne',
  'Give me the ROI math for a landscaping company',
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
You are IntelliFlow's elite sales intelligence — not a generic AI, not a chatbot, not a script reader. You are the sharpest sales mind in the building. You think like a closer, talk like someone who has been in the field, and give advice that actually works in the real world.

You live inside IntelliFlow. You know the product cold. You know every competitor's weakness. You know what makes a service business owner say yes on the first call. And when a rep gives you a business name or website, you think deeply about that specific business — their size, their likely pain points, their call volume, their competition — and you tailor everything to them.

---

COMPANY: IntelliFlow Communications LLC
FOUNDERS: Kyle Kirkham + Brennan Balka — Fort Wayne, Indiana
MISSION: Revenue recovery for service businesses. Not "AI receptionist." Not "chatbot." REVENUE RECOVERY. Every missed call is money walking out the door. We stop that.

---

${context}

---

PRICING:
Starter: $299/month or $3,289/year (saves $299 — one month free)
Pro: $499/month or $5,489/year (saves $499 — one month free)
Premium: $999/month or $10,989/year (saves $999 — one month free)

No free trial. The product earns its price on the first recovered job. We demo, we show the value, we close.

---

TARGET NICHES (priority order):
1. HVAC — highest call volume, highest urgency, $300-$800 average job, customers call competitors immediately if unanswered
2. Plumbing — emergency-driven, $150-$400 average job, cannot wait for callbacks
3. Roofing — $5,000-$15,000 average job, one recovered call = months of IntelliFlow paid
4. Electrical — high urgency, $200-$600 average job
5. Landscaping, Pest Control, Chiropractic, Auto Repair — high call volume, appointment-dependent

GEOGRAPHIES:
- Fort Wayne, Indiana (home base)
- Northwest Indiana
- Indianapolis, Indiana
- Kentucky (statewide)
- Texas (statewide)
Each territory has a dedicated rep with a scraped list of ~500 prospects.

---

THE TWO CORE PAIN POINTS THAT CLOSE DEALS:

Pain 1: "Your front desk is not available 24/7 — ours is."
Most service businesses have someone answering calls 8am-5pm. What happens at 5:01pm? What happens Saturday morning? What happens when your office manager is on lunch? IntelliFlow answers in 30 seconds, every time, 24/7. No days off. No sick days. No missed calls.

Pain 2: "You're spending money on ads to get calls — then losing those calls to voicemail."
If they run Google Ads, Facebook Ads, or any paid channel, every missed call is double damage — they paid for the lead AND lost the job. IntelliFlow captures what their ad spend already bought.

The ROI math that closes deals:
- HVAC: "What's your average job worth? $400? If IntelliFlow recovers one job this month, it paid for itself. What if it recovers ten?"
- Plumbing: "You probably miss 3-5 calls a week. At $200 average, that's $600-$1,000 a week walking out the door. IntelliFlow is $299/month."
- Roofing: "One recovered roof job is $5,000-$15,000. IntelliFlow pays for itself in the first 2 hours of the first job it saves."

---

COMPETITORS — WHAT TO SAY WHEN THEY COME UP:

RingCentral: "RingCentral is a phone system. We're not a phone system — we're revenue recovery. They don't automatically text a missed caller back in 30 seconds. They don't book appointments. They route calls. That's a fundamentally different product solving a different problem."

Podium: "Podium is great for reviews and customer messaging. It's not built for what we do — catching missed calls and converting them to booked jobs automatically. And Podium pricing is aggressive. You're paying for a lot of features you don't need."

Smith.ai: "Smith.ai uses real humans to answer calls — which sounds great until you realize you're paying $250-$350 for 30 calls. That's $8-$12 per call. IntelliFlow is flat rate. Unlimited calls. AI that responds in 30 seconds, not 2 minutes."

Signpost: "Signpost is primarily reputation management and customer communication. Not a direct competitor on what we do — but if they're using it, ask what they wish it did that it doesn't. That's your opening."

Numa: "Numa is a smaller player, similar concept. Less sophisticated flow, fewer integrations, less support. We've built this specifically for service businesses — it's not an afterthought."

The universal competitor move: Never bash them directly. Instead — "What do you like about what you're using? What's missing?" Then solve the gap.

---

SALES STYLE — THIS IS HOW WE SELL:

1. RESEARCH FIRST. If a rep gives you a business name, think about that business specifically. What industry? What size? Do they run ads? What's their likely call volume? Are they a one-truck operation or a multi-location company? Tailor everything to them. Generic pitches lose. Specific pitches close.

2. LEAD WITH THEIR PAIN, NOT OUR PRODUCT. Don't open with "IntelliFlow is an AI platform that..." Open with "Quick question — when a customer calls your business after hours, what happens?" Let them tell you the problem. Then you solve it.

3. PAINT THE PICTURE. Don't say "we send an automated text." Say "Imagine it's 9pm on a Friday. A homeowner's HVAC unit just died. They call you, they get voicemail, they call the next guy on Google and book with them. That job was yours. We make sure that never happens again."

4. USE NUMBERS, NOT FEATURES. Features don't close. Money closes. Every answer should connect back to dollars recovered, dollars saved, or jobs closed.

5. FINESSE THE CLOSE — DON'T FORCE IT. The goal is to get a decision on the call. But if they need more, you get a specific demo meeting booked — not "I'll send you some info." A date, a time, a calendar invite. Never let them off the call with nothing.

Closing language that works:
- "Based on what you've told me, I think the Starter plan makes the most sense to start. It's $299/month — that's less than one job you're currently losing. Want to get you set up today?"
- "I know you want to think about it — totally fair. Let's do this: I'll set up a 20-minute demo where I'll show you exactly what it looks like for an HVAC company your size. What does Tuesday or Wednesday look like for you?"
- "What would it take for this to make sense today?" (then stop talking)

---

OBJECTION PLAYBOOK:

"We already have someone for that" (receptionist/office manager):
"That's great — they probably handle it well during business hours. What happens when they're at lunch? What about after 5? What about weekends? IntelliFlow doesn't replace your team — it covers the hours and moments they can't. And it responds in 30 seconds every time, without fail."

"It's too expensive":
"I hear you — $299 feels like a real cost. But let me ask: what's your average job worth? [They answer]. So if IntelliFlow recovers one job this month that would have gone to voicemail, it more than paid for itself. You're not buying software — you're buying back revenue you're already losing right now."

"We use voicemail and call back":
"How quickly do you call back? [They answer]. Here's the thing — the average caller who goes to voicemail calls the next business within 5 minutes. If you're calling back in an hour, they're already booked with someone else. IntelliFlow responds in 30 seconds and keeps them engaged until you can get to them."

"We're too small / we don't miss that many calls":
"I respect that. Let me ask — do you have any missed calls in the last 30 days you didn't get back to? [They think]. Most small operations miss more than they realize because they're busy doing the work. That's exactly who this is built for — businesses where the owner is on the job, not the phone."

"Send me more information":
"Absolutely — I'll send you a quick overview. But honestly, the best way to see it is live. Can I set up 20 minutes with you this week? I'll show you exactly what it looks like for a [their industry] company and you can ask me anything. What day works?"

"We need to talk to our partner/spouse/manager":
"Of course. When do you usually connect with them? Could we set up a quick call with both of you? I can walk through it in 15 minutes and answer any questions on the spot — that's usually faster than playing phone tag."

---

CALL STRUCTURE (flexible, not robotic):

Opening (30 seconds): Get to the point. Tell them who you are and why you're calling in one sentence. Ask a question immediately.
"Hey [Name], this is [Rep] with IntelliFlow. Quick question — when a customer calls your [business type] after hours, what happens to that call?"

Discovery (2-3 minutes): Let them talk. Ask about call volume, biggest time they miss calls, whether they run ads, how busy they get. The more they talk, the better your pitch.

Pitch (60-90 seconds): Based on what they said. Specific, not generic. Use their words back at them.

ROI moment (30 seconds): One clear number. One clear question.

Close or set demo: Ask for the decision. If resistance, get a specific meeting on the calendar.

---

WHEN A REP SHARES A BUSINESS NAME OR DETAILS:
Think about that business specifically. What industry are they in? What size? What's their likely call volume? What pain points are most relevant to them? What's the ROI math for their specific average job value? Give a tailored script, not a template.

---

WHAT YOU CAN HELP WITH:
- Write personalized cold call scripts for any business type
- Role-play a call (rep plays the prospect, you play the IntelliFlow rep)
- Handle any objection word for word
- Build a follow-up sequence after no-show demos
- Explain pricing and justify it
- Compare IntelliFlow to any competitor
- Build a pitch around a specific prospect's business
- Help prioritize a lead list
- Write cold DMs or LinkedIn messages
- Explain the product simply for any audience
- Give creative angles nobody has thought of yet
- Help close deals in progress

Current business metrics: ${sheetContext || 'Loading...'}

You are not generic. You are IntelliFlow. Act like it.
`;;

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
          enableWebSearch: true,
        }),
      });
      const d = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: d.reply || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error — try again.' }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex flex-col px-6 py-4 space-y-4">
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

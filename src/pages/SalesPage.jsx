import { useState, useEffect, useRef } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const FOUNDER_PIN = '2343';

const PROMPTS_V1 = [
  "Write me a cold call script for an HVAC company in Fort Wayne",
  "They said we already have someone for that — what do I say?",
  "What makes us better than Podium?",
  "Give me the ROI math for a plumbing company",
  "They want to think about it — how do I keep them engaged?",
  "Write a cold DM for a roofing company",
  "Role-play: you be a skeptical HVAC owner, I will pitch you",
  "How do I handle the price objection without discounting?",
];

const PROMPTS_V2 = [
  "Write a pitch that leads with the full booking flow",
  "How do I explain the quote and booking dual flow to a prospect?",
  "What niches benefit most from calendar integrations?",
  "How does the warm transfer escalation work and why does it matter?",
  "Write a follow-up DM after a no-show demo",
  "What objections come up around AI voice calls?",
  "Give me the ROI math for a ServiceTitan client",
  "How do I position V2 against Smith.ai?",
];

function getSalesPrompt(version) {
  const v1product = `PRODUCT (V1 — Current Live Product):
IntelliFlow is an AI-powered missed call automation platform. When a customer calls and nobody answers, IntelliFlow responds within 30-60 seconds via SMS. During business hours it performs a warm transfer to the business. After hours the AI agent (powered by Retell AI via Twilio) offers the caller a booking link or callback scheduling. Everything is logged per client. Clients are live within a day of signing up.`;

  const v2product = `PRODUCT (V2 — Full Platform, Coming Soon):
IntelliFlow V2 is a complete AI call behavior platform. It handles full booking AND quote capture flows over both voice and SMS. The caller chooses their channel. It integrates directly with Google Calendar, Outlook, Jobber, Housecall Pro, ServiceTitan, HubSpot, and Salesforce. If no slot works, it escalates with a warm AI briefing to a live agent. Industry-specific qualifying questions. Confirmation SMS on booking. Clients are live within a day.`;

  return `You are IntelliFlow's elite sales intelligence. You are not generic. You think like a closer who has been in the field and knows how to win deals with service business owners.

You live inside IntelliFlow. You know the product, pricing, every competitor weakness, every objection, and every niche pain point cold. When a rep gives you a business name, you think about that business specifically and tailor everything to them.

COMPANY: IntelliFlow Communications LLC — Fort Wayne, Indiana
FOUNDERS: Kyle Kirkham and Brennan Balka (50/50)
POSITIONING: Revenue Recovery — not AI receptionist. Business owners care about money, not technology.

${version === 'V1' ? v1product : v2product}

PRICING:
Starter: $299/month or $3,289/year (one month free)
Pro: $499/month or $5,489/year (one month free)
Premium: $999/month or $10,989/year (one month free)
No free trial. Demo call then close.

TARGET NICHES (priority order): HVAC, Plumbing, Roofing, Electrical, Landscaping, Pest Control, Chiropractic, Auto Repair

GEOGRAPHIES: Fort Wayne IN, Northwest Indiana, Indianapolis, Kentucky, Texas. Each has a dedicated rep with a scraped lead list of 500 prospects doing cold calls and DMs.

THE TWO PAIN POINTS THAT CLOSE DEALS:
1. Your front desk is not available 24/7 — ours is. What happens at 5pm on Friday when a homeowner's AC dies?
2. You are spending money on ads to get calls, then losing those calls to voicemail. That is double damage.

ROI MATH:
HVAC average job $300-800. One recovered call pays for a month of IntelliFlow.
Plumbing average job $150-400. Three recovered calls pays for the year.
Roofing average job $5,000-15,000. One recovered call pays for years.
Always ask: what is your average job worth? How many calls do you miss per week? Then do the math live on the call.

COMPETITORS:
RingCentral: phone system, not revenue recovery, complex setup, not built for service businesses
Podium: reviews and messaging broadly, expensive, not focused on booking recovery
Smith.ai: human agents, $8-12 per call, we are flat rate, faster, 24/7
Signpost: reputation management, different product, different problem
Numa: similar concept, less sophisticated, smaller company, fewer integrations
Never bash directly. Ask what they like, what is missing, then fill that gap.

OBJECTION PLAYBOOK:
"We already have someone for that" — Do they answer at 11pm Saturday? Do they respond in 30 seconds every time? We do not replace your team, we cover what they cannot.
"Too expensive" — What is your average job worth? IntelliFlow pays for itself on one recovered job. You are not buying software, you are buying back revenue you are already losing.
"We use voicemail and call back later" — How fast do you call back? The average caller calls a competitor within 5 minutes of hitting voicemail. We respond in 30 seconds and keep them engaged.
"We are too small" — If you get one job from a recovered call this month, the Starter plan paid for itself. There is no minimum size, just businesses that miss calls.
"Send me more info" — I will send something quick. But the best way to see it is live. Can I get 20 minutes with you this week to show you exactly what it looks like for a company like yours? What day works?
"Need to talk to my partner" — When do you connect with them? Let us get a quick call with both of you, I can walk through it in 15 minutes and answer everything on the spot.

SALES STYLE:
Lead with their pain, not our product. Ask what happens when a customer calls after hours before you pitch anything.
Paint pictures. Do not say we send automated texts. Say: imagine it is 9pm Friday, a homeowner's HVAC dies, they call you, get voicemail, call the next guy on Google. That job was yours. We stop that.
Use numbers not features. Money closes deals, features do not.
Research the business if given a name. Think about their size, call volume, whether they run ads, their competition. Make it specific.
Close with finesse. Try to get a decision on the call. If they need time, lock in a specific demo meeting with a date and time before hanging up. Never let them off the call with nothing.

WHAT YOU CAN DO FOR A REP:
Write personalized cold call scripts for any business type or city
Role-play calls (rep plays the prospect, you play IntelliFlow)
Handle any objection word for word
Build follow-up sequences after no-shows
Explain and justify pricing
Compare us to any competitor
Write cold DMs or LinkedIn messages
Help prioritize a lead list
Give creative angles nobody has thought of
Help close deals in progress
Research a specific business and build a tailored pitch

You are IntelliFlow. Be the closer. Be specific. Be tactical. Every answer should help the rep win.`;
}

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

  const prompts = version === 'V1' ? PROMPTS_V1 : PROMPTS_V2;

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
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const systemPrompt = getSalesPrompt(version);
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
    <div className="space-y-4 px-6 py-4">
      {showPinModal && (
        <PinModal
          title={"Switch to " + pendingVersion + " Mode"}
          onUnlock={confirmVersionChange}
          onCancel={() => { setShowPinModal(false); setPendingVersion(null); }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(2,132,199,0.1))', border: '1px solid rgba(6,182,212,0.25)' }}>
            ⚡
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">IntelliFlow Sales Intelligence</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Scripts, objections, pitches, competitor questions, business research — ask anything</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1 rounded-2xl p-1"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {['V1', 'V2'].map(v => (
            <button key={v} onClick={() => requestVersionChange(v)}
              className="rounded-xl px-4 py-1.5 text-xs font-semibold transition"
              style={version === v ? {
                background: v === 'V1' ? 'rgba(6,182,212,0.15)' : 'rgba(99,102,241,0.15)',
                color: v === 'V1' ? '#67e8f9' : '#a5b4fc',
                border: v === 'V1' ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(99,102,241,0.3)',
              } : { color: '#52525b' }}>
              {v === 'V2' && <span className="mr-1 text-[9px]">🔐</span>}{v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={version === 'V1'
            ? { background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }
            : { background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
          {version === 'V1' ? 'V1 — Current Product' : 'V2 — Full Platform'}
        </div>
        <span className="text-[10px] text-zinc-600">
          {version === 'V1' ? 'Missed call recovery + AI voice + warm transfer' : 'Full booking + quote + calendar + CRM integrations'}
        </span>
      </div>

      <div className="rounded-[20px] p-4 space-y-3"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', minHeight: 400, maxHeight: 500, overflowY: 'auto' }}>

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
              style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.15),rgba(2,132,199,0.1))', border: '1px solid rgba(6,182,212,0.2)' }}>
              ⚡
            </div>
            <div>
              <div className="text-base font-semibold text-white">IntelliFlow Sales Intelligence</div>
              <div className="text-sm text-zinc-400 mt-1 max-w-md leading-6">
                Ask me anything about selling IntelliFlow. I know the product cold, every competitor weakness, and how to close service business owners. Give me a business name and I will research them and build a tailored pitch.
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {prompts.map((p, i) => (
                <button key={i} onClick={() => sendMessage(p)}
                  className="rounded-full px-3 py-1.5 text-xs transition text-left"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={"flex w-full items-end gap-2 " + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="shrink-0 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(2,132,199,0.1))', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}>
                  ⚡
                </div>
              )}
              <div className={"max-w-[78%] text-sm leading-7 whitespace-pre-wrap px-5 py-3.5 " + (m.role === 'user' ? 'rounded-[28px] rounded-br-[8px] text-white' : 'rounded-[28px] rounded-bl-[8px] text-slate-100')}
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
          ))
        )}

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

      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          placeholder="Ask anything — scripts, objections, pitches, research a specific business..."
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

import { useState, useEffect, useRef } from 'react';

const FOUNDER_PIN = '2343';

const PROMPTS_V1 = [
  "Write a cold call script for an HVAC company in Fort Wayne",
  "They said we already have someone for that - what do I say?",
  "What makes us better than Podium?",
  "Give me the ROI math for a plumbing company",
  "They want to think about it - how do I keep them engaged?",
  "Write a cold DM for a roofing company",
  "Role-play: you be a skeptical HVAC owner, I will pitch you",
  "How do I handle the price objection without discounting?",
];

const PROMPTS_V2 = [
  "Write a pitch leading with the full booking and quote flow",
  "How do I explain the dual flow to a prospect?",
  "What niches benefit most from calendar integrations?",
  "How does the warm transfer escalation work?",
  "Write a follow-up DM after a no-show demo",
  "What objections come up around AI voice calls?",
  "Give me the ROI math for a ServiceTitan client",
  "How do I position V2 against Smith.ai?",
];

const PROMPTS_OPSDESK = [
  "Write a cold call script for an HVAC owner doing $500k/year",
  "They say 'I already use QuickBooks' — what do I say?",
  "Walk me through the demo script for a plumber",
  "How do I justify $449/month to a landscaping company?",
  "They want to think about it — give me a keep-engaged response",
  "Write a cold DM for a pest control company owner",
  "Role-play: you be a skeptical roofing contractor, I'll pitch OpsDesk",
  "Compare OpsDesk to ServiceTitan for a small HVAC company",
];

const PRICING_DETAIL = "DETAILED PRICING AND TIER BREAKDOWN:\nStarter $299/month: SMS-only plan. 600 texts/month included. No voice calls. Overage: $0.12/text. Best for small businesses with low call volume that just need missed call text-back.\nPro $499/month: 1,500 texts/month + 400 voice minutes/month included. Handles 160-270 AI calls/month. Overage: $0.10/text + $0.25/voice minute. Best for mid-size businesses with moderate call volume that want both SMS and AI voice handling.\nPremium $999/month: 4,000 texts/month + 1,000 voice minutes/month included. Handles 400-670 AI calls/month. Overage: $0.08/text + $0.20/voice minute. Best for high-volume businesses like busy HVAC companies, multi-location operations, or anyone running heavy ad spend.\nAll plans include: Usage alerts at 70% and 90% of limits. Weekly ROI reporting emails (calls answered, leads captured, bookings, escalations). Usage protection so clients always know where they stand.\nAnnual pricing saves one month: Starter $3,289/yr, Pro $5,489/yr, Premium $10,989/yr.\nHuman escalation is a safety net not a full answering service. If a client consistently needs frequent escalation, move them up a tier.\nHow to pitch tier upgrades: Starter to Pro - if they miss more than 5-10 calls per day or want AI voice not just SMS. Pro to Premium - if they run heavy Google Ads, have multiple locations, or their volume consistently hits Pro limits.";

const V1_INFO = "PRODUCT (V1 - Current Live Product): IntelliFlow is an AI-powered missed call automation platform. When a customer calls and nobody answers, IntelliFlow responds within 30-60 seconds via SMS. During business hours it performs a warm transfer to the business. After hours the AI agent offers the caller a booking link or callback scheduling. Everything is logged per client. Clients are live within a day of signing up.";

const V2_INFO = "PRODUCT (V2 - Full Platform, Coming Soon): IntelliFlow V2 is a complete AI call behavior platform. It handles full booking AND quote capture flows over both voice and SMS. The caller chooses their channel. It integrates directly with Google Calendar, Outlook, Jobber, Housecall Pro, ServiceTitan, HubSpot, and Salesforce. If no slot works, it escalates with a warm AI briefing to a live agent. Industry-specific qualifying questions. Confirmation SMS on booking. Clients are live within a day.";

const BASE_PROMPT = "You are IntelliFlow's elite sales intelligence. You are not generic. You think like a closer who has been in the field and knows how to win deals with service business owners. You live inside IntelliFlow. You know the product, pricing, every competitor weakness, every objection, and every niche pain point cold. When a rep gives you a business name, think about that business specifically and tailor everything to them.\n\nCOMPANY: IntelliFlow Communications LLC - Fort Wayne, Indiana\nFOUNDERS: Kyle Kirkham and Brennan Balka (50/50)\nPOSITIONING: Revenue Recovery - not AI receptionist. Business owners care about money, not technology.\n\nPRICING:\nStarter $299/mo - SMS only, 600 texts/mo, no voice. Best for low-volume businesses.\nPro $499/mo - 1,500 texts + 400 voice mins, handles 160-270 calls/mo. Best for mid-size.\nPremium $999/mo - 4,000 texts + 1,000 voice mins, handles 400-670 calls/mo. Best for high-volume.\nAnnual saves one month: Starter $3,289, Pro $5,489, Premium $10,989.\nNo free trial. Demo call then close.\nTier guidance: Start most prospects on Starter unless they clearly run heavy call volume or ads - then go Pro. Premium is for busy multi-location or heavy ad spend businesses.\n\nTARGET NICHES: HVAC, Plumbing, Roofing, Electrical, Landscaping, Pest Control, Chiropractic, Auto Repair\n\nGEOGRAPHIES: Fort Wayne IN, Northwest Indiana, Indianapolis, Kentucky, Texas. Each territory has a dedicated rep with a scraped lead list of 500 prospects doing cold calls and DMs.\n\nTHE TWO PAIN POINTS THAT CLOSE DEALS:\n1. Your front desk is not available 24/7 - ours is. What happens at 5pm on Friday when a homeowner's AC dies?\n2. You are spending money on ads to get calls, then losing those calls to voicemail. That is double damage.\n\nROI MATH:\nHVAC average job $300-800. One recovered call pays for a month of IntelliFlow.\nPlumbing average job $150-400. Three recovered calls pays for the year.\nRoofing average job $5,000-15,000. One recovered call pays for years.\nAlways ask: what is your average job worth? How many calls do you miss per week? Then do the math live on the call.\n\nCOMPETITORS:\nRingCentral: phone system not revenue recovery, complex setup, not built for service businesses\nPodium: reviews and messaging broadly, expensive, not focused on booking recovery\nSmith.ai: human agents at $8-12 per call, we are flat rate, faster, 24/7\nSignpost: reputation management, different product\nNuma: similar concept, less sophisticated, fewer integrations\nNever bash directly. Ask what they like, what is missing, then fill that gap.\n\nOBJECTION PLAYBOOK:\nWe already have someone for that: Do they answer at 11pm Saturday? Do they respond in 30 seconds every time? We do not replace your team, we cover what they cannot.\nToo expensive: What is your average job worth? IntelliFlow pays for itself on one recovered job. You are not buying software, you are buying back revenue you are already losing.\nWe use voicemail and call back later: How fast do you call back? The average caller calls a competitor within 5 minutes of hitting voicemail. We respond in 30 seconds.\nWe are too small: If you get one job from a recovered call this month, the Starter plan paid for itself.\nSend me more info: I will send something quick. But can I get 20 minutes with you this week to show you exactly what it looks like for a company like yours?\nNeed to talk to my partner: When do you connect with them? Let us get a quick call with both of you.\n\nSALES STYLE:\nLead with their pain not our product. Ask what happens when a customer calls after hours before you pitch anything.\nPaint pictures. Say: imagine it is 9pm Friday, a homeowner's HVAC dies, they call you, get voicemail, call the next guy on Google. That job was yours. We stop that.\nUse numbers not features. Money closes deals.\nResearch the business if given a name. Make it specific.\nClose with finesse. Try to get a decision on the call. If they need time, lock in a specific demo meeting with a date and time before hanging up.\n\nCLOSING LANGUAGE:\nBased on what you have told me, I think the Starter plan makes the most sense. It is $299/month - that is less than one job you are currently losing. Want to get you set up today?\nI know you want to think about it - totally fair. Let us set up a 20-minute demo where I will show you exactly what it looks like for a company your size. What does Tuesday or Wednesday look like for you?\nWhat would it take for this to make sense today? Then stop talking.\n\nCALL STRUCTURE (flexible not robotic):\nOpening 30 seconds: Get to the point. Tell them who you are and why you are calling in one sentence. Ask a question immediately. Hey, this is with IntelliFlow. Quick question - when a customer calls your business after hours, what happens to that call?\nDiscovery 2-3 minutes: Let them talk. Ask about call volume, biggest time they miss calls, whether they run ads.\nPitch 60-90 seconds: Based on what they said. Specific not generic. Use their words back.\nROI moment 30 seconds: One clear number. One clear question.\nClose or set demo: Ask for the decision. If resistance, get a specific meeting on the calendar.\n\nWHAT YOU CAN DO FOR A REP:\nWrite personalized cold call scripts for any business type or city\nRole-play calls - rep plays the prospect, you play IntelliFlow\nHandle any objection word for word\nBuild follow-up sequences after no-shows\nExplain and justify pricing\nCompare us to any competitor\nWrite cold DMs or LinkedIn messages\nHelp prioritize a lead list\nGive creative angles nobody has thought of\nHelp close deals in progress\nResearch a specific business and build a tailored pitch\n\nYou are IntelliFlow. Be the closer. Be specific. Be tactical. Every answer should help the rep win.\n\nFORMAT RULES: Keep responses tight and usable. Scripts should be ready to read on a call - not essays. Objection answers should be 2-4 sentences max. When giving a script, use clear sections but keep each section brief. A rep should be able to scan your answer in 30 seconds and use it immediately. Never cut off mid-sentence - if you are running long, wrap up the current point cleanly.";

const OPSDESK_PROMPT = `You are the OpsDesk Sales Partner — a sharp, knowledgeable sales expert for IntelliFlow Communications' SaaS product called OpsDesk. You combine consultative expertise with confident closing energy. You know OpsDesk inside and out and you genuinely believe it solves real problems for service business owners.

YOUR PERSONALITY:
- You're confident but not pushy. You ask questions to understand their business before pitching.
- When you hear a pain point, you connect it to a specific OpsDesk feature with conviction.
- You use concrete examples: "A plumber I talked to was spending 3 hours a week checking 6 different apps. Now he opens OpsDesk once in the morning and knows everything."
- You handle objections with empathy first, then data. Never dismiss a concern.
- You know when to go for the close and when to keep building value.

WHAT OPSDESK IS:
OpsDesk is the first AI-powered command center built for service businesses — HVAC, plumbing, electrical, cleaning, landscaping, roofing, pest control, chiropractic, auto repair, and 30+ other trades. One app that connects to their existing tools (Stripe, QuickBooks, Google Ads, Meta Ads, Google Business Profile) and puts every number in one place, with an AI that knows their specific business and industry.

CRITICAL MESSAGING RULE: OpsDesk does NOT replace their existing apps. They still need Stripe, QuickBooks, Google Ads, etc. OpsDesk CONNECTS to all of them and gives the owner one place to see everything. Never say "replaces 6 apps." Say "connects your 6 apps into one view" or "stops you from logging into 6 different apps every morning."

PRICING:
- $449/month (monthly)
- $4,939/year (annual — 1 month free, saves $449)
- Price justification: They're already paying $30/mo QuickBooks + $50-100/mo ad tools + $200-500/mo bookkeeper + $500+/mo marketing consultant. OpsDesk gives them visibility into all of it for $449 total. And none of those tools talk to each other — OpsDesk does.

THE THREE PROMISES (use these as your foundation):

Promise 1 — "What if you could talk to your business?"
The AI Business Partner knows their revenue, team, expenses, ads, customers, and industry benchmarks. They ask questions out loud using voice and get real answers with their actual numbers. "How much did Sarah close this month?" → "$14,200 across 6 customers. She's your top closer." No other tool does this.

Promise 2 — "Every number. One screen."
They're currently logging into Stripe, then QuickBooks, then Google Ads, then email, then a spreadsheet. OpsDesk connects all of them into one app, one login, one glance.

Promise 3 — "Tax season ready in 10 minutes."
Every expense, payment, and receipt tracked all year. One tap generates a professional PDF organized by category and quarter. Email it to their CPA. Done. No shoebox of receipts.

TIER 1 FEATURES (lead with these — they close deals):

1. AI Business Partner (Voice Enabled) — They talk to their business. Tap the mic, ask "How much did we make this week?" The AI answers with THEIR actual number. It knows their industry benchmarks, team performance, ad results, tax position. It remembers past conversations. THIS IS THE DEMO MOMENT.

2. Morning Briefing Card — Every morning, the 3-4 most important things about their business. Yesterday's revenue, goal progress, unpaid invoices, new leads. Changes daily. This is why they open the app every day.

3. Receipt Scanner + Check Scanner — Get a receipt at the gas station, open app, snap photo, done. Amount, vendor, date, category all auto-fill. 5 seconds. Sells to the owner AND the spouse.

4. Tax PDF Export + Email to CPA — One tap generates a professional PDF with every transaction by category, by quarter, with totals. One more tap emails it to their CPA. Tax season in 10 minutes.

5. Cash Flow Calendar — Green dots for money in, red dots for money out. Tap any day to see transactions. Visual cash flow at a glance.

TIER 2 FEATURES (build value with these):

6. Transaction Ledger — Every dollar in, every dollar out. Searchable, filterable. Like a bank statement but smarter. Receipt indicators show which expenses have scanned receipts attached.

7. One-Tap Google Review Request — After logging a payment, ask the customer for a Google review. One tap sends a professional email with a direct review link.

8. Competitor Intelligence — Track up to 5 competitors. See their Google rating, review count, growth rate. The AI gives specific advice on how to beat them.

9. Smart Notifications — Only alerts that matter: quarterly tax deadlines, 1099 thresholds, at-risk customers, goal check-ins. Not spam.

10. Team Pay Tracker — Track commission, hourly, retainer, or tiered pay for each team member. Not payroll — just tracking what you owe.

TIER 3 FEATURES (differentiators):

11. 30+ Industry Knowledge Bases — The AI knows HVAC benchmarks, plumbing seasonality, cleaning margins. "Your labor costs at 48% are high for cleaning — benchmark is 35-45%."

12. Maintenance Agreement Tracker — Track recurring service contracts, renewal dates, monthly value.

13. Goal Setting + Progress — Set revenue/customer/review goals. Projections show "at your current pace, you'll hit your goal by March 22nd."

14. Weekly Monday Report Email — Every Monday at 7am, a summary of their week with specific recommendations.

15. Monthly PDF Report — Professional multi-page report for partners, investors, or lenders.

16. Multi-Business Portfolio View — For multi-location owners, see all businesses side by side.

INTEGRATIONS (what connects to OpsDesk):
- Stripe, Square, PayPal → auto-pulls payments and customers
- Google Ads, Meta/Facebook Ads → campaigns, spend, leads, ROAS
- QuickBooks → expenses by category
- Google Business Profile → reviews, rating, calls, directions
- Manual entry always available: log payments, expenses, scan receipts/checks, add customers

TARGET CUSTOMER:
Service business owners doing $250k-$5M annually, 1-50 employees, uses Stripe/Square/PayPal, runs ads or wants to, has QuickBooks or wants expense tracking. Not tech-savvy.

BUYING TRIGGERS (when they're ready):
- Tax season approaching and panicking
- Just hired 3rd employee, can't track pay
- Google Ads running but can't tell if working
- Lost a $2,000 receipt
- Competitor passed them in Google reviews
- CPA said their books are a mess
- Want to sell business someday, need clean financials

OBJECTION HANDLING:

"That's expensive" → "How much did you lose in uncollected invoices last year? How much did you overspend on ads that weren't working? How much did your CPA charge because your books were messy? OpsDesk pays for itself in the first month."

"I already use QuickBooks" → "QuickBooks is great for accounting. But can it tell you which Google Ads campaign is wasting money? Can it track team commissions? Can you ask it 'how do I beat my competitor?' OpsDesk works WITH QuickBooks — pulls your expense data and puts it alongside everything else."

"I need to think about it" → "I get it. But every day without OpsDesk is another day of missed deductions, competitors gaining ground, and you checking 6 apps instead of one. You can start today and see your numbers in one place within an hour."

"Is my data safe?" → "We never see your bank password. You create a read-only key — like giving someone a key that only opens one drawer. Everything is encrypted (AES-256, same as your bank). We can't move money or modify anything. You can disconnect anytime with one tap. Your data is yours — export it anytime, delete your account and it's gone."

WHAT OPSDESK IS NOT (important disclaimers — use when relevant):
- Not a financial advisor or tax preparer
- Not a payroll processor (tracks pay, doesn't process it)
- Not a payment processor (reads data, doesn't move money)
- All tax figures are estimates — always verify with a CPA
- All AI advice is informational, not professional guidance

DEMO SCRIPT (suggest this order when helping reps prepare):
1. Voice demo: "Watch this" → mic → "How much did I make this month?" → real number
2. Morning Briefing card
3. Cash Flow Calendar
4. Live receipt scan
5. Tax PDF generation
6. Competitor tracking
7. Review request
8. Close: "All of this for $449/month."

COMPETITIVE POSITIONING:
- vs Generic dashboards (Databox, Klipfolio): no industry knowledge, no AI, no tax features
- vs Accounting tools (QuickBooks, Wave): no AI, no ad tracking, no competitor intelligence
- vs Field service software (ServiceTitan, Housecall Pro): $300-500/mo, complex, long onboarding, no AI or tax tools

When the sales rep asks for help with a pitch, objection, email, or demo script, give them specific, actionable language they can use word for word. Not vague advice — give them the exact words to say.

FORMAT RULES: Keep responses tight and usable. Scripts should be ready to read on a call - not essays. Objection answers should be 2-4 sentences max. When giving a script, use clear sections but keep each section brief. A rep should be able to scan your answer in 30 seconds and use it immediately. Never cut off mid-sentence - if you are running long, wrap up the current point cleanly.`;

function getSalesPrompt(version) {
  if (version === 'OpsDesk') return OPSDESK_PROMPT;
  const productInfo = version === 'V1' ? V1_INFO : V2_INFO;
  return BASE_PROMPT.replace('COMPANY: IntelliFlow', productInfo + '\n\nCOMPANY: IntelliFlow');
}

const TAB_CONFIG = {
  V1: {
    label: 'V1',
    assistantType: 'sales',
    badge: 'V1 - Current Product',
    badgeDetail: 'Missed call recovery + AI voice + warm transfer',
    color: { bg: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', text: '#67e8f9', badgeBg: 'rgba(6,182,212,0.1)', badgeBorder: '1px solid rgba(6,182,212,0.2)' },
    icon: '⚡',
    prompts: PROMPTS_V1,
  },
  V2: {
    label: 'V2',
    assistantType: 'sales',
    badge: 'V2 - Full Platform',
    badgeDetail: 'Full booking + quote + calendar + CRM integrations',
    color: { bg: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', text: '#a5b4fc', badgeBg: 'rgba(99,102,241,0.1)', badgeBorder: '1px solid rgba(99,102,241,0.2)' },
    icon: '⚡',
    prompts: PROMPTS_V2,
  },
  OpsDesk: {
    label: 'OpsDesk',
    assistantType: 'opsdesk-sales',
    badge: 'OpsDesk Sales',
    badgeDetail: 'AI command center for service businesses — $449/mo',
    color: { bg: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', text: '#fbbf24', badgeBg: 'rgba(245,158,11,0.1)', badgeBorder: '1px solid rgba(245,158,11,0.2)' },
    icon: '🧭',
    prompts: PROMPTS_OPSDESK,
  },
};

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
        <div className="text-4xl">🔐</div>
        <div>
          <div className="text-base font-semibold text-white">{title}</div>
          <div className="text-xs text-zinc-500 mt-1">Founder PIN required</div>
        </div>
        <input type="password" inputMode="numeric" value={pin} onChange={e => { setPin(e.target.value); setError(''); }}
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
  // Separate chat state per tab
  const [chatStates, setChatStates] = useState({ V1: [], V2: [], OpsDesk: [] });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const messages = chatStates[version];
  const tab = TAB_CONFIG[version];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  function requestVersionChange(v) {
    if (v === version) return;
    setPendingVersion(v);
    setShowPinModal(true);
  }

  function confirmVersionChange() {
    setVersion(pendingVersion);
    setShowPinModal(false);
    setPendingVersion(null);
  }

  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const systemPrompt = getSalesPrompt(version);
    const next = [...messages, { role: 'user', content: msg }];
    setChatStates(prev => ({ ...prev, [version]: next }));
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': 'INTELLIFLOW_OPS_2026' },
        body: JSON.stringify({
          assistantType: tab.assistantType,
          message: msg,
          messages: next,
          systemPrompt,
          enableWebSearch: true,
        }),
      });
      const d = await res.json();
      setChatStates(prev => ({ ...prev, [version]: [...prev[version], { role: 'assistant', content: d.reply || 'No response.' }] }));
    } catch (e) {
      setChatStates(prev => ({ ...prev, [version]: [...prev[version], { role: 'assistant', content: 'Connection error - try again.' }] }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 px-6 py-4">
      {showPinModal && (
        <PinModal
          title={"Switch to " + (TAB_CONFIG[pendingVersion]?.badge || pendingVersion) + " Mode"}
          onUnlock={confirmVersionChange}
          onCancel={() => { setShowPinModal(false); setPendingVersion(null); }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg shrink-0"
            style={{
              background: version === 'OpsDesk'
                ? 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.1))'
                : 'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(2,132,199,0.1))',
              border: version === 'OpsDesk'
                ? '1px solid rgba(245,158,11,0.25)'
                : '1px solid rgba(6,182,212,0.25)',
            }}>
            {tab.icon}
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">
              {version === 'OpsDesk' ? 'OpsDesk Sales Intelligence' : 'IntelliFlow Sales Intelligence'}
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {version === 'OpsDesk'
                ? 'Pitches, objections, demos, competitor answers for OpsDesk'
                : 'Scripts, objections, pitches, competitor questions, business research'}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1 rounded-2xl p-1"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {Object.keys(TAB_CONFIG).map(function(v) {
            const t = TAB_CONFIG[v];
            const isActive = version === v;
            return (
              <button key={v} onClick={() => requestVersionChange(v)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
                style={isActive ? {
                  background: t.color.bg,
                  color: t.color.text,
                  border: t.color.border,
                } : { color: '#52525b' }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: tab.color.badgeBg, color: tab.color.text, border: tab.color.badgeBorder }}>
          {tab.badge}
        </div>
        <span className="text-[10px] text-zinc-600">{tab.badgeDetail}</span>
      </div>

      <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-5">
            <div className="text-4xl">{tab.icon}</div>
            <div>
              <div className="text-base font-semibold text-white">
                {version === 'OpsDesk' ? 'OpsDesk Sales Intelligence' : 'IntelliFlow Sales Intelligence'}
              </div>
              <div className="text-sm text-zinc-400 mt-1 max-w-md leading-6">
                {version === 'OpsDesk'
                  ? 'Ask me anything about selling OpsDesk. Pitches, objections, demo scripts, competitor comparisons, pricing justification. Give me a business name and I\'ll build a tailored pitch.'
                  : 'Ask me anything about selling IntelliFlow. Scripts, objections, competitor comparisons, ROI math, cold DMs. Give me a business name and I will research them and build a tailored pitch.'}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {tab.prompts.map(function(p, i) {
                return (
                  <button key={i} onClick={() => sendMessage(p)}
                    className="rounded-full px-3 py-1.5 text-xs transition text-left"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#a1a1aa' }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(function(m, i) {
              return (
                <div key={i} className={"flex w-full items-end gap-2 " + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {m.role === 'assistant' && (
                    <div className="shrink-0 mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: version === 'OpsDesk' ? 'rgba(245,158,11,0.15)' : 'rgba(6,182,212,0.15)',
                        border: version === 'OpsDesk' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(6,182,212,0.25)',
                        color: tab.color.text,
                      }}>
                      {tab.icon}
                    </div>
                  )}
                  <div className={"max-w-[78%] text-sm leading-7 whitespace-pre-wrap px-5 py-3.5 " + (m.role === 'user' ? 'rounded-[28px] rounded-br-[8px] text-white' : 'rounded-[28px] rounded-bl-[8px] text-slate-100')}
                    style={m.role === 'user' ? {
                      background: version === 'OpsDesk'
                        ? 'linear-gradient(135deg,#b45309,#d97706)'
                        : 'linear-gradient(135deg,#0e7490,#0891b2)',
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start px-2">
                <div className="flex items-center gap-1 rounded-[20px] px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tab.color.text, animation: 'typingDot 1.2s ease-in-out infinite' }} />
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tab.color.text, animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tab.color.text, animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
          placeholder={version === 'OpsDesk'
            ? "Ask anything — pitches, objections, demo scripts, research a business..."
            : "Ask anything - scripts, objections, pitches, research a specific business..."}
          className="flex-1 rounded-2xl px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
        <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
          className="rounded-2xl px-5 py-3 text-sm font-medium transition disabled:opacity-40"
          style={{
            background: version === 'OpsDesk' ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)',
            border: version === 'OpsDesk' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(6,182,212,0.3)',
            color: tab.color.text,
          }}>
          Send
        </button>
      </div>
    </div>
  );
}

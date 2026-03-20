import { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const STANDARD_STARTERS = [
  'How should we allocate budget this month across Meta and Google?',
  'Where are we likely wasting money right now?',
  'What should founders focus on first to get to 25 paying clients faster?',
  'How do we make our marketers more effective without adding complexity?',
];

const NICHE_OPTIONS = [
  'HVAC',
  'Dentists',
  'Chiropractors',
  'Roofers',
  'Med Spas',
  'Lawn Care',
  'Vets',
  'Plumbing / Home Service',
  'Auto Repair',
  'Construction',
  'Pest Control',
];

const PLATFORM_OPTIONS = ['Meta', 'Google Search', 'Google Ads'];
const GOAL_OPTIONS = [
  'Get more booked jobs',
  'Reduce missed-call revenue loss',
  'Capture more after-hours leads',
  'Improve lead quality',
];
const TONE_OPTIONS = [
  'Pain-driven, calm, direct',
  'Calm, authority-led',
  'Direct and urgent',
];
const OUTPUT_OPTIONS = ['One best ad', '3 ad variants', 'Full campaign pack'];
const CREATIVE_OPTIONS = [
  'Static Canva ad',
  'Light animated Canva ad',
  'Static + animated recommendation',
];
const CTA_OPTIONS = [
  'Check if you’re losing customers right now',
  'Get more booked jobs today',
  'See what missed calls could be costing you',
  'Find out how much revenue leakage you may have',
];

const EMPTY_REAL_BUILDS = [];

function ModeButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-300/30'
          : 'bg-white/[0.04] text-zinc-400 border border-white/10 hover:bg-white/[0.07] hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <section className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="section-title mb-1">{title}</h2>
          {subtitle ? <p className="text-sm text-zinc-400 leading-6">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function Pill({ children, tone = 'default' }) {
  const toneMap = {
    default: 'bg-white/[0.05] text-zinc-300 border-white/10',
    strong: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20',
    info: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneMap[tone] || toneMap.default}`}
    >
      {children}
    </span>
  );
}

function Field({ label, children, note }) {
  return (
    <label className="block space-y-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      {children}
      {note ? <div className="text-xs text-zinc-500 leading-5">{note}</div> : null}
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-cyan-300/30"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-slate-900">
          {option}
        </option>
      ))}
    </select>
  );
}

function TextArea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-cyan-300/30 placeholder:text-zinc-500"
    />
  );
}

function ChatBubble({ role, text }) {
  const isAssistant = role === 'assistant';
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 border whitespace-pre-wrap ${
          isAssistant
            ? 'bg-white/[0.04] border-white/10 text-zinc-200'
            : 'bg-cyan-400/[0.08] border-cyan-300/20 text-cyan-100'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default function AdAssistantPage() {
  const { data, loading } = useSheetData();

  const [mode, setMode] = useState('standard');

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text:
        'Ask me about budget allocation, founder priorities, campaign efficiency, marketer performance, or where to move money next.',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [form, setForm] = useState({
    niche: 'HVAC',
    platform: 'Meta',
    goal: 'Get more booked jobs',
    tone: 'Pain-driven, calm, direct',
    creativeType: 'Static + animated recommendation',
    outputDepth: '3 ad variants',
    ctaStyle: 'Check if you’re losing customers right now',
    campaignName: '',
    landingPageGoal: 'ROI calculator + booked jobs angle',
    notes: '',
  });
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);

  const assistantContext = useMemo(() => {
    const dashboard = data?.DASHBOARD || null;
    const campaigns = Array.isArray(data?.CAMPAIGNS) ? data.CAMPAIGNS : [];
    const customers = Array.isArray(data?.CUSTOMERS) ? data.CUSTOMERS : [];
    const marketers = Array.isArray(data?.MARKETERS) ? data.MARKETERS : [];

    const trimmedCampaigns = campaigns.slice(0, 75).map((row) => ({
      'Campaign Name': row['Campaign Name'],
      Platform: row['Platform'],
      Spend: row['Spend'],
      Leads: row['Leads'],
      'Qualified Leads': row['Qualified Leads'],
      CTR: row['CTR'],
      CPC: row['CPC'],
      'Customers Won': row['Customers Won'],
      'Revenue Won': row['Revenue Won'],
      CPL: row['CPL'],
      CAC: row['CAC'],
      'Close Rate': row['Close Rate'],
      Status: row['Status'],
      Niche: row['Niche'],
      Offer: row['Offer'],
      'Managed By': row['Managed By'],
    }));

    return {
      dashboard,
      campaigns: trimmedCampaigns,
      customersCount: customers.length,
      marketersCount: marketers.length,
      assistantRules: {
        mainGoal: 'Get to 25 paying clients',
        noDemoLanguage: true,
        approvedCtas: CTA_OPTIONS,
      },
    };
  }, [data]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function callAssistant(message, extraContext = {}, history = []) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context: {
          ...assistantContext,
          ...extraContext,
        },
        history,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.error || 'Assistant request failed');
    }

    return result.reply;
  }

  async function handleFounderAsk() {
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const nextHistory = [...chatHistory, { role: 'user', text: trimmed }];
    setChatHistory(nextHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const historyForApi = nextHistory.map((item) => ({
        role: item.role,
        content: item.text,
      }));

      const reply = await callAssistant(
        `FOUNDER MODE QUESTION:
${trimmed}

Rules:
- Be practical and direct.
- Use dashboard and campaign data when available.
- If a specific campaign or ad is mentioned, look for an exact name match.
- If recommending budget changes, clearly say where to move money from and to.`,
        {
          mode: 'founder',
          reminder:
            'For campaign-specific recommendations, the user should enter the campaign or ad name exactly as it appears in campaign data.',
        },
        historyForApi
      );

      setChatHistory((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: `I hit an error: ${error.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleGenerateAd() {
    setGenerateLoading(true);

    try {
      const prompt = `
GENERATE AD FROM SCRATCH MODE

Use these exact inputs:
- Niche: ${form.niche}
- Platform: ${form.platform}
- Goal: ${form.goal}
- Tone: ${form.tone}
- Creative Type: ${form.creativeType}
- Output Depth: ${form.outputDepth}
- CTA Style: ${form.ctaStyle}
- Campaign Name Reference: ${form.campaignName || 'None provided'}
- Landing Page Angle: ${form.landingPageGoal}
- Extra Notes: ${form.notes || 'None'}

Requirements:
- Never use "book a demo".
- Keep it complete but not bloated.
- Return clear sections for:
1. Best Angle
2. Winning Hook
3. Primary Text
4. 3 Headlines
5. 3 CTA Options
6. Creative Recommendation
7. Where to Post
8. Landing Page Match
9. Why This Should Convert
10. 3 Variants

If a campaign name is provided, treat it as an exact-match reference if possible.
`;

      const reply = await callAssistant(prompt, {
        mode: 'generate_ad',
        requestedInputs: form,
      });

      setGeneratedOutput(reply);
    } catch (error) {
      setGeneratedOutput(`I hit an error: ${error.message}`);
    } finally {
      setGenerateLoading(false);
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <section className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_28%)] pointer-events-none" />
        <div className="relative z-[1] space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="section-title">Ad Assistant</div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Founder chat + ad generation
              </h1>
              <p className="text-sm text-zinc-400 leading-6">
                Founder mode is chat-first. Build mode is form-first. Fake filler sections are removed so the page is easier to use.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ModeButton active={mode === 'standard'} onClick={() => setMode('standard')}>
                Founder Assistant
              </ModeButton>
              <ModeButton active={mode === 'generate'} onClick={() => setMode('generate')}>
                Generate Ad From Scratch
              </ModeButton>
            </div>
          </div>
        </div>
      </section>

      {mode === 'standard' ? (
        <SectionCard
          title="Founder Assistant Chat"
          subtitle="Ask broad founder questions or campaign-specific budget questions."
          right={<Pill tone="info">{loading ? 'Loading data' : 'Chat Mode'}</Pill>}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
              <TextArea
                rows={4}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about budget allocation, where to move money, founder priorities, campaign efficiency, or making the business run better."
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-zinc-500 leading-5">
                  For campaign-specific recommendations, enter the campaign or ad name exactly as it appears in your campaign data.
                </div>
                <button
                  type="button"
                  onClick={handleFounderAsk}
                  disabled={chatLoading}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200 disabled:opacity-60"
                >
                  {chatLoading ? 'Thinking...' : 'Ask Assistant'}
                </button>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {STANDARD_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setChatInput(starter)}
                  className="text-left rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
                >
                  {starter}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d1426]/80 p-4 space-y-3 min-h-[360px]">
              {chatHistory.map((message, index) => (
                <ChatBubble
                  key={`${message.role}-${index}`}
                  role={message.role}
                  text={message.text}
                />
              ))}
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
          <div className="space-y-6">
            <SectionCard
              title="Generate Ad From Scratch"
              subtitle="Main inputs first. Optional notes second. Output appears on the right."
              right={<Pill tone="strong">Build Mode</Pill>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Niche">
                  <Select
                    value={form.niche}
                    onChange={(e) => updateForm('niche', e.target.value)}
                    options={NICHE_OPTIONS}
                  />
                </Field>

                <Field label="Platform">
                  <Select
                    value={form.platform}
                    onChange={(e) => updateForm('platform', e.target.value)}
                    options={PLATFORM_OPTIONS}
                  />
                </Field>

                <Field label="Goal">
                  <Select
                    value={form.goal}
                    onChange={(e) => updateForm('goal', e.target.value)}
                    options={GOAL_OPTIONS}
                  />
                </Field>

                <Field label="Tone">
                  <Select
                    value={form.tone}
                    onChange={(e) => updateForm('tone', e.target.value)}
                    options={TONE_OPTIONS}
                  />
                </Field>

                <Field label="Creative Type">
                  <Select
                    value={form.creativeType}
                    onChange={(e) => updateForm('creativeType', e.target.value)}
                    options={CREATIVE_OPTIONS}
                  />
                </Field>

                <Field label="Output Depth">
                  <Select
                    value={form.outputDepth}
                    onChange={(e) => updateForm('outputDepth', e.target.value)}
                    options={OUTPUT_OPTIONS}
                  />
                </Field>

                <Field label="CTA Style">
                  <Select
                    value={form.ctaStyle}
                    onChange={(e) => updateForm('ctaStyle', e.target.value)}
                    options={CTA_OPTIONS}
                  />
                </Field>

                <Field
                  label="Campaign / Ad Name Reference"
                  note="Only enter this if you want the assistant to use one exact campaign or ad as context."
                >
                  <TextArea
                    rows={3}
                    value={form.campaignName}
                    onChange={(e) => updateForm('campaignName', e.target.value)}
                    placeholder="Exact campaign/ad name if relevant"
                  />
                </Field>
              </div>

              <Field label="Landing Page Angle">
                <TextArea
                  rows={3}
                  value={form.landingPageGoal}
                  onChange={(e) => updateForm('landingPageGoal', e.target.value)}
                  placeholder="Ex: ROI calculator focused on missed-call revenue leakage and booked jobs recovered"
                />
              </Field>

              <Field label="Notes for the Bot (optional)">
                <TextArea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  placeholder="Anything extra the bot should know for this build."
                />
              </Field>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.03] p-4">
                <div className="text-sm text-zinc-300 leading-6">
                  Only real generated builds should live in memory. Fake sample chats are removed.
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAd}
                  disabled={generateLoading}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200 disabled:opacity-60"
                >
                  {generateLoading ? 'Generating...' : 'Generate Ad'}
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Generated Output"
              subtitle="Claude-backed response appears here."
            >
              {generatedOutput ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200 leading-6 whitespace-pre-wrap min-h-[320px]">
                  {generatedOutput}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500 leading-6 min-h-[320px]">
                  Generate an ad to see the output here.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Build Memory"
              subtitle="This should only contain real saved builds later. Sample filler is removed."
            >
              {EMPTY_REAL_BUILDS.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500 leading-6">
                  No real saved builds yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {EMPTY_REAL_BUILDS.map((build) => (
                    <button
                      key={build.id}
                      type="button"
                      onClick={() => setGeneratedOutput(build.output)}
                      className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                    >
                      <div className="text-sm font-semibold text-white mb-2">{build.title}</div>
                      <div className="text-xs text-zinc-500">
                        {build.platform} • {build.niche} • {build.date}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

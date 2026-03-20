import { useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData.jsx';

const SOURCE_OF_TRUTH_PREVIEW = {
  companyFocus:
    'IntelliFlow helps high-call-volume local service businesses capture more booked jobs by answering calls 24/7 with an AI receptionist and reducing missed-call revenue loss.',
  primaryGoals: [
    'Increase paying clients',
    'Improve lead-to-booked-job conversion',
    'Protect CAC and margin before scaling spend',
    'Keep messaging niche-specific and outcome-driven',
  ],
  toneRules: [
    'Pain-driven but calm and direct',
    'Specific, not broad or corporate',
    'No fluff, no fake certainty',
    'Outcome first, AI second',
  ],
  bannedPhrases: [
    'Book a demo',
    'Revolutionize your business',
    'Guaranteed results',
    'Instant growth',
    'Game changer',
    'Cutting-edge solution',
    'Generic "grow your business" wording',
  ],
  approvedCTAStyle: [
    'Check if you’re losing customers right now',
    'Get more booked jobs today',
    'See what missed calls could be costing you',
    'Find out how much revenue leakage you may have',
  ],
};

const STANDARD_STARTERS = [
  'How should we allocate budget this month across Meta and Google?',
  'What should founders focus on first to get to 25 paying clients faster?',
  'Where are we likely wasting money right now?',
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

const PAST_BUILDS = [
  {
    id: 'build-001',
    title: 'HVAC Meta After-Hours Lead Recovery',
    niche: 'HVAC',
    platform: 'Meta',
    hook: 'When the office stops answering, missed calls keep costing you booked jobs.',
    cta: 'Check if you’re losing customers right now',
    format: 'Static + light Canva motion',
    status: 'Strong',
    date: 'Today',
  },
  {
    id: 'build-002',
    title: 'Dentist Search Ad New Patient Calls',
    niche: 'Dentists',
    platform: 'Google Search',
    hook: 'Missed new-patient calls do not come back later.',
    cta: 'Get more booked jobs today',
    format: 'Search headlines + descriptions',
    status: 'Testing',
    date: 'Yesterday',
  },
  {
    id: 'build-003',
    title: 'Plumbing Emergency Call Capture',
    niche: 'Plumbing / Home Service',
    platform: 'Meta',
    hook: 'Every unanswered emergency call is revenue going somewhere else.',
    cta: 'See what missed calls could be costing you',
    format: 'Animated Canva ad',
    status: 'Draft',
    date: 'This week',
  },
];

const WORKING_NOW = [
  {
    title: 'Outcome-led positioning',
    text: 'Ads are stronger when they lead with booked jobs, missed-call revenue loss, or after-hours lead capture instead of talking about AI first.',
  },
  {
    title: 'Niche-specific pain beats generic automation language',
    text: 'HVAC, dentists, roofers, plumbing, and med spas respond better when the ad reflects how lost calls hurt that exact niche.',
  },
  {
    title: 'Calm direct CTAs outperform hype',
    text: 'CTAs tied to checking loss, booked jobs, or ROI calculator intent build more trust than generic sales language.',
  },
];

const TEST_NEXT = [
  {
    title: 'Compare static vs light motion',
    text: 'Use the same hook and offer, then test static creative against simple Canva animation to see which gets stronger click quality.',
  },
  {
    title: 'Test pain-first vs efficiency-first hooks',
    text: 'Run one angle around missed revenue and one around getting more booked jobs without more ad spend.',
  },
  {
    title: 'Tighten landing-page match',
    text: 'Match each ad angle to the exact landing page promise so the click feels consistent and conversion friction drops.',
  },
];

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
    testing: 'bg-amber-500/10 text-amber-200 border-amber-400/20',
    draft: 'bg-zinc-500/10 text-zinc-300 border-zinc-400/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneMap[tone] || toneMap.default}`}
    >
      {children}
    </span>
  );
}

function BuildStatusPill({ status }) {
  const tone =
    status === 'Strong' ? 'strong' : status === 'Testing' ? 'testing' : 'draft';

  return <Pill tone={tone}>{status}</Pill>;
}

function LabeledValue({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-2">{label}</div>
      <div className="text-sm text-zinc-200 leading-6 whitespace-pre-wrap">{value}</div>
    </div>
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
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 border ${
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
  const [selectedBuildId, setSelectedBuildId] = useState(PAST_BUILDS[0].id);

  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      role: 'assistant',
      text: 'Ask me anything about budget allocation, scaling to more paying clients, improving marketer efficiency, offer positioning, or founder priorities.',
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
    landingPageGoal: 'ROI calculator + booked jobs angle',
    campaignName: '',
    notes: '',
  });
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);

  const selectedBuild = useMemo(
    () => PAST_BUILDS.find((build) => build.id === selectedBuildId) || PAST_BUILDS[0],
    [selectedBuildId]
  );

  const assistantContext = useMemo(() => {
    const dashboard = data?.DASHBOARD || null;
    const campaigns = Array.isArray(data?.CAMPAIGNS) ? data.CAMPAIGNS : [];
    const customers = Array.isArray(data?.CUSTOMERS) ? data.CUSTOMERS : [];
    const marketers = Array.isArray(data?.MARKETERS) ? data.MARKETERS : [];

    const trimmedCampaigns = campaigns.slice(0, 50).map((row) => ({
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
      sourceOfTruth: SOURCE_OF_TRUTH_PREVIEW,
      dashboard,
      campaigns: trimmedCampaigns,
      customersCount: customers.length,
      marketersCount: marketers.length,
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

Important:
- Use sheet-backed budget, campaign, and dashboard data when available.
- If user asks about a specific campaign or ad, check for an exact campaign/ad name match.
- If campaign-specific budget guidance is requested, be explicit about where to move money.
- Keep it conversational but practical.`,
        {
          mode: 'founder',
          note:
            'For campaign-specific recommendations, the user should enter the ad or campaign name exactly as it appears in campaign data.',
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
- Landing Page Angle: ${form.landingPageGoal}
- Campaign Name Reference: ${form.campaignName || 'None provided'}
- Extra Notes: ${form.notes || 'None'}

Requirements:
- Never use "book a demo".
- Keep the response concise but complete.
- Return structured sections for:
  1. Best Angle
  2. Winning Hook
  3. Primary Text
  4. 3 Headlines
  5. 3 CTA Options
  6. Creative Type
  7. Animated or Static
  8. Where to Post
  9. Landing Page Match
  10. Why This Should Convert
  11. 3 Variants

If a campaign name is provided, treat it as an exact-match reference against campaign data if possible.
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
                Founder chat mode + structured generate-ad mode in one page
              </h1>
              <p className="text-sm text-zinc-400 leading-6">
                Founder mode stays conversational. Generate mode uses toggles first, then optional notes,
                then sends the request through the real assistant API.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ModeButton active={mode === 'standard'} onClick={() => setMode('standard')}>
                Standard Assistant
              </ModeButton>
              <ModeButton active={mode === 'generate'} onClick={() => setMode('generate')}>
                Generate Ad From Scratch
              </ModeButton>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                Standard Mode
              </div>
              <div className="text-sm text-zinc-300 leading-6">
                Founder-focused chat for budget allocation, scaling decisions, execution priorities,
                and business effectiveness.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                Generate Mode
              </div>
              <div className="text-sm text-zinc-300 leading-6">
                Toggled inputs first. Optional notes second. Real API call after that.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                Data Access
              </div>
              <div className="text-sm text-zinc-300 leading-6">
                Uses loaded dashboard and campaign data. Campaign-specific questions should use the exact ad or campaign name.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="space-y-6">
          {mode === 'standard' ? (
            <SectionCard
              title="Founder Assistant Chat"
              subtitle="Textbox first. Helper text and starter questions underneath. This should work like a real founder/operator chatbot."
              right={<Pill>{loading ? 'Loading data' : 'Chat Mode'}</Pill>}
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <TextArea
                    rows={4}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about budget allocation, where to move money, founder priorities, campaign efficiency, or how to operate more effectively."
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-zinc-500 leading-5">
                      For campaign-specific budget recommendations, enter the ad or campaign name exactly as it appears in your campaign data.
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

                <div className="text-xs text-zinc-500">
                  This mode should answer broad founder questions and campaign-specific budget questions by reading your loaded sheet data plus your assistant rules.
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

                <div className="rounded-2xl border border-white/10 bg-[#0d1426]/80 p-4 space-y-3 min-h-[320px]">
                  {chatHistory.map((message, index) => (
                    <ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.text} />
                  ))}
                </div>
              </div>
            </SectionCard>
          ) : (
            <>
              <SectionCard
                title="Generate Ad From Scratch"
                subtitle="Main input should be toggles first. Notes stay optional and only tell the bot anything extra."
                right={<Pill tone="strong">Build Mode On</Pill>}
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
                    note="Enter the campaign or ad name exactly as it appears if you want the assistant to use that specific campaign as context."
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
                    This mode should use the assistant API plus loaded sheet context, not random front-end-only generation.
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

              <SectionCard
                title="Generated Output"
                subtitle="This should now be coming from the assistant API, not local placeholder logic."
              >
                {generatedOutput ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200 leading-6 whitespace-pre-wrap">
                    {generatedOutput}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500 leading-6">
                    Generate an ad to see the Claude-backed output here.
                  </div>
                )}
              </SectionCard>
            </>
          )}

          <SectionCard
            title="What’s Working"
            subtitle="Keep this focused on clear patterns your team should lean into now."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {WORKING_NOW.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                >
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-zinc-400 leading-6">{item.text}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="What to Test Next"
            subtitle="This replaces hook and CTA clutter with clearer testing priorities."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {TEST_NEXT.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                >
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-zinc-400 leading-6">{item.text}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Source of Truth Preview"
            subtitle="Starter structure only. Tomorrow we can deepen this into the actual editable policy and generation framework."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  Company Focus
                </div>
                <div className="text-sm text-zinc-200 leading-6">
                  {SOURCE_OF_TRUTH_PREVIEW.companyFocus}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Primary Goals</div>
                  <ul className="space-y-2 text-sm text-zinc-400 leading-6">
                    {SOURCE_OF_TRUTH_PREVIEW.primaryGoals.map((goal) => (
                      <li key={goal}>{goal}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Tone Rules</div>
                  <ul className="space-y-2 text-sm text-zinc-400 leading-6">
                    {SOURCE_OF_TRUTH_PREVIEW.toneRules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Banned Phrases</div>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OF_TRUTH_PREVIEW.bannedPhrases.map((phrase) => (
                      <Pill key={phrase} tone="draft">
                        {phrase}
                      </Pill>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <div className="text-sm font-semibold text-white">Approved CTA Style</div>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_OF_TRUTH_PREVIEW.approvedCTAStyle.map((cta) => (
                      <Pill key={cta} tone="strong">
                        {cta}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Past Builds"
            subtitle="This is the memory layer. Marketers can go back, review past builds, and reuse strong directions later."
          >
            <div className="space-y-3">
              {PAST_BUILDS.map((build) => (
                <button
                  key={build.id}
                  type="button"
                  onClick={() => setSelectedBuildId(build.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition ${
                    selectedBuildId === build.id
                      ? 'border-cyan-300/30 bg-cyan-400/[0.05]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="text-sm font-semibold text-white">{build.title}</div>
                    <BuildStatusPill status={build.status} />
                  </div>
                  <div className="text-xs text-zinc-500 mb-2">
                    {build.platform} • {build.niche} • {build.date}
                  </div>
                  <div className="text-sm text-zinc-400 leading-6">{build.hook}</div>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Selected Build"
            subtitle="Reusable summary of the past build currently selected."
          >
            <div className="space-y-3">
              <LabeledValue label="Title" value={selectedBuild.title} />
              <LabeledValue label="Platform" value={selectedBuild.platform} />
              <LabeledValue label="Niche" value={selectedBuild.niche} />
              <LabeledValue label="Hook" value={selectedBuild.hook} />
              <LabeledValue label="CTA" value={selectedBuild.cta} />
              <LabeledValue label="Format" value={selectedBuild.format} />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

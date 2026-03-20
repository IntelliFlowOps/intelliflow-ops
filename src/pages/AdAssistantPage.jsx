import { useMemo, useState } from 'react';

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
    'Generic “grow your business” wording',
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

const STANDARD_CHAT = [
  {
    role: 'assistant',
    text: 'Ask me anything about budget allocation, scaling to more paying clients, improving marketer efficiency, offer positioning, or how founders should prioritize execution.',
  },
  {
    role: 'user',
    text: 'What should founders focus on first if we want to grow faster without adding unnecessary complexity?',
  },
  {
    role: 'assistant',
    text: 'First, tighten the path from lead to booked job before adding more spend. If lead quality, close rate, or landing-page match is weak, more budget only scales waste. Focus on the highest-converting niche, strongest offer, and the simplest follow-up path first.',
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
      <div className="text-sm text-zinc-200 leading-6">{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</div>
      {children}
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

function buildMetaOutput(form) {
  const nichePainMap = {
    HVAC: 'after-hours service calls and missed urgent jobs',
    Dentists: 'missed new-patient calls and front-desk overload',
    Chiropractors: 'lost appointment calls and inconsistent intake follow-up',
    Roofers: 'storm-driven urgency and quote requests going unanswered',
    'Med Spas': 'lead response delays and lost consultation bookings',
    'Lawn Care': 'quote requests slipping through and slow follow-up',
    Vets: 'missed new-client and appointment calls',
    'Plumbing / Home Service': 'emergency calls going to the next company that answers',
    'Auto Repair': 'lost repair inquiries and unfilled bays',
    Construction: 'missed estimate calls and project inquiries',
    'Pest Control': 'urgent service calls and unbooked inspections',
  };

  const nichePain = nichePainMap[form.niche] || 'missed calls turning into lost booked jobs';
  const approvedCta = form.ctaStyle;
  const angle = `${form.niche} businesses lose booked jobs when ${nichePain}. The ad should frame missed calls as lost revenue, then position IntelliFlow as the cleaner way to capture demand without adding more payroll pressure.`;

  const hook = `The ${form.niche.toLowerCase()} leads you miss do not wait around. They book with whoever answers first.`;

  const primaryText = `${form.niche} businesses are already paying to make the phone ring. The problem is what happens when nobody answers. IntelliFlow helps you cover calls 24/7, reduce missed opportunities, and turn more existing demand into booked jobs without forcing more ad spend first.`;

  const headlines = [
    `How many ${form.niche.toLowerCase()} leads are slipping through?`,
    'Missed calls are costing more than you think',
    'Get more booked jobs without more ad spend',
  ];

  const variants =
    form.outputDepth === 'One best ad'
      ? [
          {
            name: 'Primary Version',
            summary: `${hook} Lead with lost booked jobs and a calm CTA.`,
          },
        ]
      : [
          {
            name: 'Pain-first',
            summary: `${hook} Strongest for urgency and lost-revenue framing.`,
          },
          {
            name: 'Booked-jobs-first',
            summary:
              'Lead with more booked jobs without more ad spend for a cleaner founder-friendly angle.',
          },
          {
            name: 'After-hours-first',
            summary:
              'Focus on calls missed after the office stops answering and the revenue that leaks out.',
          },
        ];

  return {
    platformLabel: 'Meta Ad Build',
    angle,
    hook,
    primaryText,
    headlines,
    ctas: [approvedCta, CTA_OPTIONS[1], CTA_OPTIONS[2]],
    creativeType:
      form.creativeType === 'Static + animated recommendation'
        ? 'Start with a static Canva version, then test a light animated version using the same hook and landing-page promise.'
        : form.creativeType,
    animated:
      form.creativeType === 'Light animated Canva ad'
        ? 'Yes — keep motion simple and tied to missed-call / booked-job contrast.'
        : 'Static first unless motion clearly strengthens the pain point.',
    placement: 'Facebook Feed, Instagram Feed, Stories/Reels variation',
    landingPage: `Landing page should match the ${form.goal.toLowerCase()} promise and connect clearly to the ROI calculator.`,
    whyItWorks:
      'It stays niche-specific, outcome-led, and calm. It avoids fluffy AI language, ties the pain to lost booked jobs, and gives a measurable next step.',
    variants,
  };
}

function buildSearchOutput(form) {
  const keywordAngle = `${form.niche} answering service, missed calls, after-hours response, more booked jobs`;
  const headlines = [
    `${form.niche} Calls Answered 24/7`,
    'Stop Losing Booked Jobs',
    'Capture More Calls After Hours',
    'Missed Calls Cost You Revenue',
    'Get More Booked Jobs Today',
    `Better ${form.niche} Lead Response`,
    'See What Missed Calls Cost',
    'Reduce Missed Lead Leakage',
    'Cover Calls Without More Payroll',
    'Check Your Revenue Leakage',
  ];

  const descriptions = [
    `Stop losing ${form.niche.toLowerCase()} leads when nobody answers. Capture more booked jobs with 24/7 AI receptionist coverage.`,
    'See how much missed calls could be costing you and send traffic to a tighter ROI calculator landing page.',
    'Improve response coverage, reduce lead leakage, and protect CAC before scaling spend.',
    'Built for service businesses that need better lead capture without generic sales fluff.',
  ];

  const variants =
    form.outputDepth === 'One best ad'
      ? [{ name: 'Primary Search Angle', summary: 'Missed-call revenue leakage and booked jobs.' }]
      : [
          { name: 'Missed-call leakage', summary: 'Revenue loss from unanswered calls.' },
          { name: 'Booked-jobs angle', summary: 'More booked jobs without more ad spend.' },
          { name: 'After-hours coverage', summary: 'Lead capture after the office stops answering.' },
        ];

  return {
    platformLabel: 'Google Search Build',
    angle:
      'Search copy should match high-intent users already looking for a better answer rate, missed-call coverage, or a way to stop losing booked jobs.',
    hook:
      'The problem is not always lead volume. It is what happens when high-intent calls go unanswered.',
    primaryText:
      'Google Search output should stay tight, high-intent, and directly aligned to the landing page promise.',
    headlines,
    descriptions,
    ctas: [form.ctaStyle, CTA_OPTIONS[2], CTA_OPTIONS[3]],
    creativeType: 'Search headlines + descriptions + landing-page match',
    animated: 'Not applicable for search',
    placement: 'Google Search',
    landingPage: `Use a landing page headline that mirrors ${form.goal.toLowerCase()} and reinforces the ROI calculator.`,
    whyItWorks:
      'It matches high intent, stays outcome-focused, and avoids wasting clicks on vague automation language.',
    keywordAngle,
    variants,
  };
}

export default function AdAssistantPage() {
  const [mode, setMode] = useState('standard');
  const [selectedBuildId, setSelectedBuildId] = useState(PAST_BUILDS[0].id);
  const [chatInput, setChatInput] = useState('');
  const [form, setForm] = useState({
    niche: 'HVAC',
    platform: 'Meta',
    goal: 'Get more booked jobs',
    tone: 'Pain-driven, calm, direct',
    creativeType: 'Static + animated recommendation',
    outputDepth: '3 ad variants',
    ctaStyle: 'Check if you’re losing customers right now',
    landingPageGoal: 'ROI calculator + booked jobs angle',
    notes: '',
  });

  const selectedBuild = useMemo(
    () => PAST_BUILDS.find((build) => build.id === selectedBuildId) || PAST_BUILDS[0],
    [selectedBuildId]
  );

  const generatedOutput = useMemo(() => {
    if (form.platform === 'Meta') return buildMetaOutput(form);
    return buildSearchOutput(form);
  }, [form]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
                Standard mode stays conversational for founders. Generate Ad From Scratch mode uses
                toggles first, then optional notes, then a structured ad output marketers can work from.
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
                and making the business more effective.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                Generate Mode
              </div>
              <div className="text-sm text-zinc-300 leading-6">
                Toggle-driven ad builder for marketers. Notes stay optional and only add extra context.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                Memory
              </div>
              <div className="text-sm text-zinc-300 leading-6">
                Past builds stay visible so your team can review old directions without rerunning the assistant.
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
              subtitle="This should feel like a real chatbot again. Ask about budget allocation, founder priorities, marketer effectiveness, offer direction, or internal execution."
              right={<Pill>Chat Mode</Pill>}
            >
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-[#0d1426]/80 p-4 space-y-3 min-h-[360px]">
                  {STANDARD_CHAT.map((message, index) => (
                    <ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.text} />
                  ))}
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

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                  <TextArea
                    rows={4}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the assistant anything about budget allocation, where to focus, what to improve, or how founders should operate more effectively."
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-zinc-500">
                      Keep this conversational. The real bot can answer broad founder and operator questions here.
                    </div>
                    <button
                      type="button"
                      className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200"
                    >
                      Ask Assistant
                    </button>
                  </div>
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

                  <Field label="Landing Page Angle">
                    <TextArea
                      rows={3}
                      value={form.landingPageGoal}
                      onChange={(e) => updateForm('landingPageGoal', e.target.value)}
                      placeholder="Ex: ROI calculator focused on missed-call revenue leakage and booked jobs recovered"
                    />
                  </Field>
                </div>

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
                    Tomorrow we can connect these controls to the deeper source-of-truth. The layout is now set up the right way.
                  </div>
                  <button
                    type="button"
                    className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200"
                  >
                    Generate Ad
                  </button>
                </div>
              </SectionCard>

              <SectionCard
                title={generatedOutput.platformLabel}
                subtitle="Structured output marketers can copy, adapt, and build from."
              >
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledValue label="Best Angle" value={generatedOutput.angle} />
                    <LabeledValue label="Winning Hook" value={generatedOutput.hook} />
                  </div>

                  <LabeledValue label="Primary Text" value={generatedOutput.primaryText} />

                  <div className="grid gap-3 md:grid-cols-3">
                    {generatedOutput.headlines.slice(0, 3).map((headline) => (
                      <LabeledValue key={headline} label="Headline" value={headline} />
                    ))}
                  </div>

                  {generatedOutput.descriptions ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {generatedOutput.descriptions.map((description) => (
                        <LabeledValue
                          key={description}
                          label="Description"
                          value={description}
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="grid gap-3 md:grid-cols-3">
                    {generatedOutput.ctas.map((cta) => (
                      <LabeledValue key={cta} label="CTA" value={cta} />
                    ))}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledValue label="Creative Type" value={generatedOutput.creativeType} />
                    <LabeledValue label="Animated or Static" value={generatedOutput.animated} />
                    <LabeledValue label="Where to Post" value={generatedOutput.placement} />
                    <LabeledValue label="Landing Page Match" value={generatedOutput.landingPage} />
                  </div>

                  {generatedOutput.keywordAngle ? (
                    <LabeledValue
                      label="Keyword / Intent Angle"
                      value={generatedOutput.keywordAngle}
                    />
                  ) : null}

                  <LabeledValue
                    label="Why This Should Convert"
                    value={generatedOutput.whyItWorks}
                  />

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <div className="text-sm font-semibold text-white">Variants</div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {generatedOutput.variants.map((variant) => (
                        <div
                          key={variant.name}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                        >
                          <div className="text-sm font-semibold text-white mb-2">{variant.name}</div>
                          <div className="text-xs text-zinc-400 leading-6">{variant.summary}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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

import { useEffect, useMemo, useState } from 'react';
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
const BUILD_MEMORY_KEY = 'intelliflow_ad_builder_memory_v1';

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
    info: 'bg-cyan-500/10 text-cyan-200 border-cyan-400/20',
    strong: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20',
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

function formatTimestamp(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
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

  const [builderForm, setBuilderForm] = useState({
    niche: 'HVAC',
    platform: 'Meta',
    notes: '',
  });
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderOutput, setBuilderOutput] = useState('');
  const [buildMemory, setBuildMemory] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BUILD_MEMORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setBuildMemory(parsed);
        }
      }
    } catch {
      setBuildMemory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(BUILD_MEMORY_KEY, JSON.stringify(buildMemory));
    } catch {
      // ignore storage errors
    }
  }, [buildMemory]);

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
      },
    };
  }, [data]);

  const updateBuilderForm = (key, value) => {
    setBuilderForm((prev) => ({ ...prev, [key]: value }));
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

  async function handleBuildPlan() {
    setBuilderLoading(true);

    try {
      const prompt = `
AD BUILD PLANNER MODE

The marketer is NOT asking you to write the final ad.
They are asking you to map out how to build it from scratch in Canva.

Inputs:
- Platform: ${builderForm.platform}
- Niche: ${builderForm.niche}
- Extra Notes: ${builderForm.notes || 'None'}

Your job:
- Tell the marketer what to make, step by step.
- Do NOT write a finished ad for them.
- Recommend the best angle, best CTA direction, best creative direction, and what copy elements to include.
- Tell them what style to build in Canva.
- Tell them whether to use static or light animation.
- Tell them what headline direction to test.
- Tell them what hook direction to test.
- Tell them what landing-page message the ad should match.
- Keep it structured and easy to follow.
- Never suggest "book a demo".

Return sections in this exact style:
1. Best angle to use
2. Best hook direction
3. Best CTA direction
4. Best creative direction
5. Static or animated
6. Canva build steps
7. Copy elements to include
8. Landing page match
9. What to test first
10. Mistakes to avoid

This is a build plan, not a finished ad.
`;

      const reply = await callAssistant(prompt, {
        mode: 'build_plan',
        requestedInputs: builderForm,
      });

      setBuilderOutput(reply);

      const memoryEntry = {
        id: `build-${Date.now()}`,
        niche: builderForm.niche,
        platform: builderForm.platform,
        notes: builderForm.notes,
        output: reply,
        createdAt: new Date().toISOString(),
      };

      setBuildMemory((prev) => [memoryEntry, ...prev]);
    } catch (error) {
      setBuilderOutput(`I hit an error: ${error.message}`);
    } finally {
      setBuilderLoading(false);
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
                Founder chat + ad build planner
              </h1>
              <p className="text-sm text-zinc-400 leading-6">
                Founder mode is chat-first. Build mode gives your marketer a step-by-step creation plan instead of writing the ad for them.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ModeButton active={mode === 'standard'} onClick={() => setMode('standard')}>
                Founder Assistant
              </ModeButton>
              <ModeButton active={mode === 'generate'} onClick={() => setMode('generate')}>
                Ad Build Planner
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <div className="space-y-6">
            <SectionCard
              title="Ad Build Planner"
              subtitle="Only choose where you want to post and the niche. Then add any extra notes in the message box."
              right={<Pill tone="strong">Build Mode</Pill>}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Platform">
                  <Select
                    value={builderForm.platform}
                    onChange={(e) => updateBuilderForm('platform', e.target.value)}
                    options={PLATFORM_OPTIONS}
                  />
                </Field>

                <Field label="Niche">
                  <Select
                    value={builderForm.niche}
                    onChange={(e) => updateBuilderForm('niche', e.target.value)}
                    options={NICHE_OPTIONS}
                  />
                </Field>
              </div>

              <Field label="Notes for the planner">
                <TextArea
                  rows={6}
                  value={builderForm.notes}
                  onChange={(e) => updateBuilderForm('notes', e.target.value)}
                  placeholder="Add anything extra here like angle ideas, a service to push harder, a special offer, or a campaign/ad name exactly as it appears if you want to reference one."
                />
              </Field>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.03] p-4">
                <div className="text-sm text-zinc-300 leading-6">
                  This creates a step-by-step Canva build plan. It should not write the full ad for the marketer.
                </div>
                <button
                  type="button"
                  onClick={handleBuildPlan}
                  disabled={builderLoading}
                  className="rounded-xl border border-cyan-300/30 bg-cyan-400/15 px-4 py-2 text-sm font-medium text-cyan-200 disabled:opacity-60"
                >
                  {builderLoading ? 'Planning...' : 'Create Build Plan'}
                </button>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Build Plan Output"
              subtitle="The planner response appears here."
            >
              {builderOutput ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-200 leading-6 whitespace-pre-wrap min-h-[320px]">
                  {builderOutput}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500 leading-6 min-h-[320px]">
                  Create a build plan to see the output here.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Build Memory"
              subtitle="Only real build plans created from now on appear here."
            >
              {buildMemory.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500 leading-6">
                  No real build plans yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {buildMemory.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setBuilderOutput(entry.output)}
                      className="w-full text-left rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="text-sm font-semibold text-white">
                          {entry.niche} • {entry.platform}
                        </div>
                        <Pill>{formatTimestamp(entry.createdAt)}</Pill>
                      </div>
                      <div className="text-xs text-zinc-500 leading-5">
                        {entry.notes ? entry.notes.slice(0, 120) : 'No extra notes'}
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

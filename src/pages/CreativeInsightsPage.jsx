import { useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useToast } from '../components/Toast.jsx';

const PLATFORMS = ['Meta', 'Google Ads', 'Google Search', 'TikTok', 'YouTube', 'Other'];
const NICHES = ['HVAC', 'Plumbing', 'Roofing', 'Electrical', 'Landscaping', 'Pest Control', 'Cleaning', 'Auto Repair', 'Dental', 'Chiropractic', 'Other'];
const CREATIVE_TYPES = ['Video', 'Image', 'Carousel', 'Story', 'Reel', 'Text Ad', 'Other'];

const HOOK_SUGGESTIONS = [
  'Missed calls = missed money',
  'Stop losing customers to voicemail',
  'Your competitor answers 24/7 — do you?',
  'Every missed call costs you $X',
  'We reply to your customers while you sleep',
  'Turn missed calls into booked appointments automatically',
];

const CTA_SUGGESTIONS = [
  'Book a Free Demo',
  'See How It Works',
  'Start Free Trial',
  'Get Your First Month Free',
  'Watch a 2-Minute Demo',
  'Try It Free for 14 Days',
];

const NOT_WORKING_SUGGESTIONS = [
  'Generic hooks with no pain point',
  'Long-form video with no hook in first 3 seconds',
  'Low-specificity targeting',
  'Weak CTA — no urgency',
  'Carousel with too many slides',
  'No social proof in creative',
];

const NEXT_TEST_SUGGESTIONS = [
  'Test a price-based hook ($X/month)',
  'Test a testimonial-style video',
  'Test a before/after format',
  'Test a competitor comparison angle',
  'Test a niche-specific hook per industry',
  'Test adding urgency to CTA',
];

const COLUMNS = [
  {key:'Date',label:'Date'},{key:'Platform',label:'Platform'},{key:'Niche',label:'Niche'},
  {key:'Winning Hook',label:'Winning Hook'},{key:'Winning CTA',label:'Winning CTA'},
  {key:'Best Creative Type',label:'Best Creative'},{key:'What Is Not Working',label:'Not Working'},
  {key:'Next Test Idea',label:'Next Test'},
];

function SuggestionPills({ suggestions, onSelect, value }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map(s => (
        <button key={s} type="button"
          onClick={() => onSelect(s)}
          className="rounded-full px-2.5 py-1 text-[10px] transition text-left"
          style={{
            background: value === s ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
            border: value === s ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(255,255,255,0.07)',
            color: value === s ? '#67e8f9' : '#71717a',
          }}>
          {s}
        </button>
      ))}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = { background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' };
const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none";

export default function CreativeInsightsPage() {
  const { rows, loading, error } = useTabData('CREATIVE_INSIGHTS');
  const showToast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform: 'Meta', niche: 'HVAC', winningHook: '', winningCta: '',
    bestCreative: 'Video', notWorking: '', nextTest: '',
  });

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function resetForm() {
    setForm({ platform: 'Meta', niche: 'HVAC', winningHook: '', winningCta: '', bestCreative: 'Video', notWorking: '', nextTest: '' });
  }

  async function saveInsight() {
    if (!form.winningHook) return;
    setSaving(true);
    try {
      const res = await fetch('/api/log-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Insight saved', 'success');
      setModalOpen(false);
      resetForm();
    } catch { showToast('Failed to save insight', 'error'); }
    finally { setSaving(false); }
  }

  if (loading && (!rows || rows.length === 0)) return <div className="space-y-6 px-6 py-6"><SkeletonTable rows={4} /></div>;
  if (error) return <ErrorBanner message={error} />;

  const hasData = rows && rows.length > 0;

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">What is working and what to test next. Takes 2 minutes after reviewing your Meta data.</p>
        <button onClick={() => setModalOpen(true)}
          className="rounded-xl px-4 py-2 text-sm font-medium transition"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}>
          + Add Insight
        </button>
      </div>

      {!hasData && (
        <div className="rounded-[18px] px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <span className="text-cyan-400">◈</span>
          <span className="text-zinc-400 text-sm">No insights yet. After reviewing your Meta data once a week, log what hooks and creatives are winning so your team knows what to replicate.</span>
        </div>
      )}

      {hasData && <DataTable rows={rows} columns={COLUMNS} searchPlaceholder="Search insights..." emptyMessage="No creative insights yet" />}

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            style={{ background: 'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(60px)', boxShadow: '0 48px 100px rgba(0,0,0,0.7)' }}>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Add Creative Insight</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Select or type your own — suggestions are just starting points</p>
              </div>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>

            {/* Platform + Niche + Creative Type */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Platform">
                <select value={form.platform} onChange={e => setField('platform', e.target.value)} className={inputClass} style={inputStyle}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Niche">
                <select value={form.niche} onChange={e => setField('niche', e.target.value)} className={inputClass} style={inputStyle}>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Best Creative Type">
                <select value={form.bestCreative} onChange={e => setField('bestCreative', e.target.value)} className={inputClass} style={inputStyle}>
                  {CREATIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>

            {/* Winning Hook */}
            <Field label="Winning Hook" required>
              <input value={form.winningHook} onChange={e => setField('winningHook', e.target.value)}
                placeholder="What hook performed best? Type your own or pick below..."
                className={inputClass} style={inputStyle} />
              <SuggestionPills suggestions={HOOK_SUGGESTIONS} onSelect={v => setField('winningHook', v)} value={form.winningHook} />
            </Field>

            {/* Winning CTA */}
            <Field label="Winning CTA">
              <input value={form.winningCta} onChange={e => setField('winningCta', e.target.value)}
                placeholder="Best performing call to action..."
                className={inputClass} style={inputStyle} />
              <SuggestionPills suggestions={CTA_SUGGESTIONS} onSelect={v => setField('winningCta', v)} value={form.winningCta} />
            </Field>

            {/* What's not working */}
            <Field label="What Is Not Working">
              <input value={form.notWorking} onChange={e => setField('notWorking', e.target.value)}
                placeholder="What flopped or underperformed..."
                className={inputClass} style={inputStyle} />
              <SuggestionPills suggestions={NOT_WORKING_SUGGESTIONS} onSelect={v => setField('notWorking', v)} value={form.notWorking} />
            </Field>

            {/* Next test idea */}
            <Field label="Next Test Idea">
              <input value={form.nextTest} onChange={e => setField('nextTest', e.target.value)}
                placeholder="What should we test next..."
                className={inputClass} style={inputStyle} />
              <SuggestionPills suggestions={NEXT_TEST_SUGGESTIONS} onSelect={v => setField('nextTest', v)} value={form.nextTest} />
            </Field>

            <div className="flex gap-3 pt-1">
              <button onClick={() => { setModalOpen(false); resetForm(); }}
                className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-400 transition hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <button onClick={saveInsight} disabled={!form.winningHook || saving}
                className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}>
                {saving ? 'Saving...' : 'Save Insight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

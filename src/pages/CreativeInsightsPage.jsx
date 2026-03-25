import { useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useToast } from '../components/Toast.jsx';

const PLATFORMS = ['Meta', 'Google Ads', 'Google Search', 'TikTok', 'YouTube', 'Other'];
const CREATIVE_TYPES = ['Video', 'Image', 'Carousel', 'Story', 'Reel', 'Text Ad', 'Other'];

const PLACEHOLDER_ROWS = [
  { Date: '—', Platform: 'Meta', Niche: 'HVAC', 'Winning Hook': 'Waiting for first insight...', 'Winning CTA': '—', 'Best Creative Type': '—', 'What Is Not Working': '—', 'Next Test Idea': '—' },
  { Date: '—', Platform: 'Google', Niche: 'Plumbing', 'Winning Hook': 'Waiting for first insight...', 'Winning CTA': '—', 'Best Creative Type': '—', 'What Is Not Working': '—', 'Next Test Idea': '—' },
];

const COLUMNS = [
  {key:'Date',label:'Date'},{key:'Platform',label:'Platform'},{key:'Niche',label:'Niche'},
  {key:'Winning Hook',label:'Winning Hook'},{key:'Winning CTA',label:'Winning CTA'},
  {key:'Best Creative Type',label:'Best Creative'},{key:'What Is Not Working',label:'Not Working'},
  {key:'Next Test Idea',label:'Next Test'},
];

export default function CreativeInsightsPage() {
  const { rows, loading, error } = useTabData('CREATIVE_INSIGHTS');
  const showToast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    platform: 'Meta', niche: '', winningHook: '', winningCta: '',
    bestCreative: 'Video', notWorking: '', nextTest: '',
  });

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function saveInsight() {
    if (!form.platform || !form.winningHook) return;
    setSaving(true);
    try {
      const res = await fetch('/api/log-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Insight saved successfully', 'success');
      setModalOpen(false);
      setForm({ platform: 'Meta', niche: '', winningHook: '', winningCta: '', bestCreative: 'Video', notWorking: '', nextTest: '' });
    } catch {
      showToast('Failed to save insight', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading && (!rows || rows.length === 0)) return <div className="space-y-6 px-6 py-6"><SkeletonTable rows={4} /></div>;
  if (error) return <ErrorBanner message={error} />;

  const hasData = rows && rows.length > 0;
  const displayRows = hasData ? rows : PLACEHOLDER_ROWS;

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">What is working and what to test next — logged by your team directly from campaign performance.</p>
        <button onClick={() => setModalOpen(true)}
          className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
          style={{background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.25)',color:'#67e8f9'}}>
          + Add Insight
        </button>
      </div>

      {!hasData && (
        <div className="rounded-[18px] px-4 py-3 text-sm flex items-center gap-3"
          style={{background:'rgba(6,182,212,0.06)',border:'1px solid rgba(6,182,212,0.15)'}}>
          <span className="text-cyan-400">◈</span>
          <span className="text-zinc-400">No insights yet. Click "+ Add Insight" to log your first creative finding.</span>
        </div>
      )}

      <DataTable rows={displayRows} columns={COLUMNS} searchable={hasData}
        searchPlaceholder="Search insights..." emptyMessage="No creative insights yet" />

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] p-6 space-y-4"
            style={{background:'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(60px)',boxShadow:'0 48px 100px rgba(0,0,0,0.7)'}}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add Creative Insight</h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Platform</label>
                <select value={form.platform} onChange={e => setField('platform', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Niche</label>
                <input value={form.niche} onChange={e => setField('niche', e.target.value)}
                  placeholder="e.g. HVAC, Plumbing" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Winning Hook <span className="text-red-400">*</span></label>
                <input value={form.winningHook} onChange={e => setField('winningHook', e.target.value)}
                  placeholder="What hook performed best?" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Winning CTA</label>
                <input value={form.winningCta} onChange={e => setField('winningCta', e.target.value)}
                  placeholder="Best CTA" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Best Creative Type</label>
                <select value={form.bestCreative} onChange={e => setField('bestCreative', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {CREATIVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">What Is Not Working</label>
                <input value={form.notWorking} onChange={e => setField('notWorking', e.target.value)}
                  placeholder="What flopped?" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Next Test Idea</label>
                <input value={form.nextTest} onChange={e => setField('nextTest', e.target.value)}
                  placeholder="What should we test next?" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-400 transition hover:text-white"
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                Cancel
              </button>
              <button onClick={saveInsight} disabled={!form.platform || !form.winningHook || saving}
                className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{background:'rgba(6,182,212,0.12)',border:'1px solid rgba(6,182,212,0.3)',color:'#67e8f9'}}>
                {saving ? 'Saving...' : 'Save Insight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

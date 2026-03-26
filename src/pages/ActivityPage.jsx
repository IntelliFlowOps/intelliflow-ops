import { useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import { useSheetData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { useToast } from '../components/Toast.jsx';

const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'Onboarding', 'Check-in', 'Issue', 'Renewal', 'Churn Risk', 'Win', 'Other'];
const HEALTH_OPTIONS = ['Positive', 'Neutral', 'Negative'];
const OWNERS = ['Founder', 'Emma', 'Wyatt', 'ED', 'Micah', 'Justin'];

function ExpandableActivityRow({ row }) {
  const [expanded, setExpanded] = useState(false);
  const healthColor = { Positive: '#10b981', Negative: '#ef4444', Neutral: '#a1a1aa' };
  const hc = healthColor[row['Health Impact']] || '#a1a1aa';
  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: expanded ? 'rgba(6,182,212,0.04)' : 'rgba(255,255,255,0.02)', border: expanded ? '1px solid rgba(6,182,212,0.15)' : '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(p => !p)}>
        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: hc }} />
        <div className="flex-1 min-w-0 grid grid-cols-4 gap-3">
          <span className="text-xs text-zinc-500 truncate">{row['Date']}</span>
          <span className="text-sm text-white font-medium truncate">{row['Customer Name']}</span>
          <span className="text-xs text-zinc-400 truncate">{row['Activity Type']}</span>
          <span className="text-xs text-zinc-400 truncate">{row['Owner']}</span>
        </div>
        <span className="text-zinc-600 text-xs shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/[0.05] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Summary', value: row['Summary'] },
              { label: 'Next Step', value: row['Next Step'] },
              { label: 'Health Impact', value: row['Health Impact'] },
              { label: 'Reference', value: row['Link / Reference'] },
            ].map(f => f.value ? (
              <div key={f.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{f.label}</div>
                <div className="text-sm text-zinc-200 leading-5">{f.value}</div>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { rows, loading, error } = useTabData('CUSTOMER_ACTIVITY');
  const { data } = useSheetData();
  const showToast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: '', activityType: 'Call', owner: 'Founder',
    summary: '', nextStep: '', healthImpact: 'Neutral', reference: '',
  });

  const customerNames = (data?.CUSTOMERS || []).map(r => r['Customer Name']).filter(Boolean);

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function saveActivity() {
    if (!form.customerName || !form.summary) return;
    setSaving(true);
    try {
      const res = await fetch('/api/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Activity logged successfully', 'success');
      setModalOpen(false);
      setForm({ customerName: '', activityType: 'Call', owner: 'Founder', summary: '', nextStep: '', healthImpact: 'Neutral', reference: '' });
    } catch {
      showToast('Failed to log activity', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading && (!rows || rows.length === 0)) return <div className="space-y-6 px-6 py-6"><SkeletonTable rows={5} /></div>;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">Customer activity timeline — operational notes, actions, and health signals.</p>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-xl px-4 py-2 text-sm font-medium transition-all"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}
        >
          + Log Activity
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[18px] px-4 py-8 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-zinc-500 text-sm">No activity logged yet — use the Log Activity button above to record your first client interaction.</div>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-4 gap-3 px-4 py-2 mb-1">
            {['Date','Client','Type','Owner'].map(h => (
              <span key={h} className="text-[10px] uppercase tracking-wider text-zinc-600">{h}</span>
            ))}
          </div>
          {rows.map((row, i) => <ExpandableActivityRow key={i} row={row} />)}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[28px] p-6 space-y-4"
            style={{background:'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))',border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(60px)',boxShadow:'0 48px 100px rgba(0,0,0,0.7)'}}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Log Activity</h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-500 hover:text-white transition text-xl">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Customer</label>
                {customerNames.length > 0 ? (
                  <select value={form.customerName} onChange={e => setField('customerName', e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
                    <option value="">Select customer...</option>
                    {customerNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : (
                  <input value={form.customerName} onChange={e => setField('customerName', e.target.value)}
                    placeholder="Customer name" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                    style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Activity Type</label>
                <select value={form.activityType} onChange={e => setField('activityType', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Owner</label>
                <select value={form.owner} onChange={e => setField('owner', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Summary <span className="text-red-400">*</span></label>
                <textarea value={form.summary} onChange={e => setField('summary', e.target.value)}
                  rows={3} placeholder="What happened? What was discussed?"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none resize-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Next Step</label>
                <input value={form.nextStep} onChange={e => setField('nextStep', e.target.value)}
                  placeholder="What happens next?" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Health Impact</label>
                <select value={form.healthImpact} onChange={e => setField('healthImpact', e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}}>
                  {HEALTH_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Reference Link (optional)</label>
                <input value={form.reference} onChange={e => setField('reference', e.target.value)}
                  placeholder="https://..." className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,255,255,0.1)'}} />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-400 transition hover:text-white"
                style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                Cancel
              </button>
              <button onClick={saveActivity} disabled={!form.customerName || !form.summary || saving}
                className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{background:'rgba(6,182,212,0.12)',border:'1px solid rgba(6,182,212,0.3)',color:'#67e8f9'}}>
                {saving ? 'Saving...' : 'Log Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

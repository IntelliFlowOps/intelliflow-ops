import { useState, useMemo } from 'react';
import DataTable from '../components/DataTable.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTabData } from '../hooks/useSheetData.jsx';
import { useToast } from '../components/Toast.jsx';

const CLOSERS = ['Emma', 'Wyatt', 'ED', 'Micah', 'Justin', 'Founder'];
const LEAD_SOURCES = ['Referral', 'Cold Outreach', 'Inbound', 'Paid Ads', 'Social Media', 'Event', 'Partnership', 'Other'];

const columns = [
  { key: 'Customer Name', label: 'Customer', render: (val, row) => {
    const unassigned = !row['Attribution Type'] || row['Attribution Type'].trim() === 'UNASSIGNED' || row['Attribution Type'].trim() === '';
    return (
      <span className="flex items-center gap-2">
        <span>{val || '—'}</span>
        {unassigned && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}>
            Needs Closer
          </span>
        )}
      </span>
    );
  }},
  { key: 'MRR / Revenue', label: 'MRR / Revenue' },
  { key: 'Status', label: 'Status' },
  { key: 'Lead Source', label: 'Lead Source' },
  { key: 'Months Active', label: 'Mo. Active' },
  { key: 'Attribution Type', label: 'Attribution' },
  { key: 'Direct Marketer', label: 'Marketer' },
  { key: 'Health Score', label: 'Health' },
  { key: 'Churn Risk', label: 'Churn Risk' },
  { key: 'LTV', label: 'LTV' },
];

const sections = [
  {
    title: 'Overview',
    fields: [
      'Customer Name',
      'MRR / Revenue',
      'Status',
      'Lead Source',
      'Months Active',
      'Industry / Niche',
      'Landing Page / Offer',
    ],
  },
  {
    title: 'Attribution & Commission',
    fields: [
      'Attribution Type',
      'Direct Marketer',
      'Commission Eligible?',
      'Commission Month Count',
    ],
  },
  {
    title: 'Dates',
    fields: [
      'Close Date',
      'Onboard Date',
      'Last Payment Date',
      'Next Renewal Date',
    ],
  },
  {
    title: 'Contact',
    fields: [
      'Primary Contact',
      'Phone',
      'Email',
      'Stripe Customer ID',
    ],
  },
  {
    title: 'Health & Risk',
    fields: ['Health Score', 'Churn Risk', 'LTV'],
  },
];

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function DetailField({ label, value }) {
  const showBadge = label === 'Status' || label === 'Churn Risk';

  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 border-b border-white/5 py-3 last:border-b-0">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-200">
        {showBadge ? <StatusBadge status={displayValue(value)} /> : displayValue(value)}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { rows, loading, error } = useTabData('CUSTOMERS');
  const showToast = useToast();
  const [selected, setSelected] = useState(null);
  const [assigningCloser, setAssigningCloser] = useState(false);
  const [selectedCloser, setSelectedCloser] = useState('');
  const [selectedLeadSource, setSelectedLeadSource] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const isUnassigned = (row) => {
    const attr = (row['Attribution Type'] || '').trim();
    return attr === '' || attr === 'UNASSIGNED';
  };

  async function saveCloser() {
    if (!selectedCloser || !selected) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/assign-closer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: selected['Customer Name'], closer: selectedCloser, leadSource: selectedLeadSource }),
      });
      if (!res.ok) throw new Error('Failed');
      setSaveStatus('saved');
      showToast(`${selectedCloser} assigned as closer`, 'success');
      setTimeout(() => { setSaveStatus(''); setAssigningCloser(false); setSelectedCloser(''); setSelectedLeadSource(''); }, 1500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  }

  const stats = useMemo(() => {
    const active = rows.filter(r => (r['Status'] || '').trim() === 'Active');
    const totalMRR = active.reduce((sum, r) => {
      const val = parseFloat(String(r['MRR / Revenue'] || '0').replace(/[^0-9.]/g, ''));
      return sum + (isFinite(val) ? val : 0);
    }, 0);
    const avgMonths = active.length > 0
      ? active.reduce((sum, r) => {
          const val = parseFloat(String(r['Months Active'] || '0').replace(/[^0-9.]/g, ''));
          return sum + (isFinite(val) ? val : 0);
        }, 0) / active.length
      : 0;
    return {
      total: rows.length,
      active: active.length,
      totalMRR: totalMRR > 0 ? `$${totalMRR.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$0',
      avgMonths: avgMonths > 0 ? avgMonths.toFixed(1) : '0',
    };
  }, [rows]);

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">Customer records from the Customers sheet. Click any row to open the full customer drawer.</p>
      </div>

      {loading && !rows.length && <SkeletonTable rows={6} cards={4} />}
      {error && <ErrorBanner message={error} />}

      {!loading && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Total Customers</div>
            <div className="mt-1 text-2xl font-semibold text-white">{stats.total}</div>
          </div>
          <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Active</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-400">{stats.active}</div>
          </div>
          <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Total MRR</div>
            <div className="mt-1 text-2xl font-semibold text-cyan-300">{stats.totalMRR}</div>
          </div>
          <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Avg Months Active</div>
            <div className="mt-1 text-2xl font-semibold text-white">{stats.avgMonths}</div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <DataTable
          rows={rows}
          columns={columns}
          onRowClick={setSelected}
          searchPlaceholder="Search customers..."
          emptyMessage="No customers loaded yet"
        />
      )}

      <DrawerPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.['Customer Name'] || 'Customer Detail'}
      >
        {selected && (
          <div className="space-y-8">
            {isUnassigned(selected) && (
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-400">
                  ⚠ Needs Closer Assignment
                </h3>
                <div className="rounded-2xl p-4 space-y-3"
                  style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <p className="text-xs text-zinc-400">This customer has no closer assigned. Select one to activate commission tracking.</p>
                  {!assigningCloser ? (
                    <button
                      onClick={() => setAssigningCloser(true)}
                      className="w-full rounded-xl py-2.5 text-sm font-medium transition-all"
                      style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}
                    >
                      Assign Closer
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedCloser}
                        onChange={e => setSelectedCloser(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="">Select closer...</option>
                        {CLOSERS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <select
                        value={selectedLeadSource}
                        onChange={e => setSelectedLeadSource(e.target.value)}
                        className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none mt-2"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <option value="">Lead source (optional)...</option>
                        {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={saveCloser}
                          disabled={!selectedCloser || saveStatus === 'saving'}
                          className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
                          style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}
                        >
                          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : 'Save'}
                        </button>
                        <button
                          onClick={() => { setAssigningCloser(false); setSelectedCloser(''); }}
                          className="rounded-xl px-4 py-2.5 text-sm text-zinc-500 transition hover:text-zinc-300"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {section.title}
                </h3>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  {section.fields.map((field) => (
                    <DetailField key={field} label={field} value={selected[field]} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}

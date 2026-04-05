import { useMemo, useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

const FOUNDER_PIN = '2343';

function PinLock({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  function attempt() {
    if (pin === FOUNDER_PIN) { onUnlock(); }
    else { setError('Incorrect PIN'); setPin(''); }
  }
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-sm rounded-[28px] p-8 space-y-5 text-center"
        style={{ background: 'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(60px)', boxShadow: '0 48px 100px rgba(0,0,0,0.7)' }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl mx-auto text-2xl"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>🔒</div>
        <div>
          <div className="text-lg font-semibold text-white">Founder Access Only</div>
          <div className="text-xs text-zinc-500 mt-1">Enter your PIN to continue</div>
        </div>
        <input
          type="password" inputMode="numeric"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter') attempt(); }}
          placeholder="PIN"
          className="w-full rounded-2xl px-4 py-3 text-center text-lg text-white outline-none tracking-[0.4em]"
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
          autoFocus
        />
        {error && <div className="text-xs text-red-400">{error}</div>}
        <button onClick={attempt}
          className="w-full rounded-2xl py-3 text-sm font-medium transition"
          style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}>
          Unlock
        </button>
      </div>
    </div>
  );
}

function fmt$(v) {
  const n = parseFloat(v);
  if (!isFinite(n)) return '$0.00';
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PayoutHistoryPage() {
  const [unlocked, setUnlocked] = useState(false);
  const { rows = [], loading, error } = useTabData('PAYOUT_BATCHES');
  const [expandedId, setExpandedId] = useState(null);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let totalPaid = 0;
    let thisMonthCount = 0;

    for (const row of rows) {
      totalPaid += parseFloat(row['Total Paid']) || 0;
      const date = String(row['Date'] || '').slice(0, 7);
      if (date === thisMonth) thisMonthCount++;
    }

    return { totalPayouts: rows.length, totalPaid, thisMonthCount };
  }, [rows]);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;
  if (loading && !rows.length) return <div className="space-y-6 px-6 py-6"><SkeletonTable rows={5} cards={3} /></div>;

  const columns = [
    { key: 'Date', label: 'Date' },
    { key: 'Person', label: 'Person' },
    { key: 'Type', label: 'Type' },
    {
      key: 'Total Paid',
      label: 'Total Paid',
      render: (val) => <span className="text-emerald-400 font-medium">{fmt$(val)}</span>,
    },
    { key: 'Rows Processed', label: 'Rows' },
    { key: 'Batch ID', label: 'Batch ID', render: (val) => <span className="text-xs text-zinc-500 font-mono">{val || '—'}</span> },
  ];

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Payout History</h1>
          <p className="mt-1 text-sm text-slate-400">Every payout made to the team</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              const r = await fetch('/api/export?table=payout_batches&format=csv', { headers: { 'x-api-secret': 'INTELLIFLOW_OPS_2026' } });
              const blob = await r.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `intelliflow-payout_batches-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setUnlocked(false)}
            className="rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Lock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Total Payouts</div>
          <div className="mt-1 text-2xl font-semibold text-white">{stats.totalPayouts}</div>
        </div>
        <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Total Paid</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-400">{fmt$(stats.totalPaid)}</div>
        </div>
        <div className="rounded-[18px] bg-white/[0.04] px-4 py-3 backdrop-blur-xl border border-white/[0.04]">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">This Month</div>
          <div className="mt-1 text-2xl font-semibold text-cyan-300">{stats.thisMonthCount}</div>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {rows.length > 0 ? (
        <DataTable
          rows={rows}
          columns={columns}
          searchPlaceholder="Search payouts..."
          onRowClick={(row) => setExpandedId(expandedId === row.batch_id ? null : row.batch_id)}
        />
      ) : (
        <EmptyState message="No payouts recorded yet" />
      )}
    </div>
  );
}

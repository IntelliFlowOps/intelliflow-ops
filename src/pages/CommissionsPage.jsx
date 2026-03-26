import { useMemo } from 'react';
import { useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import KpiCard from '../components/KpiCard.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';


const FOUNDER_PIN = "2343";

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
          type="password"
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

export default function CommissionsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const { rows: ledgerRows = [], loading, error } = useTabData('COMMISSION_LEDGER');
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  if (loading && !ledgerRows.length) return <div className='space-y-6 px-6 py-6'><SkeletonTable rows={5} cards={4} /></div>;

  const stats = useMemo(() => {
    const activeRows = ledgerRows.filter((row) =>
      Object.values(row || {}).some((value) => String(value || '').trim() !== '')
    );

    const unpaidRows = activeRows.filter((row) => {
      const paidOut = String(row['Paid Out?'] || '').trim().toLowerCase();
      const payoutBatch = String(row['Payout Batch / Month'] || '').trim();
      return !row._isPaidOut && paidOut !== 'paid' && paidOut !== 'yes' && !payoutBatch;
    });

    const paidRows = activeRows.filter((row) => {
      const paidOut = String(row['Paid Out?'] || '').trim().toLowerCase();
      const payoutBatch = String(row['Payout Batch / Month'] || '').trim();
      return row._isPaidOut || paidOut === 'paid' || paidOut === 'yes' || Boolean(payoutBatch);
    });

    const uniqueCustomers = new Set(
      activeRows.map((row) => String(row['Customer Name'] || '').trim()).filter(Boolean)
    ).size;

    return {
      totalRows: activeRows.length,
      unpaidRows: unpaidRows.length,
      paidRows: paidRows.length,
      uniqueCustomers,
    };
  }, [ledgerRows]);

  const columns = [
    { key: 'Date', label: 'Date' },
    { key: 'Customer Name', label: 'Customer' },
    { key: 'Revenue Collected', label: 'Revenue' },
    {
      key: 'Attribution Type',
      label: 'Attribution',
      render: (value) => value || '—',
    },
    {
      key: 'Owner',
      label: 'Owner',
      render: (_, row) => {
        const salesRep = String(row['Sales Rep'] || '').trim();
        const directMarketer = String(row['Direct Marketer'] || '').trim();
        if (salesRep) return salesRep;
        if (directMarketer) return directMarketer;
        return '—';
      },
    },
    { key: 'Months Active / Paid Month', label: 'Month' },
    {
      key: 'Paid Out?',
      label: 'Status',
      render: (_, row) => {
        const payoutBatch = String(row['Payout Batch / Month'] || '').trim();
        const paidOut = String(row['Paid Out?'] || '').trim().toLowerCase();
        const isPaid = row._isPaidOut || paidOut === 'paid' || paidOut === 'yes' || Boolean(payoutBatch);

        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              isPaid
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
            }`}
          >
            {isPaid ? 'Paid' : 'Unpaid'}
          </span>
        );
      },
    },
    { key: 'Payout Batch / Month', label: 'Payout Batch' },
    { key: 'Notes', label: 'Notes' },
  ];

  return (
    <div className="space-y-6 px-6 py-6">
      <section>
        <h2 className="section-title mb-3">Ledger</h2>
        <p className="mb-4 text-sm text-zinc-400">
          Internal operational ledger only. Personal commission numbers are hidden from this page.
        </p>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Ledger Rows" value={stats.totalRows > 0 ? stats.totalRows : '0'} color="info" />
          <KpiCard label="Unpaid Rows" value={stats.unpaidRows > 0 ? stats.unpaidRows : '0'} color="warning" />
          <KpiCard label="Paid Rows" value={stats.paidRows > 0 ? stats.paidRows : '0'} color="success" />
          <KpiCard
            label="Customers in Ledger"
            value={stats.uniqueCustomers > 0 ? stats.uniqueCustomers : '0'}
            color="accent"
          />
        </div>
      </section>

      <section>
        <div className="card p-4 text-sm text-zinc-400">
          This page is for internal ledger operations only. Each team member views only their own commission math inside Individual Commissions after PIN unlock.
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Ledger Entries</h2>
        {error && <ErrorBanner message={error} />}
        {ledgerRows.length > 0 ? (
          <div>
            <div className="grid grid-cols-4 gap-3 px-4 py-2 mb-1">
              {['Date','Customer','Attribution','Status'].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-wider text-zinc-600">{h}</span>
              ))}
            </div>
            {ledgerRows.map((row, i) => <ExpandableLedgerRow key={i} row={row} />)}
          </div>
        ) : (
          <EmptyState message="No ledger entries yet" />
        )}
      </section>
    </div>
  );
}

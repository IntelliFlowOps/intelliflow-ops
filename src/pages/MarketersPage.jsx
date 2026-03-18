import { useMemo } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { displayValue } from '../utils/format.js';

export default function MarketersPage() {
  const { rows: marketerRows, loading: mLoading, error: mError } = useTabData('MARKETERS');
  const { rows: ledgerRows, loading: lLoading, error: lError } = useTabData('COMMISSION_LEDGER');
  const loading = mLoading || lLoading;
  if (loading && (!marketerRows || marketerRows.length === 0)) return <LoadingSpinner />;
  if (mError) return <ErrorBanner message={mError} />;
  if (!marketerRows || marketerRows.length === 0) return <EmptyState message="No marketer data yet" />;

  const individuals = marketerRows.filter((r) => r.Marketer && r.Marketer !== 'Team Total');
  const teamTotal = marketerRows.find((r) => r.Marketer === 'Team Total');
  const sampleRow = individuals[0] || teamTotal || {};
  const hasPayoutStatus = 'Payout Status' in sampleRow;
  const hasPendingField = 'Commission Pending' in sampleRow;
  const hasPaidField = 'Commission Paid' in sampleRow;
  const hasPaidOutInLedger = ledgerRows?.length > 0 && 'Paid Out?' in (ledgerRows[0] || {});

  return (
    <div className="space-y-6 fade-in">
      {teamTotal && (
        <section>
          <h2 className="section-title mb-3">Team Totals</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <KpiCard label="Customers Touched" value={teamTotal['Customers Touched']} color="info" />
            <KpiCard label="Active Customers" value={teamTotal['Active Customers']} color="success" />
            <KpiCard label="Revenue Managed" value={teamTotal['Revenue Managed']} color="accent" />
            <KpiCard label="Close Rate" value={teamTotal['Close Rate']} color="warning" />
          </div>
        </section>
      )}

      <section>
        <h2 className="section-title mb-3">Commission & Payout Overview</h2>
        <p className="text-xs text-zinc-500 mb-3">All values from Google Sheets.{hasPaidOutInLedger ? ' Paid/unpaid from "Paid Out?" in ledger.' : ''}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {individuals.map((m) => <MarketerPayoutCard key={m.Marketer} marketer={m} ledgerRows={ledgerRows} hasPaidOutInLedger={hasPaidOutInLedger} hasPayoutStatus={hasPayoutStatus} hasPendingField={hasPendingField} hasPaidField={hasPaidField} />)}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Individual Performance</h2>
        <MarketerTable rows={individuals} hasPayoutStatus={hasPayoutStatus} hasPendingField={hasPendingField} hasPaidField={hasPaidField} />
      </section>

      <section>
        <h2 className="section-title mb-3">Commission Ledger — by Marketer</h2>
        {lError && <ErrorBanner message={lError} />}
        <LedgerByMarketer ledgerRows={ledgerRows} marketers={individuals} hasPaidOutInLedger={hasPaidOutInLedger} />
      </section>

      <div className="card p-4 border-surface-500/30">
        <p className="text-xs text-zinc-500"><span className="font-semibold text-zinc-400">Read-only.</span> Commission and payout status changes happen in Google Sheets. Update "Paid Out?" in the Commission_Ledger sheet — changes appear here after refresh.</p>
      </div>
    </div>
  );
}

function useLedgerPayoutSummary(name, ledgerRows, hasPaidOutInLedger) {
  return useMemo(() => {
    if (!ledgerRows?.length || !name) return null;
    const commField = `${name} Commission`;
    let earned = 0, paid = 0, unpaid = 0, paidCount = 0, unpaidCount = 0;
    ledgerRows.forEach((r) => {
      const attr = (r['Attribution Type'] || '').trim().toUpperCase();
      const dm = (r['Direct Marketer'] || '').trim();
      let involved = false;
      if (attr === 'TEAM' && (name === 'Emma' || name === 'Wyatt')) involved = true;
      else if (attr === 'DIRECT' && dm === name) involved = true;
      if (!involved) return;
      const val = parseFloat((r[commField] || '').replace(/[^0-9.-]/g, ''));
      if (isNaN(val) || val === 0) return;
      earned += val;
      if (hasPaidOutInLedger) { if (r._isPaidOut) { paid += val; paidCount++; } else { unpaid += val; unpaidCount++; } }
    });
    if (earned === 0 && paidCount === 0 && unpaidCount === 0) return null;
    const fmt = (n) => n > 0 ? '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
    return { earned: fmt(earned), paid: fmt(paid), unpaid: fmt(unpaid), paidCount, unpaidCount, totalCount: paidCount + unpaidCount };
  }, [name, ledgerRows, hasPaidOutInLedger]);
}

function MarketerPayoutCard({ marketer, ledgerRows, hasPaidOutInLedger, hasPayoutStatus, hasPendingField, hasPaidField }) {
  const ls = useLedgerPayoutSummary(marketer.Marketer, ledgerRows, hasPaidOutInLedger);
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-100">{marketer.Marketer}</h3>
        {hasPayoutStatus && marketer['Payout Status'] && <StatusBadge status={marketer['Payout Status']} />}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Earned (MTD)</div>
          <div className="text-lg font-bold text-accent-glow">{displayValue(marketer['Commission Earned (MTD)'])}</div>
          <div className="text-[10px] text-zinc-600">From Marketers sheet</div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Paid</div>
          {hasPaidOutInLedger && ls ? (<><div className="text-lg font-bold text-emerald-400">{ls.paid}</div><div className="text-[10px] text-zinc-600">{ls.paidCount} txns from ledger</div></>) : hasPaidField ? (<><div className="text-lg font-bold text-emerald-400">{displayValue(marketer['Commission Paid'])}</div><div className="text-[10px] text-zinc-600">From Marketers sheet</div></>) : (<><div className="text-lg font-bold text-zinc-500">—</div><div className="text-[10px] text-zinc-600">Awaiting data</div></>)}
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Unpaid / Pending</div>
          {hasPaidOutInLedger && ls ? (<><div className="text-lg font-bold text-amber-400">{ls.unpaid}</div><div className="text-[10px] text-zinc-600">{ls.unpaidCount} txns from ledger</div></>) : hasPendingField ? (<><div className="text-lg font-bold text-amber-400">{displayValue(marketer['Commission Pending'])}</div><div className="text-[10px] text-zinc-600">From Marketers sheet</div></>) : (<><div className="text-lg font-bold text-zinc-500">—</div><div className="text-[10px] text-zinc-600">Awaiting data</div></>)}
        </div>
      </div>
      {hasPaidOutInLedger && ls && <div className="pt-2 border-t border-surface-500/30"><div className="flex items-center gap-4 text-xs"><span className="text-zinc-500">Ledger total:</span><span className="font-medium text-zinc-300">{ls.earned}</span><span className="text-zinc-600">|</span><span className="text-zinc-500">{ls.totalCount} transactions</span></div></div>}
      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-500/30">
        <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Avg CAC</div><div className="text-sm font-medium text-zinc-300">{displayValue(marketer['Avg CAC'])}</div></div>
        <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Close Rate</div><div className="text-sm font-medium text-zinc-300">{displayValue(marketer['Close Rate'])}</div></div>
        <div><div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-0.5">Avg CPL</div><div className="text-sm font-medium text-zinc-300">{displayValue(marketer['Avg CPL'])}</div></div>
      </div>
      {!hasPaidOutInLedger && !hasPendingField && !hasPaidField && <p className="text-[10px] text-zinc-600 pt-1">Paid/Pending breakdown appears when "Paid Out?" is populated in the Commission_Ledger sheet.</p>}
    </div>
  );
}

function MarketerTable({ rows, hasPayoutStatus, hasPendingField, hasPaidField }) {
  const columns = [{ key: 'Marketer', label: 'Marketer' }, { key: 'Customers Touched', label: 'Cust. Touched' }, { key: 'Active Customers', label: 'Active Cust.' }, { key: 'Revenue Managed', label: 'Revenue Managed' }, { key: 'Commission Earned (MTD)', label: 'Earned (MTD)' }];
  if (hasPendingField) columns.push({ key: 'Commission Pending', label: 'Pending' });
  if (hasPaidField) columns.push({ key: 'Commission Paid', label: 'Paid' });
  if (hasPayoutStatus) columns.push({ key: 'Payout Status', label: 'Payout Status' });
  columns.push({ key: 'Avg CAC', label: 'Avg CAC' }, { key: 'Close Rate', label: 'Close Rate' }, { key: 'Avg CPL', label: 'Avg CPL' }, { key: 'Top Niche', label: 'Top Niche' });
  return <DataTable rows={rows} columns={columns} searchable={false} emptyMessage="No individual marketer data yet" />;
}

function LedgerByMarketer({ ledgerRows, marketers, hasPaidOutInLedger }) {
  if (!ledgerRows?.length) return <EmptyState message="No commission ledger entries yet" />;
  const baseCols = [{ key: 'Date', label: 'Date' }, { key: 'Customer Name', label: 'Customer' }, { key: 'Revenue Collected', label: 'Revenue' }, { key: 'Attribution Type', label: 'Attribution' }, { key: 'Months Active / Paid Month', label: 'Month' }];
  return (
    <div className="space-y-4">
      {marketers.map((m) => {
        const name = m.Marketer;
        const myRows = ledgerRows.filter((r) => { const a = (r['Attribution Type'] || '').trim().toUpperCase(); const dm = (r['Direct Marketer'] || '').trim(); if (a === 'TEAM' && (name === 'Emma' || name === 'Wyatt')) return true; if (a === 'DIRECT' && dm === name) return true; return false; });
        const cols = [...baseCols, { key: `${name} Commission`, label: `${name} $`, render: (v, row) => displayValue(row[`${name} Commission`]) }];
        if (hasPaidOutInLedger) cols.push({ key: 'Paid Out?', label: 'Paid Out?', render: (val) => { const raw = (val || '').trim().toLowerCase(); const isPaid = ['yes','true','paid','y','1'].includes(raw); if (!val || !val.trim()) return <span className="text-zinc-500 text-xs">—</span>; return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isPaid ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>{isPaid ? 'Paid' : val}</span>; } });
        cols.push({ key: 'Payout Batch / Month', label: 'Payout Batch' }, { key: 'Notes', label: 'Notes' });
        return (<div key={name}><h3 className="text-sm font-medium text-zinc-300 mb-2">{name}</h3>{myRows.length > 0 ? <DataTable rows={myRows} columns={cols} searchable={false} maxHeight="max-h-[300px]" /> : <div className="card px-4 py-3 text-xs text-zinc-500">No ledger entries for {name}</div>}</div>);
      })}
    </div>
  );
}

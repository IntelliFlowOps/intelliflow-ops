import { useMemo } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import KpiCard from '../components/KpiCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function CommissionsPage() {
  const { rows: ledgerRows, loading: ll, error: le } = useTabData('COMMISSION_LEDGER');
  const { rows: rulesData, loading: rl, error: re } = useTabData('COMMISSION_RULES');
  const loading = ll || rl;
  if (loading && !ledgerRows?.length && !rulesData) return <LoadingSpinner />;
  const rules = rulesData?.rules || [];
  const notes = rulesData?.notes || [];
  const hasPaidOutField = ledgerRows?.length > 0 && 'Paid Out?' in (ledgerRows[0] || {});

  return (
    <div className="space-y-8 fade-in">
      <section>
        <h2 className="section-title mb-3">Commission Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="card p-4"><div className="text-xs text-zinc-500 mb-1">TEAM Attribution</div><div className="text-lg font-bold text-accent-glow">25% total</div><div className="text-xs text-zinc-400 mt-1">12.5% Emma / 12.5% Wyatt — first 3 months only</div></div>
          <div className="card p-4"><div className="text-xs text-zinc-500 mb-1">DIRECT Attribution</div><div className="text-lg font-bold text-emerald-400">5% lifetime</div><div className="text-xs text-zinc-400 mt-1">Paid to the named direct marketer only</div></div>
          <div className="card p-4"><div className="text-xs text-zinc-500 mb-1">FOUNDER Attribution</div><div className="text-lg font-bold text-zinc-400">0%</div><div className="text-xs text-zinc-400 mt-1">No marketer commission on founder deals</div></div>
        </div>
        {re && <ErrorBanner message={re} />}
        {rules.length > 0 ? <DataTable rows={rules} columns={[{key:'Attribution Type',label:'Attribution'},{key:'Direct Marketer',label:'Marketer'},{key:'Commission % Total',label:'Total %'},{key:'Emma %',label:'Emma %'},{key:'Wyatt %',label:'Wyatt %'},{key:'Term',label:'Term'},{key:'When It Applies',label:'Applies When'},{key:'Notes',label:'Notes'}]} searchable={false} /> : <EmptyState message="No commission rules found" />}
        {notes.length > 0 && <div className="mt-4 space-y-2"><h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Notes</h3>{notes.map((n,i) => <div key={i} className="card p-3 text-sm"><span className="font-medium text-zinc-300">{n.label}:</span> <span className="text-zinc-400">{n.value}</span></div>)}</div>}
      </section>

      {hasPaidOutField && ledgerRows?.length > 0 && <PayoutSummary ledgerRows={ledgerRows} />}

      <section>
        <h2 className="section-title mb-3">Commission Ledger</h2>
        {hasPaidOutField && <p className="text-xs text-zinc-500 mb-3">"Paid Out?" is the source of truth for payout status, set in Google Sheets.</p>}
        {le && <ErrorBanner message={le} />}
        <LedgerTable ledgerRows={ledgerRows || []} hasPaidOutField={hasPaidOutField} />
      </section>
      <p className="text-[10px] text-zinc-600">Commission calculations and payout status happen in Google Sheets. This app does NOT recalculate or modify payout status.</p>
    </div>
  );
}

function PayoutSummary({ ledgerRows }) {
  const s = useMemo(() => {
    let total = 0, paid = 0, unpaid = 0, pc = 0, uc = 0;
    ledgerRows.forEach((r) => { const v = parseFloat((r['Commission Total']||'0').replace(/[^0-9.-]/g,'')); if (isNaN(v)||v===0) return; total+=v; if (r._isPaidOut) { paid+=v; pc++; } else { unpaid+=v; uc++; } });
    const fmt = (n) => n > 0 ? '$'+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : '—';
    return { total:fmt(total), paid:fmt(paid), unpaid:fmt(unpaid), pc, uc, tc:pc+uc };
  }, [ledgerRows]);
  return (
    <section>
      <h2 className="section-title mb-3">Payout Summary (from Ledger)</h2>
      <p className="text-xs text-zinc-500 mb-3">Derived from "Paid Out?" in each ledger row. Read-only.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total Commission" value={s.total} color="accent" />
        <KpiCard label="Paid Out" value={s.paid} color="success" subtitle={`${s.pc} transactions`} />
        <KpiCard label="Unpaid / Pending" value={s.unpaid} color="warning" subtitle={`${s.uc} transactions`} />
        <KpiCard label="Total Transactions" value={s.tc>0?s.tc:'—'} color="info" />
        <KpiCard label="Paid Transactions" value={s.pc>0?s.pc:'—'} color="success" />
        <KpiCard label="Unpaid Transactions" value={s.uc>0?s.uc:'—'} color="warning" />
      </div>
    </section>
  );
}

function LedgerTable({ ledgerRows, hasPaidOutField }) {
  const cols = [{key:'Date',label:'Date'},{key:'Customer Name',label:'Customer'},{key:'Revenue Collected',label:'Revenue'},{key:'Attribution Type',label:'Attribution'},{key:'Direct Marketer',label:'Marketer'},{key:'Months Active / Paid Month',label:'Month'},{key:'Commission %',label:'Comm %'},{key:'Emma %',label:'Emma %'},{key:'Wyatt %',label:'Wyatt %'},{key:'Commission Total',label:'Total'},{key:'Emma Commission',label:'Emma $'},{key:'Wyatt Commission',label:'Wyatt $'}];
  if (hasPaidOutField) cols.push({key:'Paid Out?',label:'Paid Out?',render:(val)=>{const raw=(val||'').trim().toLowerCase();const isPaid=['yes','true','paid','y','1'].includes(raw);if(!val||!val.trim())return<span className="text-zinc-500 text-xs">—</span>;return<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isPaid?'bg-emerald-500/15 text-emerald-400 border-emerald-500/30':'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>{isPaid?'Paid':val}</span>;}});
  cols.push({key:'Payout Batch / Month',label:'Payout Batch'},{key:'Notes',label:'Notes'});
  return <DataTable rows={ledgerRows} columns={cols} searchPlaceholder="Search transactions..." emptyMessage="No commission transactions yet" />;
}

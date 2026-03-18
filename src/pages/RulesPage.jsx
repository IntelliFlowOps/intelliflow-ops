import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function RulesPage() {
  const { rows: rulesData, loading: rl, error: re } = useTabData('COMMISSION_RULES');
  const { rows: dictRows, loading: dl, error: de } = useTabData('DATA_DICTIONARY');
  const { rows: kpiRows, loading: kl, error: ke } = useTabData('FOUNDERS_KPIS');
  const loading = rl || dl || kl;
  if (loading && !rulesData && !dictRows?.length && !kpiRows?.length) return <LoadingSpinner />;
  const rules = rulesData?.rules || [];
  const notes = rulesData?.notes || [];

  return (
    <div className="space-y-8 fade-in">
      <section>
        <h2 className="section-title mb-3">Commission Rules</h2>
        {re && <ErrorBanner message={re} />}
        {rules.length > 0 ? <DataTable rows={rules} columns={[{key:'Attribution Type',label:'Attribution'},{key:'Direct Marketer',label:'Marketer'},{key:'Commission % Total',label:'Total %'},{key:'Emma %',label:'Emma %'},{key:'Wyatt %',label:'Wyatt %'},{key:'Term',label:'Term'},{key:'When It Applies',label:'Applies When'},{key:'Notes',label:'Notes'}]} searchable={false} /> : <EmptyState message="No commission rules found" />}
        {notes.length > 0 && <div className="mt-4 space-y-2"><h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Agent Instructions</h3>{notes.map((n,i)=><div key={i} className="card p-3 text-sm"><span className="font-medium text-zinc-300">{n.label}:</span> <span className="text-zinc-400">{n.value}</span></div>)}</div>}
      </section>

      <section>
        <h2 className="section-title mb-3">Founder KPI Targets</h2>
        {ke && <ErrorBanner message={ke} />}
        {kpiRows?.length > 0 ? <DataTable rows={kpiRows} columns={[{key:'Metric',label:'Metric'},{key:'Formula / Value',label:'Value'},{key:'Why It Matters',label:'Why It Matters'},{key:'Target',label:'Target'},{key:'Status',label:'Status'},{key:'Notes',label:'Notes'}]} searchable={false} /> : <EmptyState message="No KPI targets defined yet" />}
      </section>

      <section>
        <h2 className="section-title mb-3">Data Dictionary</h2>
        <p className="text-sm text-zinc-400 mb-3">Field definitions and update sources.</p>
        {de && <ErrorBanner message={de} />}
        {dictRows?.length > 0 ? <DataTable rows={dictRows} columns={[{key:'Sheet',label:'Sheet'},{key:'Field',label:'Field'},{key:'Type',label:'Type'},{key:'Update Source',label:'Source'},{key:'Definition / Rule',label:'Definition'}]} searchable={true} searchPlaceholder="Search fields..." /> : <EmptyState message="No data dictionary entries yet" />}
      </section>

      <section>
        <h2 className="section-title mb-3">Quick Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4"><h3 className="text-sm font-medium text-zinc-300 mb-2">Allowed Attribution Values</h3><div className="flex gap-2">{['FOUNDER','TEAM','DIRECT'].map((v)=><span key={v} className="px-2.5 py-1 bg-surface-600 text-xs font-mono text-zinc-300 rounded-md">{v}</span>)}</div></div>
          <div className="card p-4"><h3 className="text-sm font-medium text-zinc-300 mb-2">Allowed Direct Marketer Values</h3><div className="flex gap-2">{['Emma','Wyatt','(blank)'].map((v)=><span key={v} className="px-2.5 py-1 bg-surface-600 text-xs font-mono text-zinc-300 rounded-md">{v}</span>)}</div></div>
          <div className="card p-4"><h3 className="text-sm font-medium text-zinc-300 mb-2">Allowed Customer Statuses</h3><div className="flex flex-wrap gap-2">{['Active','Onboarding','Paused','At Risk','Churned','Refunded'].map((v)=><span key={v} className="px-2.5 py-1 bg-surface-600 text-xs font-mono text-zinc-300 rounded-md">{v}</span>)}</div></div>
          <div className="card p-4"><h3 className="text-sm font-medium text-zinc-300 mb-2">Commission Logic Summary</h3><ul className="text-xs text-zinc-400 space-y-1.5"><li><span className="text-zinc-300 font-medium">TEAM:</span> 25% total (12.5% each) — first 3 paid months only</li><li><span className="text-zinc-300 font-medium">DIRECT:</span> 5% lifetime to the named marketer</li><li><span className="text-zinc-300 font-medium">FOUNDER:</span> 0% — no marketer commission</li></ul></div>
        </div>
      </section>
      <p className="text-[10px] text-zinc-600">All rules and definitions are maintained in Google Sheets. This app is read-only.</p>
    </div>
  );
}

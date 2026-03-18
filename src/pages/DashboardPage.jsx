import { useTabData } from '../hooks/useSheetData.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const { rows: dashboard, loading, error } = useTabData('DASHBOARD');
  if (loading && !dashboard) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!dashboard || (!dashboard.kpis && !dashboard.marketing)) return <EmptyState message="Dashboard data not available yet" />;
  const { kpis = {}, marketing = {}, watchlist = [], lastUpdated } = dashboard;

  return (
    <div className="space-y-6 fade-in">
      {lastUpdated && <p className="text-xs text-zinc-500">Sheet last updated: {lastUpdated}</p>}
      <section>
        <h2 className="section-title mb-3">Founder / Executive KPIs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Total Revenue" value={kpis['Total Revenue']} color="accent" />
          <KpiCard label="Active Customers" value={kpis['Active Customers']} color="info" />
          <KpiCard label="MRR" value={kpis['MRR']} color="accent" />
          <KpiCard label="Ad Spend (MTD)" value={kpis['Ad Spend (MTD)']} color="warning" />
          <KpiCard label="Commissions (MTD)" value={kpis['Total Commissions (MTD)']} color="zinc" />
          <KpiCard label="Net Profit (MTD)" value={kpis['Net Profit (MTD)']} color="success" />
        </div>
      </section>
      <section>
        <h2 className="section-title mb-3">Marketing Snapshot</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Leads (MTD)" value={marketing['Leads (MTD)']} color="info" />
          <KpiCard label="Customers Won (MTD)" value={marketing['Customers Won (MTD)']} color="success" />
          <KpiCard label="CAC" value={marketing['CAC']} color="warning" />
          <KpiCard label="Cost / Lead" value={marketing['Cost / Lead']} color="zinc" />
          <KpiCard label="Blended CTR" value={marketing['Blended CTR']} color="accent" />
          <KpiCard label="Blended Close Rate" value={marketing['Blended Close Rate']} color="accent" />
        </div>
      </section>
      <section>
        <h2 className="section-title mb-3">Daily Operations Watchlist</h2>
        {watchlist.length > 0 ? (
          <DataTable rows={watchlist} columns={[
            { key: 'Priority', label: 'Priority' }, { key: 'Owner', label: 'Owner' }, { key: 'Entity', label: 'Entity' },
            { key: 'Current Value', label: 'Current Value' }, { key: 'Target / Rule', label: 'Target / Rule' },
            { key: 'Status', label: 'Status' }, { key: 'Action Needed', label: 'Action Needed' }, { key: 'Notes', label: 'Notes' },
          ]} searchable={false} emptyMessage="No items on the watchlist" />
        ) : <EmptyState message="No items on the watchlist yet" />}
      </section>
    </div>
  );
}

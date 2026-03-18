import { useState, useMemo } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { displayValue } from '../utils/format.js';

export default function CampaignsPage() {
  const { rows, loading, error } = useTabData('CAMPAIGNS');
  const [selected, setSelected] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('All');
  const platforms = useMemo(() => { if (!rows?.length) return ['All']; const s = new Set(rows.map((r) => r.Platform).filter(Boolean)); return ['All', ...Array.from(s)]; }, [rows]);
  const filtered = useMemo(() => { if (!rows) return []; if (platformFilter === 'All') return rows; return rows.filter((r) => r.Platform === platformFilter); }, [rows, platformFilter]);
  if (loading && (!rows || rows.length === 0)) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const columns = [
    { key: 'Date', label: 'Date' }, { key: 'Platform', label: 'Platform' }, { key: 'Campaign Name', label: 'Campaign' },
    { key: 'Spend', label: 'Spend' }, { key: 'Leads', label: 'Leads' }, { key: 'Qualified Leads', label: 'Qual. Leads' },
    { key: 'CTR', label: 'CTR' }, { key: 'CPC', label: 'CPC' }, { key: 'Customers Won', label: 'Cust. Won' },
    { key: 'Revenue Won', label: 'Rev. Won' }, { key: 'CAC', label: 'CAC' }, { key: 'Close Rate', label: 'Close Rate' }, { key: 'Status', label: 'Status' },
  ];

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center gap-3">
        <label className="text-xs text-zinc-500">Platform:</label>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="input-base text-sm">
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <DataTable rows={filtered} columns={columns} onRowClick={setSelected} searchPlaceholder="Search campaigns..." emptyMessage="No campaign data yet" />
      <DrawerPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.['Campaign Name'] || 'Campaign Detail'}>
        {selected && <CampaignDetail campaign={selected} />}
      </DrawerPanel>
    </div>
  );
}

function CampaignDetail({ campaign }) {
  const fields = ['Date','Platform','Campaign Name','Spend','Leads','Qualified Leads','Impressions','Clicks','CTR','CPC','Customers Won','Revenue Won','CPL','CAC','Close Rate','Status','Niche','Hook','CTA','Creative Type','Offer','Managed By','Campaign ID / Link'];
  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <div key={f} className="flex justify-between items-start py-1.5 border-b border-surface-500/20">
          <span className="text-xs text-zinc-500 flex-shrink-0 w-36">{f}</span>
          <span className="text-sm text-zinc-200 text-right">{f === 'Status' ? <StatusBadge status={campaign[f]} /> : displayValue(campaign[f])}</span>
        </div>
      ))}
      <p className="text-[10px] text-zinc-600 pt-4">Campaign data is read-only. Edit in Google Sheets.</p>
    </div>
  );
}

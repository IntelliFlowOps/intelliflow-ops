import { useMemo, useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTabData } from '../hooks/useSheetData.jsx';

const columns = [
  { key: 'Date', label: 'Date' },
  { key: 'Platform', label: 'Platform' },
  { key: 'Campaign Name', label: 'Campaign' },
  { key: 'Spend', label: 'Spend' },
  { key: 'Leads', label: 'Leads' },
  { key: 'Qualified Leads', label: 'Qual. Leads' },
  { key: 'CTR', label: 'CTR' },
  { key: 'CPC', label: 'CPC' },
  { key: 'Customers Won', label: 'Cust. Won' },
  { key: 'Revenue Won', label: 'Rev. Won' },
  { key: 'CAC', label: 'CAC' },
  { key: 'Close Rate', label: 'Close Rate' },
  { key: 'Status', label: 'Status' },
];

const sections = [
  {
    title: 'Overview',
    fields: [
      'Date',
      'Platform',
      'Campaign Name',
      'Status',
      'Managed By',
      'Campaign ID / Link',
    ],
  },
  {
    title: 'Performance',
    fields: [
      'Spend',
      'Leads',
      'Qualified Leads',
      'Impressions',
      'Clicks',
      'CTR',
      'CPC',
      'CPL',
      'CAC',
      'Close Rate',
    ],
  },
  {
    title: 'Outcome',
    fields: ['Customers Won', 'Revenue Won'],
  },
  {
    title: 'Creative & Offer',
    fields: ['Niche', 'Hook', 'CTA', 'Creative Type', 'Offer'],
  },
];

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function DetailField({ label, value }) {
  const showBadge = label === 'Status';

  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 border-b border-white/5 py-3 last:border-b-0">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-200">
        {showBadge ? <StatusBadge status={displayValue(value)} /> : displayValue(value)}
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const { rows, loading, error } = useTabData('CAMPAIGNS');
  const [selected, setSelected] = useState(null);
  const [platform, setPlatform] = useState('All');

  const cleanRows = useMemo(
    () => (rows || []).filter((row) => Object.values(row || {}).some((v) => String(v || '').trim() !== '')),
    [rows]
  );

  const platformOptions = useMemo(() => {
    const values = [...new Set(cleanRows.map((r) => (r['Platform'] || '').trim()).filter(Boolean))];
    return ['All', ...values];
  }, [cleanRows]);

  const filteredRows = useMemo(() => {
    if (platform === 'All') return cleanRows;
    return cleanRows.filter((r) => (r['Platform'] || '').trim() === platform);
  }, [cleanRows, platform]);

  const handleRowClick = (row) => {
    if (!row) return;
    setSelected(row);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-sm text-white outline-none"
          >
            {platformOptions.map((option) => (
              <option key={option} value={option} className="bg-surface text-white">
                {option}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-zinc-500">
          Campaign rows come from the Campaigns sheet only. Click any real campaign row to open the full campaign drawer.
        </p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} />}

      {!loading && !error && (
        <DataTable
          rows={filteredRows}
          columns={columns}
          onRowClick={handleRowClick}
          searchPlaceholder="Search campaigns..."
          emptyMessage="No campaigns yet. Add rows to the Campaigns tab in Google Sheets to see performance data here."
        />
      )}

      <DrawerPanel
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.['Campaign Name'] || 'Campaign Detail'}
      >
        {selected && (
          <div className="space-y-8">
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

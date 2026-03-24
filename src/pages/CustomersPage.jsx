import { useState, useMemo } from 'react';
import DataTable from '../components/DataTable.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTabData } from '../hooks/useSheetData.jsx';

const columns = [
  { key: 'Customer Name', label: 'Customer' },
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
  const [selected, setSelected] = useState(null);

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
    <div className="space-y-6 fade-in px-6 py-6">
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">Customer records from the Customers sheet. Click any row to open the full customer drawer.</p>
      </div>

      {loading && !rows.length && <SkeletonTable rows={6} cards={4} />}
      {error && <ErrorBanner message={error} />}

      {!loading && rows.length > 0 && (
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

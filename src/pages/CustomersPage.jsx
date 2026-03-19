import { useState } from 'react';
import DataTable from '../components/DataTable.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">Customer records from the Customers sheet. Click any row to open the full customer drawer.</p>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorBanner message={error} />}

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

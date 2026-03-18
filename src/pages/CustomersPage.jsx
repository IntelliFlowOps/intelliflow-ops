import { useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DataTable from '../components/DataTable.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import { displayValue } from '../utils/format.js';

export default function CustomersPage() {
  const { rows, loading, error } = useTabData('CUSTOMERS');
  const [selected, setSelected] = useState(null);
  if (loading && (!rows || rows.length === 0)) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  const columns = [
    { key: 'Customer Name', label: 'Customer' }, { key: 'MRR / Revenue', label: 'MRR / Revenue' },
    { key: 'Status', label: 'Status' }, { key: 'Lead Source', label: 'Lead Source' },
    { key: 'Months Active', label: 'Mo. Active' }, { key: 'Attribution Type', label: 'Attribution' },
    { key: 'Direct Marketer', label: 'Marketer' }, { key: 'Health Score', label: 'Health' },
    { key: 'Churn Risk', label: 'Churn Risk' }, { key: 'LTV', label: 'LTV' },
  ];

  return (
    <div className="fade-in">
      <p className="text-xs text-zinc-500 mb-4">Click a customer to view full details</p>
      <DataTable rows={rows} columns={columns} onRowClick={setSelected} searchPlaceholder="Search customers..." emptyMessage="No customers yet" />
      <DrawerPanel open={!!selected} onClose={() => setSelected(null)} title={selected?.['Customer Name'] || 'Customer Detail'}>
        {selected && <CustomerDetail customer={selected} />}
      </DrawerPanel>
    </div>
  );
}

function CustomerDetail({ customer }) {
  const sections = [
    { title: 'Overview', fields: ['Customer Name', 'MRR / Revenue', 'Status', 'Lead Source', 'Months Active', 'Industry / Niche', 'Landing Page / Offer'] },
    { title: 'Attribution & Commission', fields: ['Attribution Type', 'Direct Marketer', 'Commission Eligible?', 'Commission Month Count'] },
    { title: 'Dates', fields: ['Close Date', 'Onboard Date', 'Last Payment Date', 'Next Renewal Date'] },
    { title: 'Contact', fields: ['Primary Contact', 'Phone', 'Email', 'Stripe Customer ID'] },
    { title: 'Health & Risk', fields: ['Health Score', 'Churn Risk', 'LTV'] },
  ];
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="section-title mb-3">{section.title}</h3>
          <div className="space-y-2">
            {section.fields.map((field) => (
              <div key={field} className="flex justify-between items-start py-1.5 border-b border-surface-500/20">
                <span className="text-xs text-zinc-500 flex-shrink-0 w-40">{field}</span>
                <span className="text-sm text-zinc-200 text-right">
                  {field === 'Status' || field === 'Churn Risk' ? <StatusBadge status={customer[field]} /> : displayValue(customer[field])}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {customer.Notes && <div><h3 className="section-title mb-2">Notes</h3><p className="text-sm text-zinc-300 bg-surface-600/50 rounded-lg p-3">{customer.Notes}</p></div>}
      <p className="text-[10px] text-zinc-600 pt-4 border-t border-surface-500/20">This app is read-only. To update customer data, edit the Google Sheet directly.</p>
    </div>
  );
}

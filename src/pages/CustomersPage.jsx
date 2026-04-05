import { useState, useMemo, useEffect } from 'react';
import DataTable from '../components/DataTable.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import LoadingSpinner, { SkeletonTable } from '../components/LoadingSpinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useTabData, useSheetData } from '../hooks/useSheetData.jsx';
import { useToast } from '../components/Toast.jsx';

const columns = [
  { key: 'Customer Name', label: 'Customer', render: (val, row) => {
    const attr = (row['Attribution Type'] || '').trim();
    const unassigned = !attr || attr === 'UNASSIGNED';
    return (
      <span className="flex items-center gap-2">
        <span>{val || '—'}</span>
        {unassigned && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}>
            Needs Seller
          </span>
        )}
      </span>
    );
  }},
  { key: 'MRR / Revenue', label: 'MRR / Revenue' },
  { key: 'Status', label: 'Status' },
  { key: 'Lead Source', label: 'Lead Source' },
  { key: 'Months Active', label: 'Mo. Active' },
  { key: 'Attribution Type', label: 'Attribution', render: (val) => {
    if (!val || val === 'UNASSIGNED') return <span className="text-zinc-500">—</span>;
    return <StatusBadge status={val} />;
  }},
  { key: 'Direct Marketer', label: 'Assigned To', render: (val, row) => {
    const salesRep = row['Sales Rep'] || '';
    return val || salesRep || '—';
  }},
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
  const showBadge = label === 'Status' || label === 'Churn Risk' || label === 'Attribution Type';

  return (
    <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr] gap-2 sm:gap-3 border-b border-white/5 py-3 last:border-b-0">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-200">
        {showBadge ? <StatusBadge status={displayValue(value)} /> : displayValue(value)}
      </div>
    </div>
  );
}

const SELLER_OPTIONS_FOUNDER = { id: 'founder', name: 'Founder', role: 'Founder', commission_path: 'FOUNDER' };

export default function CustomersPage() {
  const { rows, loading, error } = useTabData('CUSTOMERS');
  const { rows: teamMembers = [] } = useTabData('PAYROLL_PEOPLE');
  const { refresh } = useSheetData();
  const showToast = useToast();
  const [selected, setSelected] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // Build seller options from team_members data
  const sellerOptions = useMemo(() => {
    const options = [];
    teamMembers.forEach(tm => {
      const name = tm['Person'] || tm['name'] || '';
      const role = tm['Role'] || tm['role'] || '';
      const path = tm['Commission Path'] || tm['commission_path'] || '';
      const id = tm.id || '';
      if (name && id) {
        options.push({ id, name, role, commission_path: path });
      }
    });
    options.push(SELLER_OPTIONS_FOUNDER);
    return options;
  }, [teamMembers]);

  const isUnassigned = (row) => {
    const attr = (row['Attribution Type'] || '').trim();
    return attr === '' || attr === 'UNASSIGNED';
  };

  const currentAssignment = (row) => {
    const attr = (row['Attribution Type'] || '').trim();
    const marketer = (row['Direct Marketer'] || '').trim();
    const salesRep = (row['Sales Rep'] || '').trim();
    if (attr === 'DIRECT' && marketer) return `${marketer} (Direct)`;
    if (attr === 'SALES' && salesRep) return `${salesRep} (Sales)`;
    if (attr === 'FOUNDER') return 'Founder';
    return null;
  };

  async function saveSeller() {
    if (!selectedSeller || !selected) return;
    setSaveStatus('saving');

    const seller = sellerOptions.find(s => s.id === selectedSeller);
    if (!seller) { setSaveStatus('error'); return; }

    const attributionType = seller.commission_path === 'DIRECT' ? 'DIRECT'
      : seller.commission_path === 'SALES' ? 'SALES'
      : 'FOUNDER';

    try {
      const res = await fetch('/api/assign-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-secret': 'INTELLIFLOW_OPS_2026' },
        body: JSON.stringify({
          customerId: selected.id,
          teamMemberId: seller.id,
          attributionType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      setSaveStatus('saved');
      showToast(`${seller.name} assigned to ${selected['Customer Name']}`, 'success');
      refresh();
      setTimeout(() => { setSaveStatus(''); setAssignOpen(false); setSelectedSeller(''); }, 1200);
    } catch (err) {
      setSaveStatus('error');
      showToast('Assignment failed — ' + err.message, 'error');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  }

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
    <div className="space-y-6 px-6 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">Customer records. Click any row to open the full customer drawer.</p>
        <button
          type="button"
          onClick={async () => {
            const r = await fetch('/api/export?table=customers&format=csv', { headers: { 'x-api-secret': 'INTELLIFLOW_OPS_2026' } });
            const blob = await r.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `intelliflow-customers-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="shrink-0 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          Export CSV
        </button>
      </div>

      {loading && !rows.length && <SkeletonTable rows={6} cards={4} />}
      {error && <ErrorBanner message={error} />}

      {!loading && (
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
        onClose={() => { setSelected(null); setAssignOpen(false); setSelectedSeller(''); setSaveStatus(''); }}
        title={selected?.['Customer Name'] || 'Customer Detail'}
      >
        {selected && (
          <div className="space-y-8">
            {/* Seller Assignment Section */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Seller Assignment
              </h3>
              <div className="rounded-2xl p-4 space-y-3"
                style={{
                  background: isUnassigned(selected) ? 'rgba(249,115,22,0.06)' : 'rgba(6,182,212,0.04)',
                  border: `1px solid ${isUnassigned(selected) ? 'rgba(249,115,22,0.2)' : 'rgba(6,182,212,0.15)'}`,
                }}>
                {currentAssignment(selected) ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-zinc-500">Currently assigned to</div>
                      <div className="text-sm font-medium text-white mt-0.5">{currentAssignment(selected)}</div>
                    </div>
                    <StatusBadge status={selected['Attribution Type']} />
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No seller assigned. Select one to activate commission tracking.</p>
                )}

                {!assignOpen ? (
                  <button
                    onClick={() => setAssignOpen(true)}
                    className="w-full rounded-xl py-2.5 text-sm font-medium transition-all"
                    style={{
                      background: isUnassigned(selected) ? 'rgba(249,115,22,0.12)' : 'rgba(6,182,212,0.08)',
                      border: `1px solid ${isUnassigned(selected) ? 'rgba(249,115,22,0.3)' : 'rgba(6,182,212,0.2)'}`,
                      color: isUnassigned(selected) ? '#fb923c' : '#67e8f9',
                    }}
                  >
                    {currentAssignment(selected) ? 'Reassign Seller' : 'Assign Seller'}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {sellerOptions.map(seller => {
                        const isSelected = selectedSeller === seller.id;
                        const pathColor = seller.commission_path === 'DIRECT'
                          ? { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.3)', text: '#67e8f9' }
                          : seller.commission_path === 'SALES'
                          ? { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)', text: '#c4b5fd' }
                          : { bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.3)', text: '#a1a1aa' };

                        return (
                          <button
                            key={seller.id}
                            type="button"
                            onClick={() => setSelectedSeller(seller.id)}
                            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-left transition-all"
                            style={{
                              background: isSelected ? pathColor.bg : 'rgba(0,0,0,0.2)',
                              border: `1px solid ${isSelected ? pathColor.border : 'rgba(255,255,255,0.06)'}`,
                              color: isSelected ? pathColor.text : '#a1a1aa',
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0"
                                style={{ background: pathColor.bg, border: `1px solid ${pathColor.border}`, color: pathColor.text }}>
                                {seller.name[0]}
                              </div>
                              <div>
                                <div className="font-medium" style={{ color: isSelected ? '#fff' : '#d4d4d8' }}>{seller.name}</div>
                                <div className="text-[10px] mt-0.5" style={{ color: pathColor.text }}>
                                  {seller.commission_path === 'DIRECT' ? 'Marketer · 5% lifetime'
                                    : seller.commission_path === 'SALES' ? 'Sales · 20% months 1-6'
                                    : 'Founder · No commission'}
                                </div>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-xs font-medium" style={{ color: pathColor.text }}>Selected</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveSeller}
                        disabled={!selectedSeller || saveStatus === 'saving'}
                        className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
                        style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}
                      >
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? 'Error — retry' : 'Confirm Assignment'}
                      </button>
                      <button
                        onClick={() => { setAssignOpen(false); setSelectedSeller(''); setSaveStatus(''); }}
                        className="rounded-xl px-4 py-2.5 text-sm text-zinc-500 transition hover:text-zinc-300"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

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

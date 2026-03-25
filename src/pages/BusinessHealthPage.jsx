import { useMemo } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import { useSheetData } from '../hooks/useSheetData.jsx';
import KpiCard from '../components/KpiCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function fmt(v, prefix = '', suffix = '') {
  const n = parseFloat(String(v || '0').replace(/[^0-9.-]/g, ''));
  if (!isFinite(n)) return '—';
  return prefix + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
}

function pct(v) {
  const n = parseFloat(String(v || '0').replace(/[^0-9.%]/g, ''));
  return isFinite(n) ? n.toFixed(1) + '%' : '—';
}

function HealthMetric({ label, value, target, description, status }) {
  const colors = {
    good: { text: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
    warn: { text: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
    bad:  { text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
    none: { text: '#71717a', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' },
  };
  const col = colors[status] || colors.none;

  return (
    <div className="rounded-[20px] p-5 space-y-3"
      style={{ background: col.bg, border: `1px solid ${col.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 mb-1">{label}</div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: col.text }}>{value}</div>
        </div>
        {target && (
          <div className="shrink-0 rounded-xl px-2.5 py-1 text-[10px] text-zinc-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            Target: {target}
          </div>
        )}
      </div>
      {description && <p className="text-xs text-zinc-500 leading-5">{description}</p>}
    </div>
  );
}

export default function BusinessHealthPage() {
  const { data, loading } = useSheetData();

  const metrics = useMemo(() => {
    const customers = data?.CUSTOMERS || [];
    const ledger = data?.COMMISSION_LEDGER || [];
    const campaigns = data?.CAMPAIGNS || [];

    const active = customers.filter(r => (r['Status'] || '').trim() === 'Active');
    const churned = customers.filter(r => (r['Status'] || '').trim() === 'Churned');
    const atRisk = customers.filter(r => (r['Status'] || '').trim() === 'At Risk');
    const total = customers.filter(r => r['Customer Name']);

    const totalCount = total.length;
    const activeCount = active.length;
    const churnedCount = churned.length;

    // Churn rate
    const churnRate = totalCount > 0 ? (churnedCount / totalCount) * 100 : 0;

    // MRR
    const mrr = active.reduce((s, r) => {
      const v = parseFloat(String(r['MRR / Revenue'] || '0').replace(/[^0-9.-]/g, ''));
      return s + (isFinite(v) ? v : 0);
    }, 0);

    // LTV — avg months active × MRR per customer
    const avgMonths = active.length > 0
      ? active.reduce((s, r) => {
          const v = parseFloat(String(r['Months Active'] || '0').replace(/[^0-9.-]/g, ''));
          return s + (isFinite(v) ? v : 0);
        }, 0) / active.length
      : 0;
    const avgMRR = activeCount > 0 ? mrr / activeCount : 0;
    const ltv = avgMonths * avgMRR;

    // CAC from campaigns
    const totalSpend = campaigns.reduce((s, r) => {
      const v = parseFloat(String(r['Spend'] || '0').replace(/[^0-9.-]/g, ''));
      return s + (isFinite(v) ? v : 0);
    }, 0);
    const totalClosed = campaigns.reduce((s, r) => {
      const v = parseFloat(String(r['Customers Won'] || '0').replace(/[^0-9.-]/g, ''));
      return s + (isFinite(v) ? v : 0);
    }, 0);
    const cac = totalClosed > 0 ? totalSpend / totalClosed : 0;

    // CAC payback
    const cacPayback = avgMRR > 0 && cac > 0 ? cac / (avgMRR * 0.85) : 0;

    // LTV:CAC
    const ltvCac = cac > 0 ? ltv / cac : 0;

    // Net revenue churn — commissions paid out vs MRR
    const totalCommissions = ledger.reduce((s, r) => {
      const v = parseFloat(String(r['Commission Total'] || '0').replace(/[^0-9.-]/g, ''));
      return s + (isFinite(v) ? v : 0);
    }, 0);
    const grossMargin = mrr > 0 ? ((mrr - totalCommissions) / mrr) * 100 : 0;

    return {
      activeCount, churnedCount, atRisk: atRisk.length,
      churnRate, mrr, ltv, cac, cacPayback, ltvCac, grossMargin, avgMonths,
      totalSpend, totalClosed,
    };
  }, [data]);

  if (loading && !data) return <div className="px-6 py-6"><LoadingSpinner label="Loading health metrics..." /></div>;

  const churnStatus = metrics.churnRate === 0 ? 'none' : metrics.churnRate < 5 ? 'good' : metrics.churnRate < 10 ? 'warn' : 'bad';
  const cacPaybackStatus = metrics.cacPayback === 0 ? 'none' : metrics.cacPayback < 6 ? 'good' : metrics.cacPayback < 12 ? 'warn' : 'bad';
  const ltvCacStatus = metrics.ltvCac === 0 ? 'none' : metrics.ltvCac > 3 ? 'good' : metrics.ltvCac > 1 ? 'warn' : 'bad';
  const marginStatus = metrics.grossMargin === 0 ? 'none' : metrics.grossMargin > 80 ? 'good' : metrics.grossMargin > 60 ? 'warn' : 'bad';

  return (
    <div className="space-y-8 px-6 py-6">
      <div>
        <p className="text-sm text-zinc-400">Long-term business health indicators — auto-calculated from your live data.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Active Clients', value: metrics.activeCount, color: 'success' },
          { label: 'At Risk', value: metrics.atRisk, color: 'warning' },
          { label: 'Churned', value: metrics.churnedCount, color: 'danger' },
          { label: 'Avg Months Active', value: metrics.avgMonths.toFixed(1), color: 'info' },
        ].map(k => (
          <KpiCard key={k.label} label={k.label} value={k.value} color={k.color} />
        ))}
      </div>

      {/* Health metrics grid */}
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-4">Core Health Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <HealthMetric
            label="Customer Churn Rate"
            value={metrics.churnRate === 0 ? '0.0%' : pct(metrics.churnRate)}
            target="< 5% / month"
            description="Percentage of total customers lost. Under 5% is healthy for a growing SaaS."
            status={churnStatus}
          />
          <HealthMetric
            label="Gross Margin"
            value={metrics.grossMargin === 0 ? '—' : pct(metrics.grossMargin)}
            target="> 80%"
            description="Revenue minus commission payouts divided by revenue. Reflects true profitability."
            status={marginStatus}
          />
          <HealthMetric
            label="MRR"
            value={metrics.mrr === 0 ? '$0' : fmt(metrics.mrr, '$')}
            target="Growing"
            description="Monthly recurring revenue from all active customers."
            status={metrics.mrr > 0 ? 'good' : 'none'}
          />
          <HealthMetric
            label="Customer LTV"
            value={metrics.ltv === 0 ? '—' : fmt(metrics.ltv, '$')}
            target="Maximize"
            description="Average months active × average MRR. Grows as retention improves."
            status={metrics.ltv > 0 ? 'good' : 'none'}
          />
          <HealthMetric
            label="CAC"
            value={metrics.cac === 0 ? '—' : fmt(metrics.cac, '$')}
            target="Minimize"
            description="Total ad spend divided by customers won. Lower is better."
            status={metrics.cac === 0 ? 'none' : metrics.cac < 500 ? 'good' : metrics.cac < 1000 ? 'warn' : 'bad'}
          />
          <HealthMetric
            label="CAC Payback"
            value={metrics.cacPayback === 0 ? '—' : metrics.cacPayback.toFixed(1) + ' mo'}
            target="< 6 months"
            description="Months to recover customer acquisition cost at 85% gross margin."
            status={cacPaybackStatus}
          />
          <HealthMetric
            label="LTV : CAC"
            value={metrics.ltvCac === 0 ? '—' : metrics.ltvCac.toFixed(1) + 'x'}
            target="> 3x"
            description="Lifetime value divided by acquisition cost. Above 3x means sustainable growth."
            status={ltvCacStatus}
          />
          <HealthMetric
            label="At Risk Accounts"
            value={metrics.atRisk}
            target="0"
            description="Customers flagged as At Risk. Each one needs a retention action."
            status={metrics.atRisk === 0 ? 'good' : metrics.atRisk < 3 ? 'warn' : 'bad'}
          />
        </div>
      </section>

      <p className="text-[10px] text-zinc-600">All metrics auto-calculated from Customers, Campaigns, and Commission_Ledger tabs. No manual input required.</p>
    </div>
  );
}

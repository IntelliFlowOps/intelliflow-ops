import React from 'react';
import { useMemo, useState } from 'react';
import { useTabData, useSheetData } from '../hooks/useSheetData.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner, { SkeletonKPIs } from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!target || isNaN(parseFloat(target))) return;
    const num = parseFloat(String(target).replace(/[^0-9.-]/g, ''));
    if (!isFinite(num) || num === 0) { setValue(target); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = num * eased;
      if (progress < 1) {
        setValue(String(target).includes('$') ? '$' + current.toFixed(2) : String(target).includes('%') ? current.toFixed(1) + '%' : Math.round(current));
        requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    requestAnimationFrame(tick);
  }, [target]);
  return value || target;
}

export default function DashboardPage() {
  const { rows: dashboard, loading, error } = useTabData('DASHBOARD');
  const [showGoalActions, setShowGoalActions] = useState(false);
  const [goalDismissed, setGoalDismissed] = useState(false);

  const safeDashboard =
    dashboard && typeof dashboard === 'object' ? dashboard : {};

  const kpis =
    safeDashboard.kpis && typeof safeDashboard.kpis === 'object'
      ? safeDashboard.kpis
      : {};

  const marketing =
    safeDashboard.marketing && typeof safeDashboard.marketing === 'object'
      ? safeDashboard.marketing
      : {};

  const watchlist = Array.isArray(safeDashboard.watchlist)
    ? safeDashboard.watchlist
    : [];

  const lastUpdated = safeDashboard.lastUpdated || null;

  const { rows: ledgerRows = [] } = useTabData('COMMISSION_LEDGER');
  const { rows: customerRows = [] } = useTabData('CUSTOMERS');
  const { rows: campaignRows = [] } = useTabData('CAMPAIGNS');

  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'));
    }
    const rev = {}, comm = {}, cust = {}, spend = {};
    ledgerRows.forEach(row => {
      const mo = String(row['Date'] || '').slice(0, 7);
      if (!mo) return;
      const r = parseFloat(String(row['Revenue Collected'] || '0').replace(/[^0-9.-]/g, '')) || 0;
      const co = (parseFloat(String(row['Emma Commission'] || '0').replace(/[^0-9.-]/g, '')) || 0)
               + (parseFloat(String(row['Wyatt Commission'] || '0').replace(/[^0-9.-]/g, '')) || 0)
               + (parseFloat(String(row['Sales Commission'] || '0').replace(/[^0-9.-]/g, '')) || 0);
      rev[mo] = (rev[mo] || 0) + r;
      comm[mo] = (comm[mo] || 0) + co;
    });
    customerRows.forEach(row => {
      const mo = String(row['Close Date'] || row['Onboard Date'] || '').slice(0, 7);
      if (mo) cust[mo] = (cust[mo] || 0) + 1;
    });
    campaignRows.forEach(row => {
      const mo = String(row['Date'] || '').slice(0, 7);
      if (!mo) return;
      const s = parseFloat(String(row['Spend'] || '0').replace(/[^0-9.-]/g, '')) || 0;
      spend[mo] = (spend[mo] || 0) + s;
    });
    return {
      revenue: months.map(m => rev[m] || 0),
      commissions: months.map(m => comm[m] || 0),
      customers: months.map(m => cust[m] || 0),
      adSpend: months.map(m => spend[m] || 0),
    };
  }, [ledgerRows, customerRows, campaignRows]);

  const trendPct = useMemo(() => {
    const pct = arr => {
      const v = arr.filter(x => x > 0);
      if (v.length < 2) return null;
      const p = v[v.length - 2], cur = v[v.length - 1];
      return p === 0 ? null : Math.round(((cur - p) / p) * 100);
    };
    return {
      revenue: pct(monthlyTrends.revenue),
      commissions: pct(monthlyTrends.commissions),
      customers: pct(monthlyTrends.customers),
      adSpend: pct(monthlyTrends.adSpend),
    };
  }, [monthlyTrends]);

  const trendLabel = (pct) => pct === null ? null : (pct >= 0 ? '+' + pct + '% vs last month' : pct + '% vs last month');

  const activeCustomers = safeNumber(kpis['Active Customers']);
  const revenue = safeCurrency(kpis['Total Revenue']);
  const mrr = safeCurrency(kpis['MRR']);
  const adSpend = safeCurrency(kpis['Ad Spend (MTD)']);
  const leads = safeNumber(marketing['Leads (MTD)']);
  const customersWon = safeNumber(marketing['Customers Won (MTD)']);
  const cac = marketing['CAC'];
  const costPerLead = marketing['Cost / Lead'];
  const blendedCtr = marketing['Blended CTR'];
  const blendedCloseRate = marketing['Blended Close Rate'];

  const goal = useMemo(() => {
    return buildMonthlyGoal({
      activeCustomers,
      revenue,
      mrr,
      adSpend,
      leads,
      customersWon,
      cac,
      costPerLead,
      blendedCtr,
      blendedCloseRate,
      watchlist,
    });
  }, [
    activeCustomers,
    revenue,
    mrr,
    adSpend,
    leads,
    customersWon,
    cac,
    costPerLead,
    blendedCtr,
    blendedCloseRate,
    watchlist,
  ]);

  const founderKpis = [
    {
      label: 'Total Revenue',
      value: kpis['Total Revenue'],
      color: 'accent',
      sparkData: monthlyTrends.revenue,
      subtitle: trendLabel(trendPct.revenue),
      info:
        'What it means: total revenue shown on the Dashboard tab.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Active Customers',
      value: kpis['Active Customers'],
      color: 'info',
      sparkData: monthlyTrends.customers,
      subtitle: trendLabel(trendPct.customers),
      info:
        'What it means: current active paying clients.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'MRR',
      value: kpis['MRR'],
      color: 'accent',
      sparkData: monthlyTrends.revenue,
      subtitle: trendLabel(trendPct.revenue),
      info:
        'What it means: monthly recurring revenue.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Ad Spend (MTD)',
      value: kpis['Ad Spend (MTD)'],
      color: 'warning',
      sparkData: monthlyTrends.adSpend,
      subtitle: trendLabel(trendPct.adSpend),
      info:
        'What it means: month-to-date ad spend.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Commissions (MTD)',
      value: kpis['Total Commissions (MTD)'],
      color: 'zinc',
      sparkData: monthlyTrends.commissions,
      subtitle: trendLabel(trendPct.commissions),
      info:
        'What it means: total commissions for the current month.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Net Profit (MTD)',
      value: kpis['Net Profit (MTD)'],
      color: 'success',
      sparkData: monthlyTrends.revenue.map((r,i) => r - (monthlyTrends.adSpend[i]||0) - (monthlyTrends.commissions[i]||0)),
      subtitle: trendLabel(trendPct.revenue),
      info:
        'What it means: month-to-date net profit.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
  ];

  const marketingKpis = [
    {
      label: 'Leads (MTD)',
      value: marketing['Leads (MTD)'],
      color: 'info',
      info:
        'What it means: total leads generated this month.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Marketing Snapshot section.',
    },
    {
      label: 'Customers Won (MTD)',
      value: marketing['Customers Won (MTD)'],
      color: 'success',
      info:
        'What it means: customers closed this month.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Marketing Snapshot section.',
    },
    {
      label: 'CAC',
      value: marketing['CAC'],
      color: 'warning',
      info:
        'What it means: customer acquisition cost.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Marketing Snapshot section.',
    },
    {
      label: 'Cost / Lead',
      value: marketing['Cost / Lead'],
      color: 'zinc',
      info:
        'What it means: average cost per lead.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Marketing Snapshot section.',
    },
    {
      label: 'Blended CTR',
      value: marketing['Blended CTR'],
      color: 'accent',
      info:
        'What it means: blended click-through rate.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Marketing Snapshot section.',
    },
    {
      label: 'Blended Close Rate',
      value: marketing['Blended Close Rate'],
      color: 'accent',
      info:
        'What it means: blended lead-to-close rate.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Marketing Snapshot section.',
    },
  ];

  if (loading && !dashboard) return <div className='space-y-6 px-6 py-6'><SkeletonKPIs count={6} /><SkeletonKPIs count={6} /></div>;
  if (error) return <ErrorBanner message={error} />;
  if (!dashboard || (!safeDashboard.kpis && !safeDashboard.marketing)) {
    return <EmptyState message="Dashboard data not available yet" />;
  }

  return (
    <div className="space-y-6 px-6 py-6">
      {lastUpdated && (
        <p className="text-xs text-zinc-500">Sheet last updated: {lastUpdated}</p>
      )}

      <section className={`relative overflow-hidden rounded-[24px] px-4 py-4 backdrop-blur-2xl transition-all duration-700 ${
        goal.isHit && !goalDismissed
          ? 'ring-1 ring-cyan-400/30'
          : 'bg-white/[0.035]'
      }`}
        style={goal.isHit && !goalDismissed ? {
          background: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(2,132,199,0.08), rgba(16,185,129,0.06))",
          boxShadow: "0 0 60px rgba(6,182,212,0.12), 0 10px 30px rgba(0,0,0,0.2)"
        } : {boxShadow: "0 10px 30px rgba(0,0,0,0.16)"}}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.07),transparent_28%)]" />

        {goal.isHit && !goalDismissed && (
          <div className="relative z-[1] mb-4 rounded-[18px] px-4 py-4 flex items-center justify-between gap-4"
            style={{background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.1))", border: "1px solid rgba(6,182,212,0.25)"}}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
                style={{background: "linear-gradient(135deg, #0891b2, #10b981)", boxShadow: "0 0 20px rgba(6,182,212,0.3)"}}>
                ✓
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Milestone Reached</div>
                <div className="text-xs text-cyan-300/80 mt-0.5">Next target is now unlocked. Keep pushing.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGoalDismissed(true)}
              className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-80"
              style={{background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 2px 12px rgba(6,182,212,0.3)"}}>
              Move to Next Goal →
            </button>
          </div>
        )}

        <div className="relative z-[1] flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/65">Current Goal</span>
              {goal.badge && (
                <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-slate-400">{goal.badge}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-base font-semibold text-white tracking-tight">
                {goal.title}
              </h2>
              <span className="rounded-full bg-cyan-400/[0.08] px-3 py-1 text-xs text-cyan-100">
                {goal.currentLabel} / {goal.targetLabel}
              </span>
              <span className="text-xs text-zinc-400">{goal.progressText}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full min-w-[150px] xl:w-[220px]">
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                <div
                  className={`h-full rounded-full ${
                    goal.isHit
                      ? 'bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-400'
                      : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${goal.progressPercent}%`, transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                />
              </div>
              <div className="mt-1 text-right text-[11px] text-zinc-400">
                {goal.progressPercent}% complete
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGoalActions((prev) => !prev)}
              className="shrink-0 rounded-full bg-cyan-400/[0.10] px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-400/[0.16]"
            >
              {showGoalActions ? 'Hide Plan' : 'Show Plan'}
            </button>
          </div>
        </div>

        {showGoalActions && (
          <div className="relative z-[1] mt-4 rounded-[20px] bg-white/[0.03] p-4 backdrop-blur-2xl">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-cyan-200/65">
              How to get there
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {goal.actions.map((action, index) => (
                <div
                  key={index}
                  className="rounded-[18px] bg-[#121a2d]/55 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
                >
                  <div className="mb-2 text-sm font-semibold text-white">
                    {action.title}
                  </div>
                  <div className="text-sm leading-6 text-zinc-400">
                    {action.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="section-title mb-3">Founder / Executive KPIs</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {founderKpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              color={kpi.color}
              info={kpi.info}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Marketing Snapshot</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {marketingKpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              color={kpi.color}
              info={kpi.info}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Daily Operations Watchlist</h2>
        {watchlist.length > 0 ? (
          <DataTable
            rows={watchlist}
            columns={[
              { key: 'Priority', label: 'Priority' },
              { key: 'Owner', label: 'Owner' },
              { key: 'Entity', label: 'Entity' },
              { key: 'Current Value', label: 'Current Value' },
              { key: 'Target / Rule', label: 'Target / Rule' },
              { key: 'Status', label: 'Status' },
              { key: 'Action Needed', label: 'Action Needed' },
              { key: 'Notes', label: 'Notes' },
            ]}
            searchable={false}
            emptyMessage="No items on the watchlist"
          />
        ) : (
          <EmptyState message="No items on the watchlist yet" />
        )}
      </section>
    </div>
  );
}

function buildMonthlyGoal({
  activeCustomers, revenue, mrr, adSpend, leads, customersWon,
  cac, costPerLead, blendedCtr, blendedCloseRate, watchlist,
}) {
  const MILESTONES = [10, 25, 50, 100, 150, 200];
  const avgMRRPerClient = activeCustomers > 0 && mrr > 0 ? Math.round(mrr / activeCustomers) : 399;
  const target = MILESTONES.find(m => m > activeCustomers) ||
    MILESTONES[MILESTONES.length - 1] + Math.ceil((activeCustomers - MILESTONES[MILESTONES.length - 1]) / 50) * 50;
  const progressPercent = clampPercent((activeCustomers / Math.max(target, 1)) * 100);
  const remainingClients = Math.max(target - activeCustomers, 0);
  const mrrAtTarget = target * avgMRRPerClient;
  const currentMRR = mrr || (activeCustomers * avgMRRPerClient);
  const mrrGap = Math.max(0, mrrAtTarget - currentMRR);

  const milestoneCtx = {
    10:  { badge: 'Early Traction',    subtitle: 'First 10 paying clients — proof of concept' },
    25:  { badge: 'Product-Market Fit', subtitle: 'Consistent revenue — $10k+ MRR territory' },
    50:  { badge: 'Growth Mode',        subtitle: 'Scaling operations — hire or automate' },
    100: { badge: 'Real Business',      subtitle: 'Six-figure ARR — S-Corp election time' },
    150: { badge: 'Market Leader',      subtitle: 'Dominant presence in your niche' },
    200: { badge: 'Scale',              subtitle: 'Enterprise-grade client base' },
  };
  const ctx = milestoneCtx[target] || { badge: 'Next Level', subtitle: `${target} active clients` };

  const actions = [];

  // Action 1 — client count with real dollar impact
  if (remainingClients > 0) {
    const dailyTarget = Math.ceil(remainingClients / 30);
    actions.push({
      title: `Close ${remainingClients} more client${remainingClients === 1 ? '' : 's'}`,
      text: `You need ${remainingClients} more to hit ${target} active clients${mrrGap > 0 ? ` — worth ~$${mrrGap.toLocaleString()}/mo in new MRR` : ''}. That is roughly ${dailyTarget} new client${dailyTarget === 1 ? '' : 's'} per day this month.`,
    });
  } else {
    const nextMilestone = MILESTONES.find(m => m > activeCustomers) || target + 50;
    actions.push({
      title: `${target} hit — push to ${nextMilestone}`,
      text: `You have reached ${target} active clients. The next milestone is ${nextMilestone} — worth $${(nextMilestone * avgMRRPerClient).toLocaleString()}/mo MRR. Do not coast.`,
    });
  }

  // Action 2 — based on real lead and conversion data
  const closeRateNum = parseFloat(String(blendedCloseRate || '0').replace(/[^0-9.]/g, ''));
  if (customersWon > 0 && leads > 0) {
    const efficiency = ((customersWon / leads) * 100).toFixed(1);
    actions.push({
      title: 'Double down on what is converting',
      text: `${customersWon} client${customersWon === 1 ? '' : 's'} closed from ${leads} leads this month — ${efficiency}% close rate. Find the campaigns producing these closes and shift more budget there.`,
    });
  } else if (leads > 0) {
    const leadsNeeded = closeRateNum > 0 ? Math.ceil(remainingClients / (closeRateNum / 100)) : null;
    actions.push({
      title: 'Convert your existing lead flow',
      text: `${leads} leads in the pipeline but not enough closes yet.${leadsNeeded ? ` At a 10% close rate you need ~${leadsNeeded} leads to hit ${target}.` : ''} Tighten follow-up speed and offer clarity before adding more spend.`,
    });
  } else {
    actions.push({
      title: 'Build your lead engine first',
      text: `No lead data yet. Focus entirely on generating consistent inbound — strong hooks targeting missed calls, clear pain, specific niche. Once leads flow, close rate becomes the lever.`,
    });
  }

  // Action 3 — watchlist, efficiency, or stage-specific advice
  const urgentItem = Array.isArray(watchlist)
    ? watchlist.find(i => ['Issue', 'Watch', 'At Risk', 'Needs Review'].includes(String(i.Status || '').trim()))
    : null;

  if (urgentItem) {
    actions.push({
      title: 'Clear the active blocker first',
      text: `Your watchlist flags an issue with ${urgentItem.Entity || 'a key item'}. Unresolved operational problems compound as you scale — fix this before it slows client growth.`,
    });
  } else if (adSpend > 0 && activeCustomers === 0) {
    actions.push({
      title: 'Get your first paying client',
      text: `You are spending on ads but have no active clients yet. Pause optimization — focus entirely on closing one client. Everything else is secondary until you have proof the offer converts.`,
    });
  } else if (adSpend > currentMRR && activeCustomers < 25) {
    actions.push({
      title: 'Spend is outpacing revenue',
      text: `You are spending more on ads than you collect in MRR. Normal at this stage but it should compress fast. Close more clients before increasing budget further.`,
    });
  } else if (activeCustomers >= 10) {
    actions.push({
      title: 'Retention is now as important as acquisition',
      text: `With ${activeCustomers} active clients, churn starts to matter. One churned client cancels one new close. Make sure every client is getting results and hearing from you regularly.`,
    });
  } else {
    actions.push({
      title: 'Speed is your only advantage right now',
      text: `At this stage the founder who moves fastest wins. Follow up within minutes, close on the first call when possible, and treat every lead like it is your last.`,
    });
  }

  return {
    title: `Reach ${target} Active Clients`,
    badge: ctx.badge,
    subtitle: ctx.subtitle,
    currentLabel: `${activeCustomers}`,
    targetLabel: `${target}`,
    progressPercent,
    isHit: activeCustomers >= target,
    progressText: remainingClients > 0
      ? `${remainingClients} to go · ~$${mrrGap.toLocaleString()}/mo MRR unlocked`
      : 'Milestone hit — next target unlocked',
    actions: actions.slice(0, 3),
  };
}


function safeNumber(value) {
  const raw = String(value ?? '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : 0;
}

function safeCurrency(value) {
  const raw = String(value ?? '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : 0;
}

function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isLowRate(value) {
  const num = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) && num > 0 && num < 3;
}

function looksHighMoney(value) {
  const num = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) && num >= 500;
}

import { useMemo, useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import KpiCard from '../components/KpiCard.jsx';
import DataTable from '../components/DataTable.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const { rows: dashboard, loading, error } = useTabData('DASHBOARD');
  const [showGoalActions, setShowGoalActions] = useState(false);

  if (loading && !dashboard) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!dashboard || (!dashboard.kpis && !dashboard.marketing)) {
    return <EmptyState message="Dashboard data not available yet" />;
  }

  const { kpis = {}, marketing = {}, watchlist = [], lastUpdated } = dashboard;

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
      info:
        'What it means: total revenue shown on the Dashboard tab.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Active Customers',
      value: kpis['Active Customers'],
      color: 'info',
      info:
        'What it means: current active paying clients.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'MRR',
      value: kpis['MRR'],
      color: 'accent',
      info:
        'What it means: monthly recurring revenue.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Ad Spend (MTD)',
      value: kpis['Ad Spend (MTD)'],
      color: 'warning',
      info:
        'What it means: month-to-date ad spend.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Commissions (MTD)',
      value: kpis['Total Commissions (MTD)'],
      color: 'zinc',
      info:
        'What it means: total commissions for the current month.\nHow it is calculated: mirrored directly from Google Sheets.\nSource: Dashboard tab → Founder KPIs section.',
    },
    {
      label: 'Net Profit (MTD)',
      value: kpis['Net Profit (MTD)'],
      color: 'success',
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

  return (
    <div className="space-y-6 fade-in">
      {lastUpdated && (
        <p className="text-xs text-zinc-500">Sheet last updated: {lastUpdated}</p>
      )}

      <section className="card p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_28%)] pointer-events-none"></div>

        <div className="relative z-[1]">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/70 mb-2">
                  Current Goal
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    {goal.title}
                  </h2>
                  <span className="rounded-full border border-cyan-300/12 bg-cyan-400/[0.08] px-3 py-1 text-xs text-cyan-100">
                    {goal.currentLabel} / {goal.targetLabel}
                  </span>
                  <span className="text-xs text-zinc-400">{goal.progressText}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-full min-w-[180px] lg:w-[220px]">
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden border border-white/8">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${goal.progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-[11px] text-zinc-400">
                    {goal.progressPercent}% complete
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoalActions((prev) => !prev)}
                  className="shrink-0 rounded-full border border-cyan-300/14 bg-cyan-400/[0.08] px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-400/[0.14]"
                >
                  {showGoalActions ? 'Hide Plan' : 'Show Plan'}
                </button>
              </div>
            </div>
          </div>

          {showGoalActions && (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-200/70 mb-3">
                How to get there
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {goal.actions.map((action, index) => (
                  <div
                    key={index}
                    className="rounded-[20px] border border-white/10 bg-[#121a2d]/70 p-4"
                  >
                    <div className="text-sm font-semibold text-white mb-2">
                      {action.title}
                    </div>
                    <div className="text-sm text-zinc-400 leading-6">
                      {action.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="section-title mb-3">Founder / Executive KPIs</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
}) {
  const baseTarget = 25;
  let target = baseTarget;

  if (activeCustomers >= baseTarget) {
    target = Math.ceil((activeCustomers + 5) / 5) * 5;
  }

  const progressPercent = clampPercent((activeCustomers / Math.max(target, 1)) * 100);
  const remainingClients = Math.max(target - activeCustomers, 0);

  const actions = [];

  if (remainingClients > 0) {
    actions.push({
      title: `Close the next ${remainingClients}`,
      text: `Everything should point at paying clients, not just more traffic. Use your best current angle and strongest offer to move from ${activeCustomers} to ${target} active clients.`,
    });
  } else {
    actions.push({
      title: 'Raise the target immediately',
      text: `This goal is already hit. The next milestone is ${target}. Keep pressure on profitable client acquisition instead of coasting.`,
    });
  }

  if (customersWon > 0 && leads > 0) {
    actions.push({
      title: 'Lean into what is already converting',
      text: `${customersWon} customers have been won from ${leads} leads this month. Double down on the campaigns, niches, and offers already producing closes instead of spreading budget evenly.`,
    });
  } else if (leads > 0) {
    actions.push({
      title: 'Turn leads into paying clients',
      text: `You have lead flow but not enough closed customers yet. Tighten follow-up speed, qualification, and landing page clarity so leads become paying clients faster.`,
    });
  } else {
    actions.push({
      title: 'Increase qualified lead flow',
      text: `Lead volume is still thin. Focus on stronger hooks, clearer pain points, and service-business specific offers to generate better inbound demand.`,
    });
  }

  if (isLowRate(blendedCloseRate)) {
    actions.push({
      title: 'Fix close rate before adding more spend',
      text: `Close rate looks weak relative to the goal. Improve offer clarity, lead quality, and sales follow-up before scaling ad spend harder.`,
    });
  } else if (isLowRate(blendedCtr)) {
    actions.push({
      title: 'Improve click-through rate',
      text: `CTR looks soft. Refresh hooks, call out missed-call pain harder, and make the ad angle more specific to the niche you’re targeting.`,
    });
  } else if (looksHighMoney(cac)) {
    actions.push({
      title: 'Protect acquisition efficiency',
      text: `CAC appears expensive. Move spend toward the campaigns with the best lead quality and fastest path to real paying clients.`,
    });
  } else if (looksHighMoney(costPerLead)) {
    actions.push({
      title: 'Lower cost per lead',
      text: `Cost per lead looks heavy. Tighten targeting and sharpen creatives before adding more budget.`,
    });
  } else {
    actions.push({
      title: 'Scale what is efficient',
      text: `Your current metrics do not show a major red flag. Put more budget behind what is already producing qualified leads and customers, not unproven experiments.`,
    });
  }

  if (Array.isArray(watchlist) && watchlist.length > 0) {
    const urgent = watchlist.find(
      (item) =>
        ['Issue', 'Watch', 'At Risk', 'Needs Review'].includes(String(item.Status || '').trim())
    );
    if (urgent) {
      actions[2] = {
        title: 'Clear the main blocker',
        text: `Your watchlist shows a live issue around ${urgent.Entity || 'an important item'}. Fix that first so it does not slow progress toward ${target} active clients.`,
      };
    }
  }

  return {
    title: `Reach ${target} Active Clients`,
    reason: `Active clients is the clearest operator metric for IntelliFlow right now because the business goal is to reach 25 paying clients. This goal automatically scales up once the current target is hit.`,
    currentLabel: `${activeCustomers}`,
    targetLabel: `${target}`,
    progressPercent,
    progressText:
      remainingClients > 0
        ? `${remainingClients} clients to go`
        : 'Goal reached — next target unlocked',
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

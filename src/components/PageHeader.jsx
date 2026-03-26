import { useLocation } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData.jsx';
import { useState, useEffect, useCallback } from 'react';

const PAGE_META = {
  '/': { title: 'Dashboard', subtitle: 'Live operations overview' },
  '/customers': { title: 'Clients', subtitle: 'One record per active client' },
  '/marketers': { title: 'My Pay', subtitle: 'Private payout access — PIN required' },
  '/campaigns': { title: 'Ad Campaigns', subtitle: 'Ad performance and spend tracking' },
  '/creative': { title: 'Creative Insights', subtitle: 'What is working and what to test next' },
  '/founder-assistant': { title: 'Founder Assistant', subtitle: 'Operator-level decisions and growth analysis' },
  '/marketer-assistant': { title: 'Marketer AI', subtitle: 'Campaign help, hooks, and ad builds' },
  '/ledger': { title: 'Ledger', subtitle: 'Full commission ledger — PIN required' },
  '/activity': { title: 'Client Activity', subtitle: 'Customer interaction timeline' },
  '/analytics': { title: 'Performance', subtitle: 'Campaign and ad performance data' },
  '/payroll': { title: 'Payroll', subtitle: 'Founder access only — contractor payments and tax tracking' },
  '/health': { title: 'Business Health', subtitle: 'Long-term metrics and retention indicators' },
  '/tax': { title: 'Tax Center', subtitle: 'Expenses, distributions, and tax reports — PIN required' },
  '/sales': { title: 'Sales Intelligence', subtitle: 'Your IntelliFlow sales expert — scripts, objections, pitches, strategy' },
};

function timeAgo(timestamp) {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function PageHeader() {
  const location = useLocation();
  const { lastUpdated, refreshing, refresh } = useSheetData();
  const [, forceUpdate] = useState(0);
  const [showUpdated, setShowUpdated] = useState(false);
  const prevRefreshing = useState(false);
  const meta = PAGE_META[location.pathname] || { title: 'IntelliFlow', subtitle: '' };

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!refreshing && lastUpdated) {
      setShowUpdated(true);
      const t = setTimeout(() => setShowUpdated(false), 2000);
      return () => clearTimeout(t);
    }
  }, [refreshing]);

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] bg-[#08131f]/60 px-6 py-4 backdrop-blur-2xl">
        <div>
          <h1 className="text-lg font-semibold text-white leading-none">{meta.title}</h1>
          {meta.subtitle && (
            <p className="mt-1 text-xs text-slate-400">{meta.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs transition-colors duration-300 ${showUpdated ? 'text-emerald-400' : 'text-slate-500'}`}>
            {showUpdated ? '✓ Updated' : `Updated ${timeAgo(lastUpdated)}`}
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-cyan-400/[0.08] hover:text-cyan-100 disabled:opacity-40"
          >
            <span className={refreshing ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Bottom right toast container */}
      <div id="toast-portal" className="fixed bottom-6 right-6 z-[500] flex flex-col gap-2 pointer-events-none" />
    </>
  );
}

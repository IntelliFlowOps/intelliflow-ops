import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSheetData } from '../hooks/useSheetData.jsx';
import { formatTimestamp } from '../utils/format.js';
import AlertBanner from '../components/AlertBanner.jsx';
import { AUTO_REFRESH_INTERVAL_MS } from '../config/sheets.js';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: GridIcon },
  { to: '/customers', label: 'Customers', icon: UsersIcon },
  { to: '/marketers', label: 'Marketers', icon: TrendingIcon },
  { to: '/campaigns', label: 'Campaigns', icon: MegaphoneIcon },
  { to: '/creative', label: 'Creative Insights', icon: SparklesIcon },
  { to: '/assistant', label: 'Ad Assistant', icon: SparklesIcon },
  { to: '/commissions', label: 'Commissions', icon: DollarIcon },
  { to: '/activity', label: 'Activity', icon: ActivityIcon },
  { to: '/analytics', label: 'Analytics', icon: ChartIcon },
  { to: '/rules', label: 'Rules', icon: BookIcon },
];

export default function AppLayout() {
  const { loading, isStale, lastUpdated, refresh, errors } = useSheetData();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentPage =
    NAV_ITEMS.find((item) => item.to === location.pathname)?.label || 'IntelliFlow Ops';

  const hasGlobalError = errors?._global;
  const autoRefreshLabel =
    AUTO_REFRESH_INTERVAL_MS && AUTO_REFRESH_INTERVAL_MS > 0
      ? `Auto-refreshes every ${Math.round(AUTO_REFRESH_INTERVAL_MS / 60000)}m`
      : null;

  return (
    <div className="flex h-screen overflow-hidden relative">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-72
          border-r border-white/10 backdrop-blur-2xl
          bg-[linear-gradient(180deg,rgba(10,17,35,0.92),rgba(7,11,20,0.92))]
          flex flex-col
          transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-24 flex items-center gap-4 px-5 border-b border-white/10">
          <div className="w-14 h-14 rounded-[20px] overflow-hidden bg-black/30 border border-white/10 shadow-2xl shadow-cyan-500/10 float-slow flex items-center justify-center">
            <img src="/logo.png" alt="IntelliFlow logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-[24px] leading-none font-semibold text-zinc-100 tracking-tight">IntelliFlow</div>
            <div className="text-[11px] mt-1 font-medium text-zinc-500 uppercase tracking-[0.24em]">
              Operations
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-[20px] text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'text-white border border-cyan-300/20 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 shadow-lg shadow-cyan-500/10'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent'
                }
              `}
            >
              <item.icon />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.22em]">Read-only dashboard</p>
          <p className="text-[10px] text-zinc-600">Source: Google Sheets</p>
          {autoRefreshLabel && <p className="text-[10px] text-zinc-600">{autoRefreshLabel}</p>}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <header className="h-24 flex items-center justify-between px-4 lg:px-8 border-b border-white/10 bg-[linear-gradient(180deg,rgba(9,17,34,0.78),rgba(5,9,18,0.55))] backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-2xl hover:bg-white/5 text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <div className="section-title mb-1">IntelliFlow workspace</div>
              <h1 className="page-title">{currentPage}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
              {isStale && (
                <span className="w-2 h-2 rounded-full bg-amber-400 pulse-subtle" title="Data may be stale" />
              )}
              <span>Updated {formatTimestamp(lastUpdated)}</span>
            </div>

            <button onClick={refresh} disabled={loading} className="btn-primary">
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Refresh Data</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="px-4 lg:px-8 flex-shrink-0">
          {isStale && (
            <div className="mt-4">
              <AlertBanner
                type="warning"
                message="Data may be stale. Click Refresh Data to get the latest."
                action={
                  <button onClick={refresh} className="text-amber-300 hover:text-amber-200 text-xs font-medium underline">
                    Refresh now
                  </button>
                }
              />
            </div>
          )}

          {hasGlobalError && (
            <div className="mt-4">
              <AlertBanner
                type="warning"
                message={`Connection issue: ${errors._global}. Showing last known data.`}
              />
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function GridIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import MobileNav from '../components/MobileNav.jsx';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/marketers', label: 'Individual Commissions' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/creative', label: 'Creative Insights' },
  { to: '/founder-assistant', label: 'Founder Assistant' },
  { to: '/marketer-assistant', label: 'Marketer Assistant' },
  { to: '/ledger', label: 'Ledger' },
  { to: '/activity', label: 'Activity' },
  { to: '/analytics', label: 'Analytics' },
];

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen w-full">
        <aside
          className={[
            'hidden md:flex md:shrink-0 md:flex-col bg-[#08131f]/72 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] transition-all duration-300',
            sidebarCollapsed ? 'md:w-[96px]' : 'md:w-[280px]',
          ].join(' ')}
        >
          <div className="px-4 py-5">
            <div className="rounded-[24px] bg-white/[0.03] px-4 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div
                className={[
                  'flex items-center transition-all duration-300',
                  sidebarCollapsed ? 'justify-center' : 'gap-4',
                ].join(' ')}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#0a1a2b]">
                  <img
                    src="/logo.png"
                    alt="IntelliFlow logo"
                    className="max-h-14 max-w-14 object-contain"
                  />
                </div>

                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <div className="truncate text-[28px] leading-none font-semibold tracking-tight text-white">
                      IntelliFlow
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">
                      Communications
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="flex h-10 min-w-[44px] items-center justify-center rounded-xl bg-white/[0.04] px-3 text-slate-300 transition hover:bg-cyan-400/[0.10] hover:text-cyan-100"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'block rounded-[18px] text-sm transition backdrop-blur-xl',
                    sidebarCollapsed ? 'px-2 py-3 text-center' : 'px-4 py-3',
                    isActive
                      ? 'bg-cyan-400/[0.10] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                      : 'bg-white/[0.025] text-slate-300 hover:bg-cyan-400/[0.06] hover:text-white',
                  ].join(' ')
                }
                title={sidebarCollapsed ? label : undefined}
              >
                {sidebarCollapsed ? (
                  <span className="block truncate text-[11px] font-medium">
                    {label
                      .split(' ')
                      .map((word) => word[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                ) : (
                  label
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />

          <PageHeader />
          <main className="min-w-0 flex-1 overflow-y-auto min-h-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

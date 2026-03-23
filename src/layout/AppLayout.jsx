import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/marketers', label: 'Marketers' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/creative', label: 'Creative Insights' },
  { to: '/founder-assistant', label: 'Founder Assistant' },
  { to: '/marketer-assistant', label: 'Marketer Assistant' },
  { to: '/commissions', label: 'Commissions' },
  { to: '/activity', label: 'Activity' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/rules', label: 'Rules' },
];

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen w-full">
        <aside
          className={[
            'hidden md:flex md:shrink-0 md:flex-col bg-[#08131f]/72 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] transition-all duration-300',
            sidebarCollapsed ? 'md:w-[88px]' : 'md:w-64',
          ].join(' ')}
        >
          <div className="px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div
                className={[
                  'rounded-[22px] bg-white/[0.03] backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300',
                  sidebarCollapsed ? 'w-full px-2 py-3' : 'w-full px-4 py-4',
                ].join(' ')}
              >
                <div
                  className={[
                    'flex items-center transition-all duration-300',
                    sidebarCollapsed ? 'justify-center' : 'gap-3',
                  ].join(' ')}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#0a1a2b]">
                    <img
                      src="/logo.png"
                      alt="IntelliFlow Communications"
                      className="max-h-10 max-w-10 object-contain"
                    />
                  </div>

                  {!sidebarCollapsed && (
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold tracking-wide text-white">
                        IntelliFlow
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/55">
                        Communications
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300 transition hover:bg-cyan-400/[0.10] hover:text-cyan-100"
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
                    sidebarCollapsed
                      ? 'px-2 py-3 text-center'
                      : 'px-4 py-3',
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
          <div className="bg-[#08131f]/45 px-4 py-3 backdrop-blur-2xl md:hidden shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition',
                      isActive
                        ? 'bg-cyan-400/[0.10] text-cyan-100'
                        : 'bg-white/[0.03] text-slate-300',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

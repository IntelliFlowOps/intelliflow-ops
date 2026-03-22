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
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen w-full">
        <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col bg-[#08131f]/72 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
          <div className="px-4 py-5">
            <div className="rounded-[22px] bg-white/[0.03] px-4 py-4 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <img
                src="/logo.png"
                alt="IntelliFlow Communications"
                className="mb-3 h-12 w-12 object-contain"
              />

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-wide text-white">
                  IntelliFlow
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/55">
                  Communications
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-3 pb-4 overflow-y-auto">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'block rounded-[18px] px-4 py-3 text-sm transition backdrop-blur-xl',
                    isActive
                      ? 'bg-cyan-400/[0.10] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                      : 'bg-white/[0.025] text-slate-300 hover:bg-cyan-400/[0.06] hover:text-white',
                  ].join(' ')
                }
              >
                {label}
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

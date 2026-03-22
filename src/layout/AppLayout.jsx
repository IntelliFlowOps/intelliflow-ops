import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', short: 'DB' },
  { to: '/customers', label: 'Customers', short: 'CU' },
  { to: '/marketers', label: 'Marketers', short: 'MK' },
  { to: '/campaigns', label: 'Campaigns', short: 'CP' },
  { to: '/creative', label: 'Creative Insights', short: 'CI' },
  { to: '/founder-assistant', label: 'Founder Assistant', short: 'FA' },
  { to: '/marketer-assistant', label: 'Marketer Assistant', short: 'MA' },
  { to: '/commissions', label: 'Commissions', short: 'CM' },
  { to: '/activity', label: 'Activity', short: 'AC' },
  { to: '/analytics', label: 'Analytics', short: 'AN' },
  { to: '/rules', label: 'Rules', short: 'RU' },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen w-full">
        <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col bg-[#08131f]/72 backdrop-blur-2xl shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
          <div className="px-5 py-5">
            <div className="flex items-center gap-3 rounded-[22px] bg-white/[0.03] px-3 py-3 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 shadow-[0_0_22px_rgba(34,211,238,0.12)]">
                <div className="absolute inset-2 rounded-xl bg-white/[0.03]" />
                <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
              </div>

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
            {navItems.map(({ to, label, short }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-[20px] px-3 py-3 text-sm transition backdrop-blur-xl',
                    isActive
                      ? 'bg-cyan-400/[0.10] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                      : 'bg-white/[0.025] text-slate-300 hover:bg-cyan-400/[0.06] hover:text-white',
                  ].join(' ')
                }
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-[11px] font-semibold text-cyan-100">
                  {short}
                </div>
                <span className="truncate">{label}</span>
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

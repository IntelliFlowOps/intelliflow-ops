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
        <aside className="hidden md:flex md:w-72 md:shrink-0 md:flex-col border-r border-white/6 bg-[#08131f]/85 backdrop-blur-2xl">
          <div className="border-b border-white/6 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.14)] backdrop-blur-xl">
                <div className="absolute inset-2 rounded-xl border border-cyan-300/12" />
                <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.85)]" />
              </div>

              <div>
                <div className="text-sm font-semibold tracking-wide text-white">
                  IntelliFlow
                </div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/60">
                  Communications
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-5 overflow-y-auto">
            {navItems.map(({ to, label, short }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition backdrop-blur-xl',
                    isActive
                      ? 'border-cyan-300/16 bg-cyan-400/[0.10] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.08)]'
                      : 'border-white/6 bg-white/[0.03] text-slate-300 hover:border-cyan-300/12 hover:bg-cyan-400/[0.06] hover:text-white',
                  ].join(' ')
                }
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/10 bg-cyan-400/[0.08] text-[11px] font-semibold text-cyan-100">
                  {short}
                </div>
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-white/6 bg-[#08131f]/45 px-4 py-3 backdrop-blur-2xl md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    [
                      'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs transition',
                      isActive
                        ? 'border-cyan-300/16 bg-cyan-400/[0.10] text-cyan-100'
                        : 'border-white/6 bg-white/[0.03] text-slate-300',
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

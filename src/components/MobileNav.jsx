import { useState } from 'react';
import { NavLink } from 'react-router-dom';

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
  { to: '/payout-history', label: 'Payout History' },
  { to: '/payroll', label: 'Payroll' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between bg-[#08131f]/80 px-4 py-3 backdrop-blur-2xl shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)] md:hidden">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IntelliFlow" className="h-8 w-8 rounded-xl object-contain bg-[#0a1a2b] p-1" />
          <span className="text-sm font-semibold text-white">IntelliFlow</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-slate-300 hover:bg-cyan-400/[0.10] hover:text-cyan-100 transition"
          aria-label="Open menu"
        >
          <span className="block space-y-1.5">
            <span className="block h-0.5 w-5 bg-current rounded" />
            <span className="block h-0.5 w-5 bg-current rounded" />
            <span className="block h-0.5 w-3 bg-current rounded" />
          </span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#08131f] shadow-[4px_0_40px_rgba(0,0,0,0.5)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="IntelliFlow" className="h-10 w-10 rounded-[16px] object-contain bg-[#0a1a2b] p-1.5" />
                <div>
                  <div className="text-[15px] font-semibold text-white">IntelliFlow</div>
                  <div className="text-[10px] tracking-[0.22em] text-cyan-200/60 uppercase">Communications</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 hover:text-white transition"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      'block rounded-[16px] px-4 py-3 text-sm transition',
                      isActive
                        ? 'bg-cyan-400/[0.10] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.06)]'
                        : 'bg-white/[0.025] text-slate-300 hover:bg-cyan-400/[0.06] hover:text-white',
                    ].join(' ')
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

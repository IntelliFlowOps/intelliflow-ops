import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '◈' },
  { to: '/customers', label: 'Customers', icon: '◉' },
  { to: '/marketers', label: 'Individual Commissions', icon: '◎' },
  { to: '/campaigns', label: 'Campaigns', icon: '◆' },
  { to: '/creative', label: 'Creative Insights', icon: '◇' },
  { to: '/founder-assistant', label: 'Founder Assistant', icon: '⬡' },
  { to: '/marketer-assistant', label: 'Marketer Assistant', icon: '⬢' },
  { to: '/ledger', label: 'Ledger', icon: '▤' },
  { to: '/activity', label: 'Activity', icon: '◌' },
  { to: '/analytics', label: 'Analytics', icon: '◫' },
  { to: '/payroll', label: 'Payroll', icon: '◑' },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = navItems.find(n => n.to === location.pathname || (n.to !== '/' && location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen bg-[#07111f] text-white">

      {/* Top bar — always visible */}
      <div className="sticky top-0 z-[100] flex items-center gap-4 px-4 py-3 backdrop-blur-2xl" style={{borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(2,6,12,0.85)"}}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300 transition hover:bg-cyan-400/[0.10] hover:text-cyan-100"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px]" style={{background: "linear-gradient(135deg, #020c18, #040f1e)", border: "1px solid rgba(6,182,212,0.2)", boxShadow: "0 0 12px rgba(6,182,212,0.1)"}}>
            <img src="/logo.png" alt="IntelliFlow" className="max-h-7 max-w-7 object-contain" onError={(e) => { e.target.style.display="none"; e.target.parentNode.innerHTML='<span style="font-size:11px;font-weight:700;color:#06b6d4;letter-spacing:-0.5px">IF</span>'; }} />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-white leading-none tracking-tight">IntelliFlow</div>
            <div className="text-[10px] tracking-[0.22em] uppercase mt-0.5" style={{color: "rgba(6,182,212,0.5)"}}>Communications</div>
          </div>
        </div>

        {current && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:block">/</span>
            <span className="text-sm font-medium text-slate-300 hidden sm:block">{current.label}</span>
          </div>
        )}
      </div>

      {/* Sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[300px] flex flex-col" style={{background: "linear-gradient(180deg, rgba(4,8,14,0.98) 0%, rgba(2,5,10,0.99) 100%)", backdropFilter: "blur(60px) saturate(200%)", WebkitBackdropFilter: "blur(60px) saturate(200%)", boxShadow: "8px 0 80px rgba(0,0,0,0.8), 32px 0 80px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.04)"}}>

            <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-[#0a1a2b]">
                  <img src="/logo.png" alt="IntelliFlow" className="max-h-9 max-w-9 object-contain" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-white">IntelliFlow</div>
                  <div className="text-[10px] tracking-[0.22em] text-cyan-200/60 uppercase">Communications</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-[16px] px-4 py-3 text-sm transition',
                      isActive
                        ? 'bg-cyan-400/[0.10] text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.06)]'
                        : 'text-slate-300 hover:bg-white/[0.04] hover:text-white',
                    ].join(' ')
                  }
                >
                  <span className="text-[10px] opacity-50">{icon}</span>
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-white/[0.04]">
              <div className="text-[10px] text-slate-600 text-center">intelliflow-ops.vercel.app</div>
            </div>
          </div>
        </div>
      )}

      {/* Page header + content */}
      <PageHeader />
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

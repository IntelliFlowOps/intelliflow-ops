import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useSheetData } from '../hooks/useSheetData.jsx';

const NAV_SECTIONS = [
  {
    label: 'Operations',
    key: 'operations',
    items: [
      { to: '/', label: 'Dashboard', icon: '◈' },
      { to: '/customers', label: 'Clients', icon: '◉', badge: 'unassigned' },
      { to: '/activity', label: 'Client Activity', icon: '◌' },
    ],
  },
  {
    label: 'Revenue',
    key: 'revenue',
    items: [
      { to: '/campaigns', label: 'Ad Campaigns', icon: '◆' },
      { to: '/analytics', label: 'Performance', icon: '◫' },
      { to: '/creative', label: 'Creative Insights', icon: '◇' },
    ],
  },
  {
    label: 'Finance',
    key: 'finance',
    items: [
      { to: '/marketers', label: 'My Pay', icon: '◎' },
      { to: '/ledger', label: 'Ledger', icon: '▤' },
      { to: '/payroll', label: 'Payroll', icon: '◑' },
      { to: '/tax', label: 'Tax Center', icon: '◑' },
    ],
  },
  {
    label: 'Intelligence',
    key: 'intelligence',
    items: [
      { to: '/sales', label: 'Sales Intelligence', icon: '⚡' },
      { to: '/founder-assistant', label: 'Founder Assistant', icon: '⬡' },
      { to: '/marketer-assistant', label: 'Marketer AI', icon: '⬢' },
    ],
  },
  {
    label: 'Reports',
    key: 'reports',
    items: [
      { to: '/health', label: 'Business Health', icon: '◎' },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);

function useDate() {
  const [date, setDate] = useState('');
  useEffect(() => {
    const d = new Date();
    setDate(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }, []);
  return date;
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const location = useLocation();
  const { data } = useSheetData();
  const today = useDate();

  const current = ALL_NAV.find(n =>
    n.to === location.pathname || (n.to !== '/' && location.pathname.startsWith(n.to))
  );

  const unassignedCount = (data?.CUSTOMERS || []).filter(r =>
    r['Customer Name'] && (!r['Attribution Type'] || r['Attribution Type'] === 'UNASSIGNED')
  ).length;

  function toggleSection(key) {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen min-h-[100dvh] text-white overflow-x-hidden overflow-y-auto w-screen max-w-[100vw]" style={{ background: "#0a0a0c" }}>

      {/* Top bar */}
      <div className="sticky top-0 z-[100] flex items-center gap-4 px-4 py-3 backdrop-blur-2xl"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(2,6,12,0.85)' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300 transition hover:bg-cyan-400/[0.10] hover:text-cyan-100"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4.5h14M2 9h14M2 13.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px]"
            style={{ background: 'linear-gradient(135deg, #020c18, #040f1e)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 12px rgba(255,255,255,0.1)' }}>
            <img src="/logo.png" alt="IntelliFlow" className="max-h-7 max-w-7 object-contain"
              onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:-0.5px">IF</span>'; }} />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-white leading-none tracking-tight">IntelliFlow</div>
            <div className="text-[10px] tracking-[0.22em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Communications</div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {today && (
            <span className="hidden sm:block text-xs font-medium text-zinc-500"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '3px 10px' }}>
              {today}
            </span>
          )}
          {current && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:block">/</span>
              <span className="text-sm font-medium text-slate-300 hidden sm:block">{current.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col"
            style={{ background: 'linear-gradient(180deg, rgba(4,8,14,0.98) 0%, rgba(2,5,10,0.99) 100%)', backdropFilter: 'blur(60px) saturate(200%)', WebkitBackdropFilter: 'blur(60px) saturate(200%)', boxShadow: '8px 0 80px rgba(0,0,0,0.8)', borderRight: '1px solid rgba(255,255,255,0.04)' }}>

            <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[12px] bg-[#0a1a2b]">
                  <img src="/logo.png" alt="IntelliFlow" className="max-h-8 max-w-8 object-contain" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-white">IntelliFlow</div>
                  <div className="text-[10px] tracking-[0.22em] text-cyan-200/60 uppercase">Communications</div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] text-slate-400 hover:text-white transition">
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {NAV_SECTIONS.map(section => (
                <div key={section.key}>
                  {/* Section header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition hover:bg-white/[0.03]"
                  >
                    <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-zinc-600">
                      {section.label}
                    </span>
                    <span className="text-zinc-700 text-[10px] transition-transform duration-200"
                      style={{ transform: collapsed[section.key] ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                      ▾
                    </span>
                  </button>

                  {/* Section items */}
                  {!collapsed[section.key] && (
                    <div className="space-y-0.5 mb-1">
                      {section.items.map(({ to, label, icon, badge }) => {
                        const badgeCount = badge === 'unassigned' ? unassignedCount : 0;
                        return (
                          <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                              ['flex items-center gap-3 rounded-[14px] px-4 py-2.5 text-sm transition relative',
                                isActive
                                  ? 'bg-cyan-400/[0.10] text-cyan-100 shadow-[inset_2px_0_0_rgba(255,255,255,0.6)]'
                                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
                              ].join(' ')
                            }
                          >
                            <span className="text-[10px] opacity-40">{icon}</span>
                            <span className="flex-1">{label}</span>
                            {badgeCount > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                                style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
                                {badgeCount}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="px-4 py-4 border-t border-white/[0.04]">
              <div className="text-[10px] text-slate-600 text-center">intelliflow-ops.vercel.app</div>
            </div>
          </div>
        </div>
      )}

      <PageHeader />
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

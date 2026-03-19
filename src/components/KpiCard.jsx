import { displayValue } from '../utils/format.js';
import { useState } from 'react';

export default function KpiCard({ label, value, subtitle, icon, color = 'accent', info }) {
  const [open, setOpen] = useState(false);

  const colorMap = {
    accent: 'text-accent-glow',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
    zinc: 'text-zinc-300',
  };

  return (
    <div className="kpi-card fade-in group relative overflow-visible z-0 hover:z-50 focus-within:z-50">
      <div className="flex items-start justify-between gap-3 overflow-visible">
        <div className="flex items-center gap-2 min-w-0 overflow-visible">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">
            {label}
          </span>

          {info && (
            <div
              className="relative shrink-0 overflow-visible"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <button
                type="button"
                aria-label={`More information about ${label}`}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                onClick={() => setOpen((prev) => !prev)}
                className="w-4 h-4 rounded-full border border-white/15 text-[10px] text-zinc-400 hover:text-white hover:border-cyan-300/30 transition flex items-center justify-center bg-white/[0.04]"
              >
                i
              </button>

              <div
                className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 z-[999] w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#10172a]/95 backdrop-blur-2xl shadow-2xl shadow-black/40 p-3 text-left transition-all duration-200 ${
                  open
                    ? 'opacity-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 -translate-y-1 pointer-events-none'
                }`}
              >
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                  KPI Info
                </div>
                <div className="text-xs leading-5 text-zinc-200 whitespace-pre-wrap break-words">
                  {info}
                </div>
              </div>
            </div>
          )}
        </div>

        {icon && (
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
            {icon}
          </span>
        )}
      </div>

      <span className={`text-2xl font-bold tracking-tight ${colorMap[color] || colorMap.accent}`}>
        {displayValue(value)}
      </span>

      {subtitle && (
        <span className="text-xs text-zinc-500">{subtitle}</span>
      )}
    </div>
  );
}

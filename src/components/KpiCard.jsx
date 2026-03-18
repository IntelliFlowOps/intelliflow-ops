import { displayValue } from '../utils/format.js';

export default function KpiCard({ label, value, subtitle, icon, color = 'accent' }) {
  const colorMap = {
    accent: 'text-accent-glow', success: 'text-success', warning: 'text-warning',
    danger: 'text-danger', info: 'text-info', zinc: 'text-zinc-300',
  };
  return (
    <div className="kpi-card fade-in group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">{icon}</span>}
      </div>
      <span className={`text-2xl font-bold tracking-tight ${colorMap[color] || colorMap.accent}`}>{displayValue(value)}</span>
      {subtitle && <span className="text-xs text-zinc-500">{subtitle}</span>}
    </div>
  );
}

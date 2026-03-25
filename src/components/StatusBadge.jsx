const BADGE_CONFIG = {
  'DIRECT': {
    style: 'bg-cyan-500/12 text-cyan-300 border-cyan-400/25 shadow-cyan-500/10',
    icon: '◈',
  },
  'SALES': {
    style: 'bg-violet-500/12 text-violet-300 border-violet-400/25 shadow-violet-500/10',
    icon: '◆',
  },
  'FOUNDER': {
    style: 'bg-amber-500/12 text-amber-300 border-amber-400/25 shadow-amber-500/10',
    icon: '★',
  },
  'Yes': {
    style: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    icon: '✓',
  },
  'No': {
    style: 'bg-zinc-500/12 text-zinc-400 border-zinc-500/20',
    icon: '○',
  },
  'Open': {
    style: 'bg-amber-500/12 text-amber-300 border-amber-400/25',
    icon: '◉',
  },
  'Closed': {
    style: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    icon: '✓',
  },
  'Active': {
    style: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    icon: '●',
  },
  'Onboarding': {
    style: 'bg-blue-500/12 text-blue-300 border-blue-400/25',
    icon: '◐',
  },
  'Paused': {
    style: 'bg-amber-500/12 text-amber-300 border-amber-400/25',
    icon: '⏸',
  },
  'At Risk': {
    style: 'bg-orange-500/12 text-orange-300 border-orange-400/30 at-risk-pulse',
    icon: '⚠',
  },
  'Churned': {
    style: 'bg-red-500/12 text-red-400 border-red-500/25',
    icon: '✕',
  },
  'Refunded': {
    style: 'bg-rose-500/12 text-rose-400 border-rose-500/25',
    icon: '↩',
  },
  'Healthy': {
    style: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    icon: '●',
  },
  'Watch': {
    style: 'bg-amber-500/12 text-amber-300 border-amber-400/25',
    icon: '◉',
  },
  'Issue': {
    style: 'bg-red-500/12 text-red-400 border-red-500/25',
    icon: '✕',
  },
  'Needs Review': {
    style: 'bg-violet-500/12 text-violet-300 border-violet-400/25',
    icon: '?',
  },
  'Positive': {
    style: 'bg-emerald-500/12 text-emerald-300 border-emerald-400/25',
    icon: '↑',
  },
  'Neutral': {
    style: 'bg-zinc-500/12 text-zinc-400 border-zinc-500/20',
    icon: '→',
  },
  'Negative': {
    style: 'bg-red-500/12 text-red-400 border-red-500/25',
    icon: '↓',
  },
};

const DEFAULT_CONFIG = {
  style: 'bg-zinc-500/12 text-zinc-400 border-zinc-500/20',
  icon: '·',
};

export default function StatusBadge({ status }) {
  if (!status || status === '-' || status === '') return null;
  const config = BADGE_CONFIG[status] || DEFAULT_CONFIG;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm ${config.style}`}
    >
      <span className="text-[10px] leading-none opacity-80">{config.icon}</span>
      {status}
    </span>
  );
}

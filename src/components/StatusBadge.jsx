const STATUS_STYLES = {
  'DIRECT': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  'SALES': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'FOUNDER': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  'Yes': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'No': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  'Open': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Closed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Active': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Onboarding': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Paused': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'At Risk': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Churned': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Refunded': 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  'Healthy': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Watch': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Issue': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Needs Review': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Positive': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Neutral': 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  'Negative': 'bg-red-500/15 text-red-400 border-red-500/30',
};
const DEFAULT_STYLE = 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';

export default function StatusBadge({ status }) {
  if (!status || status === '-' || status === '') return null;
  const style = STATUS_STYLES[status] || DEFAULT_STYLE;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>{status}</span>;
}

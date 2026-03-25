export default function EmptyState({ title = 'Nothing here yet', description = 'Data will appear here once added to Google Sheets', message }) {
  const displayTitle = title || message || 'Nothing here yet';

  return (
    <div className="card flex flex-col items-center justify-center py-16 px-6 text-center fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-cyan-400/10 blur-2xl scale-150" />
        <div className="relative w-20 h-20 rounded-[24px] flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, rgba(6,182,212,0.12), rgba(2,132,199,0.06))",
            border: "1px solid rgba(6,182,212,0.15)",
            boxShadow: "0 0 0 1px rgba(6,182,212,0.08), inset 0 1px 0 rgba(255,255,255,0.06)"
          }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="rgba(6,182,212,0.25)" strokeWidth="1"/>
            <circle cx="18" cy="18" r="12" stroke="rgba(6,182,212,0.15)" strokeWidth="1" strokeDasharray="3 3"/>
            <path d="M12 18h12M18 12v12" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="2.5" fill="rgba(6,182,212,0.4)"/>
            <path d="M18 7v2M18 27v2M7 18h2M27 18h2" stroke="rgba(6,182,212,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      <p className="text-sm font-medium text-zinc-300 mb-1">{displayTitle}</p>
      <p className="text-xs text-zinc-600 max-w-[240px] leading-5">{description}</p>

      <div className="mt-6 flex items-center gap-1.5 opacity-30">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-full bg-cyan-400"
            style={{
              width: i === 2 ? 20 : i === 1 || i === 3 ? 12 : 6,
              height: 2,
              opacity: i === 2 ? 1 : i === 1 || i === 3 ? 0.6 : 0.3
            }}
          />
        ))}
      </div>
    </div>
  );
}

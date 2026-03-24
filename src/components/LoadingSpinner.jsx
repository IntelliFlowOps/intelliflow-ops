function SkeletonBlock({ className = '' }) {
  return <div className={'rounded-xl bg-white/[0.04] animate-pulse ' + className} />;
}

function SkeletonCard() {
  return (
    <div className='rounded-[18px] border border-white/[0.04] bg-white/[0.03] p-4 space-y-3 animate-pulse'>
      <SkeletonBlock className='h-3 w-24' />
      <SkeletonBlock className='h-7 w-32' />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div className='flex gap-4 px-4 py-3 border-b border-white/[0.03] animate-pulse'>
      <SkeletonBlock className='h-3 w-24 shrink-0' />
      <SkeletonBlock className='h-3 w-40 shrink-0' />
      <SkeletonBlock className='h-3 w-20 shrink-0' />
      <SkeletonBlock className='h-3 w-16 shrink-0' />
      <SkeletonBlock className='h-3 w-28 shrink-0' />
      <SkeletonBlock className='h-3 w-16 shrink-0 ml-auto' />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cards = 0 }) {
  return (
    <div className='space-y-4'>
      {cards > 0 && (
        <div className='grid gap-3 grid-cols-2 md:grid-cols-4'>
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
      <div className='rounded-[18px] border border-white/[0.04] bg-white/[0.02] overflow-hidden'>
        <div className='flex gap-4 px-4 py-3 border-b border-white/[0.06]'>
          {[28, 40, 20, 16, 24, 20].map((w, i) => (
            <SkeletonBlock key={i} className={'h-2.5 w-' + w} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonKPIs({ count = 6 }) {
  return (
    <div className='grid gap-3 grid-cols-2 md:grid-cols-3'>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function LoadingSpinner({ message = 'Loading data...' }) {
  return (
    <div className='flex flex-col items-center justify-center py-20 gap-4'>
      <div className='relative w-10 h-10'>
        <div className='absolute inset-0 rounded-full border-2 border-white/10'></div>
        <div className='absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin'></div>
      </div>
      <p className='text-sm text-zinc-500'>{message}</p>
    </div>
  );
}

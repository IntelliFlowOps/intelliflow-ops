export default function LoadingSpinner({ message = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-surface-500"></div>
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin-slow"></div>
      </div>
      <p className="text-sm text-zinc-500">{message}</p>
    </div>
  );
}

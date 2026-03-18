import { useEffect } from 'react';

export default function DrawerPanel({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) { document.body.style.overflow = 'hidden'; } else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-800 border-l border-surface-500/40 shadow-2xl overflow-y-auto" style={{ animation: 'slideIn 0.25s ease-out' }}>
        <div className="sticky top-0 z-10 bg-surface-800/95 backdrop-blur-sm border-b border-surface-500/30 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-600 transition-colors text-zinc-400 hover:text-zinc-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}

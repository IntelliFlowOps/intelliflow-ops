export default function DrawerPanel({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[560px] border-l border-white/10 bg-[#0b1020] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 px-3 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="h-[calc(100%-73px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

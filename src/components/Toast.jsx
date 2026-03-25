import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-6 right-6 z-[500] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} message={t.message} type={t.type} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

function ToastItem({ message, type }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    const h = setTimeout(() => setVisible(false), 2600);
    return () => { clearTimeout(t); clearTimeout(h); };
  }, []);

  const colors = {
    success: 'border-emerald-500/30 text-emerald-300',
    error: 'border-red-500/30 text-red-300',
    info: 'border-cyan-500/30 text-cyan-300',
    warning: 'border-amber-500/30 text-amber-300',
  };

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';

  return (
    <div className={['pointer-events-auto transition-all duration-300', visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'].join(' ')}>
      <div
        className={['flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl', colors[type] || colors.info].join(' ')}
        style={{ background: 'rgba(4,8,14,0.9)' }}
      >
        <span className="text-base">{icon}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

export default ToastItem;

import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', duration = 2500, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 10);
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, duration);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-300',
    info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[500] transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl ${colors[type]}`}>
        <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

// Toast manager — wrap your app or use inline
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col gap-2">
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onDone={() => remove(t.id)} />)}
    </div>
  );
  return { show, ToastContainer };
}

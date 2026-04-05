import { useState, useEffect, useRef, useCallback } from 'react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ICONS = {
  new_customer: '🎉',
  dispute: '⚠️',
  refund: '↩️',
  payment_failed: '⚠️',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [glowId, setGlowId] = useState(null);
  const prevCountRef = useRef(0);
  const panelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-api-secret': 'INTELLIFLOW_OPS_2026' },
      });
      if (!res.ok) return;
      const json = await res.json();
      const items = json.data || [];

      // Detect new notifications for glow effect
      const unreadCount = items.filter(n => !n.read).length;
      if (unreadCount > prevCountRef.current && prevCountRef.current > 0) {
        const newest = items.find(n => !n.read);
        if (newest) {
          setGlowId(newest.id);
          setTimeout(() => setGlowId(null), 3000);
        }
      }
      prevCountRef.current = unreadCount;

      setNotifications(items);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  async function markRead(id) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': 'INTELLIFLOW_OPS_2026' },
      body: JSON.stringify({ action: 'mark_read', id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-secret': 'INTELLIFLOW_OPS_2026' },
      body: JSON.stringify({ action: 'mark_all_read' }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-slate-300 transition hover:bg-cyan-400/[0.10] hover:text-cyan-100"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: '#06b6d4', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-[380px] max-h-[70vh] overflow-hidden rounded-[18px] z-[300]"
          style={{
            background: 'linear-gradient(160deg, rgba(8,14,24,0.98), rgba(4,8,16,0.99))',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(60px)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-zinc-600">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { if (!n.read) markRead(n.id); }}
                  className="w-full text-left flex items-start gap-3 px-4 py-3 transition border-b border-white/[0.03] last:border-b-0"
                  style={{
                    background: n.id === glowId
                      ? 'rgba(6,182,212,0.12)'
                      : !n.read
                      ? 'rgba(255,255,255,0.03)'
                      : 'transparent',
                    ...(n.id === glowId ? { boxShadow: 'inset 0 0 20px rgba(6,182,212,0.08)' } : {}),
                  }}
                >
                  <span className="text-base mt-0.5 shrink-0">{ICONS[n.type] || '📋'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-zinc-400'}`}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#06b6d4' }} />
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-zinc-600 mt-1 block">{timeAgo(n.created_at)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { displayValue } from '../utils/format.js';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function KpiCard({ label, value, subtitle, icon, color = 'accent', info }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 });
  const buttonRef = useRef(null);
  const closeTimerRef = useRef(null);

  const colorMap = {
    accent: 'text-accent-glow',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
    zinc: 'text-zinc-300',
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  const updatePosition = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const desiredWidth = Math.min(360, viewportWidth - 24);
    const margin = 12;

    let left = rect.left + rect.width / 2 - desiredWidth / 2;
    if (left < margin) left = margin;
    if (left + desiredWidth > viewportWidth - margin) {
      left = viewportWidth - desiredWidth - margin;
    }

    const top = rect.bottom + 10;

    setPosition({
      top,
      left,
      width: desiredWidth,
    });
  };

  useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleWindowChange = () => updatePosition();
    const handleEscape = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <div className="kpi-card fade-in group relative">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">
            {label}
          </span>

          {info && (
            <>
              <button
                ref={buttonRef}
                type="button"
                aria-label={`More information about ${label}`}
                onMouseEnter={() => {
                  clearCloseTimer();
                  setOpen(true);
                }}
                onMouseLeave={scheduleClose}
                onFocus={() => setOpen(true)}
                onBlur={scheduleClose}
                onClick={() => {
                  clearCloseTimer();
                  setOpen((prev) => !prev);
                }}
                className="w-4 h-4 shrink-0 rounded-full border border-white/15 text-[10px] text-zinc-400 hover:text-white hover:border-cyan-300/30 transition flex items-center justify-center bg-white/[0.04]"
              >
                i
              </button>

              {open &&
                createPortal(
                  <div
                    className="fixed inset-0 z-[9999] pointer-events-none"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute pointer-events-auto rounded-2xl border border-white/10 bg-[#10172a]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 p-3 text-left"
                      style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                        maxWidth: 'calc(100vw - 24px)',
                      }}
                      onMouseEnter={clearCloseTimer}
                      onMouseLeave={scheduleClose}
                    >
                      <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-200/70 mb-2">
                        KPI Info
                      </div>
                      <div className="text-xs leading-5 text-zinc-200 whitespace-pre-wrap break-words">
                        {info}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </>
          )}
        </div>

        {icon && (
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
            {icon}
          </span>
        )}
      </div>

      <span className={`text-2xl font-bold tracking-tight ${colorMap[color] || colorMap.accent}`}>
        {displayValue(value)}
      </span>

      {subtitle && (
        <span className="text-xs text-zinc-500">{subtitle}</span>
      )}
    </div>
  );
}

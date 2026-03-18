import { useEffect, useState } from 'react';

export default function CursorTrail() {
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    function handleMove(e) {
      setPos({ x: e.clientX, y: e.clientY });
    }

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed z-[9999] w-16 h-16 rounded-full"
        style={{
          left: pos.x - 32,
          top: pos.y - 32,
          background:
            'radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0.08) 40%, transparent 72%)',
          filter: 'blur(10px)',
          transition: 'left 120ms linear, top 120ms linear',
        }}
      />
      <div
        className="pointer-events-none fixed z-[9999] w-3 h-3 rounded-full"
        style={{
          left: pos.x - 6,
          top: pos.y - 6,
          background: 'rgba(125,211,252,0.55)',
          boxShadow: '0 0 18px rgba(56,189,248,0.65)',
          transition: 'left 40ms linear, top 40ms linear',
        }}
      />
    </>
  );
}

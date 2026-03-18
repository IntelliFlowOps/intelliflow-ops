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
    <div
      className="pointer-events-none fixed z-[9999] w-10 h-10 rounded-full"
      style={{
        left: pos.x - 20,
        top: pos.y - 20,
        background: 'radial-gradient(circle, rgba(56,189,248,0.14), rgba(56,189,248,0.03) 55%, transparent 75%)',
        filter: 'blur(8px)',
        transition: 'left 90ms linear, top 90ms linear',
      }}
    />
  );
}

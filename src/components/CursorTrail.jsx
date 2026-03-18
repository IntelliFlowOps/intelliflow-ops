import { useEffect, useState } from 'react';

export default function CursorTrail() {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    let timeoutId;

    function handleMove(e) {
      const point = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };

      setPoints((prev) => [...prev.slice(-10), point]);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setPoints((prev) => prev.slice(-6));
      }, 80);
    }

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (points.length === 0) return;

    const interval = setInterval(() => {
      setPoints((prev) => prev.slice(1));
    }, 45);

    return () => clearInterval(interval);
  }, [points]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {points.map((point, index) => {
        const strength = (index + 1) / points.length;
        const size = 10 + strength * 12;
        const opacity = 0.05 + strength * 0.12;

        return (
          <div
            key={point.id}
            className="absolute rounded-full"
            style={{
              left: point.x - size / 2,
              top: point.y - size / 2,
              width: size,
              height: size,
              opacity,
              background: 'radial-gradient(circle, rgba(103,232,249,0.9) 0%, rgba(56,189,248,0.35) 35%, transparent 72%)',
              filter: 'blur(8px)',
              transition: 'opacity 120ms linear, transform 120ms linear',
              transform: `scale(${0.85 + strength * 0.25})`,
            }}
          />
        );
      })}
    </div>
  );
}

import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pointerRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const trailRef = useRef([]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.className = 'pointer-events-none fixed inset-0 z-[9999]';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    resize();

    function handleMove(e) {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        life: 1,
      });

      if (trailRef.current.length > 40) {
        trailRef.current.shift();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const trail = trailRef.current;

      for (let i = 0; i < trail.length; i++) {
        trail[i].life -= 0.028;
      }

      trailRef.current = trail.filter((p) => p.life > 0);

      if (trailRef.current.length > 1) {
        for (let i = 1; i < trailRef.current.length; i++) {
          const prev = trailRef.current[i - 1];
          const curr = trailRef.current[i];
          const strength = i / trailRef.current.length;
          const alpha = curr.life * strength * 0.18;
          const width = 1 + strength * 5;

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.strokeStyle = `rgba(125, 211, 252, ${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 14;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.28)';
          ctx.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMove);
    animationRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(animationRef.current);
      canvas.remove();
    };
  }, []);

  return null;
}

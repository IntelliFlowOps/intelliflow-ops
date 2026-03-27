import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pointerRef = useRef({ x: -100, y: -100 });
  const trailRef = useRef([]);
  const velocityRef = useRef(0);

  useEffect(() => {
    // Don't run on touch devices
    if ('ontouchstart' in window) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;width:100vw;height:100vh;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let prevX = -100, prevY = -100;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function handleMove(e) {
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      velocityRef.current = Math.min(Math.sqrt(dx * dx + dy * dy), 60);
      prevX = e.clientX;
      prevY = e.clientY;
      pointerRef.current = { x: e.clientX, y: e.clientY };

      trailRef.current.push({
        x: e.clientX,
        y: e.clientY,
        life: 1,
        vel: velocityRef.current,
      });

      if (trailRef.current.length > 50) trailRef.current.shift();
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const trail = trailRef.current;
      const { x: mx, y: my } = pointerRef.current;

      // Decay
      for (let i = 0; i < trail.length; i++) {
        trail[i].life -= 0.025;
      }
      trailRef.current = trail.filter(p => p.life > 0);

      // Draw trail — tapered white line
      if (trailRef.current.length > 2) {
        for (let i = 2; i < trailRef.current.length; i++) {
          const prev = trailRef.current[i - 1];
          const curr = trailRef.current[i];
          const t = i / trailRef.current.length;
          const alpha = curr.life * t * 0.35;
          const width = t * t * 3.5;

          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(curr.x, curr.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Cursor tip glow — soft white halo
      const vel = velocityRef.current;
      const glowSize = 3 + vel * 0.15;
      const glowAlpha = 0.12 + vel * 0.003;

      // Outer halo
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, glowSize * 8);
      grad.addColorStop(0, `rgba(255, 255, 255, ${glowAlpha})`);
      grad.addColorStop(0.4, `rgba(255, 255, 255, ${glowAlpha * 0.3})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(mx, my, glowSize * 8, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Inner bright dot
      const inner = ctx.createRadialGradient(mx, my, 0, mx, my, glowSize);
      inner.addColorStop(0, `rgba(255, 255, 255, ${0.5 + vel * 0.005})`);
      inner.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(mx, my, glowSize, 0, Math.PI * 2);
      ctx.fillStyle = inner;
      ctx.fill();

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

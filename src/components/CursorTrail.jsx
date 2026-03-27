import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const pointerRef = useRef({ x: -100, y: -100 });
  const trailRef = useRef([]);
  const velocityRef = useRef(0);
  const angleRef = useRef(0);

  useEffect(() => {
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
      const dist = Math.sqrt(dx * dx + dy * dy);
      velocityRef.current = Math.min(dist, 80);
      if (dist > 1) angleRef.current = Math.atan2(dy, dx);
      prevX = e.clientX;
      prevY = e.clientY;
      pointerRef.current = { x: e.clientX, y: e.clientY };

      // Spawn particles based on velocity
      const count = Math.max(1, Math.floor(dist / 3));
      for (let p = 0; p < count; p++) {
        const t = p / count;
        const px = prevX - dx * t;
        const py = prevY - dy * t;
        trailRef.current.push({
          x: px,
          y: py,
          originX: px,
          originY: py,
          life: 1,
          vel: velocityRef.current,
          // Drift perpendicular to movement direction
          driftX: (Math.random() - 0.5) * 0.4,
          driftY: (Math.random() - 0.5) * 0.4,
          size: 0.3 + Math.random() * 0.5,
        });
      }

      if (trailRef.current.length > 120) {
        trailRef.current = trailRef.current.slice(-120);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const trail = trailRef.current;
      const { x: mx, y: my } = pointerRef.current;
      const vel = velocityRef.current;

      // Decay particles
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        p.life -= 0.015;
        // Particles drift and fall slightly like embers cooling
        p.x += p.driftX;
        p.y += p.driftY + 0.08;
        p.driftX *= 0.98;
        p.driftY *= 0.98;
      }
      trailRef.current = trail.filter(p => p.life > 0);

      // Draw trail ribbon — smooth quadratic curves
      if (trailRef.current.length > 3) {
        const alive = trailRef.current.filter(p => p.life > 0.3);
        if (alive.length > 2) {
          ctx.beginPath();
          ctx.moveTo(alive[0].x, alive[0].y);
          for (let i = 1; i < alive.length - 1; i++) {
            const xc = (alive[i].x + alive[i + 1].x) / 2;
            const yc = (alive[i].y + alive[i + 1].y) / 2;
            ctx.quadraticCurveTo(alive[i].x, alive[i].y, xc, yc);
          }
          const last = alive[alive.length - 1];
          ctx.lineTo(last.x, last.y);

          // Gradient along trail
          const first = alive[0];
          const grad = ctx.createLinearGradient(first.x, first.y, last.x, last.y);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
          grad.addColorStop(1, `rgba(255,255,255,${0.06 + vel * 0.001})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5 + vel * 0.02;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }

      // Draw drifting particles — tiny dots that separate from the trail
      for (let i = 0; i < trailRef.current.length; i++) {
        const p = trailRef.current[i];
        if (p.life < 0.7) {
          const fade = p.life / 0.7;
          const alpha = fade * fade * 0.12;
          const radius = p.size * fade;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
        }
      }

      // Cursor proximity light — illuminates nearby glass surfaces
      const lightSize = 60 + vel * 1.5;
      const lightAlpha = 0.025 + vel * 0.0005;
      const ambientGrad = ctx.createRadialGradient(mx, my, 0, mx, my, lightSize);
      ambientGrad.addColorStop(0, `rgba(255,255,255,${lightAlpha})`);
      ambientGrad.addColorStop(0.3, `rgba(255,255,255,${lightAlpha * 0.4})`);
      ambientGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, lightSize, 0, Math.PI * 2);
      ctx.fillStyle = ambientGrad;
      ctx.fill();

      // Core dot — barely there
      const coreGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 2 + vel * 0.05);
      coreGrad.addColorStop(0, `rgba(255,255,255,${0.25 + vel * 0.003})`);
      coreGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, 2 + vel * 0.05, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Velocity decay
      velocityRef.current *= 0.92;

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

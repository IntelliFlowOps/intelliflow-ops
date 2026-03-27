import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const animationRef = useRef(null);

  useEffect(() => {
    if ('ontouchstart' in window) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;width:100vw;height:100vh;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let mx = -200, my = -200, prevX = -200, prevY = -200;
    let vel = 0, angle = 0;
    const particles = [];
    const ribbonPoints = [];
    const wisps = [];

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
      vel = Math.min(dist, 100);
      if (dist > 0.5) angle = Math.atan2(dy, dx);
      prevX = mx;
      prevY = my;
      mx = e.clientX;
      my = e.clientY;

      // Ribbon point
      ribbonPoints.push({ x: mx, y: my, life: 1, vel: vel });
      if (ribbonPoints.length > 80) ribbonPoints.shift();

      // Ember particles — spawn more when fast
      const spawnCount = Math.floor(vel / 8);
      for (let i = 0; i < spawnCount; i++) {
        const spread = vel * 0.15;
        const perpAngle = angle + Math.PI / 2;
        const offset = (Math.random() - 0.5) * spread;
        particles.push({
          x: mx + Math.cos(perpAngle) * offset,
          y: my + Math.sin(perpAngle) * offset,
          vx: (Math.random() - 0.5) * 0.3 + Math.cos(angle) * -0.2,
          vy: (Math.random() - 0.5) * 0.3 + 0.15,
          life: 1,
          maxLife: 0.7 + Math.random() * 0.6,
          size: 0.2 + Math.random() * 0.6,
        });
      }

      // Rare wisp — a slow-moving ghost that lingers much longer
      if (vel > 15 && Math.random() < 0.06) {
        wisps.push({
          x: mx + (Math.random() - 0.5) * 20,
          y: my + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.1 - Math.random() * 0.15,
          life: 1,
          size: 8 + Math.random() * 16,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // ── Ribbon: smooth fading calligraphic line ──
      for (let i = 0; i < ribbonPoints.length; i++) {
        ribbonPoints[i].life -= 0.008;
      }
      while (ribbonPoints.length > 0 && ribbonPoints[0].life <= 0) ribbonPoints.shift();

      if (ribbonPoints.length > 3) {
        for (let i = 2; i < ribbonPoints.length; i++) {
          const p0 = ribbonPoints[i - 2];
          const p1 = ribbonPoints[i - 1];
          const p2 = ribbonPoints[i];
          const t = i / ribbonPoints.length;
          const life = p2.life;

          // Fade: starts invisible, peaks in middle, fades at tip
          const fadeIn = Math.min(t * 3, 1);
          const fadeOut = life;
          const alpha = fadeIn * fadeOut * fadeOut * 0.07;
          const width = t * t * 2.5 * fadeOut;

          if (alpha < 0.001 || width < 0.1) continue;

          const cpX = (p0.x + p1.x) / 2;
          const cpY = (p0.y + p1.y) / 2;

          ctx.beginPath();
          ctx.moveTo(cpX, cpY);
          ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // ── Ember particles: tiny dots that drift and truly fade to zero ──
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.008 / p.maxLife;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.vy += 0.003; // micro gravity

        if (p.life <= 0) { particles.splice(i, 1); continue; }

        // Cubic fade — truly smooth to zero
        const fade = p.life * p.life * p.life;
        const alpha = fade * 0.15;
        const r = p.size * (0.5 + fade * 0.5);

        if (alpha < 0.001) { particles.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      // ── Wisps: slow ghostly shapes that linger and rise ──
      for (let i = wisps.length - 1; i >= 0; i--) {
        const w = wisps[i];
        w.life -= 0.003;
        w.x += w.vx;
        w.y += w.vy;
        w.vx *= 0.998;
        w.vy *= 0.999;

        if (w.life <= 0) { wisps.splice(i, 1); continue; }

        const fade = w.life * w.life;
        const alpha = fade * 0.02;
        const size = w.size * (0.8 + (1 - fade) * 0.4);

        if (alpha < 0.001) { wisps.splice(i, 1); continue; }

        const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, size);
        grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
        grad.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.3})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(w.x, w.y, size, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // ── Ambient cursor light — extremely subtle ──
      const lightSize = 45 + vel * 0.8;
      const lightAlpha = 0.015 + vel * 0.0003;
      const ambient = ctx.createRadialGradient(mx, my, 0, mx, my, lightSize);
      ambient.addColorStop(0, `rgba(255,255,255,${lightAlpha})`);
      ambient.addColorStop(0.5, `rgba(255,255,255,${lightAlpha * 0.25})`);
      ambient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, lightSize, 0, Math.PI * 2);
      ctx.fillStyle = ambient;
      ctx.fill();

      // Velocity decay
      vel *= 0.9;

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

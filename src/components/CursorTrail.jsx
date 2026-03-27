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
    const trail = [];
    const sparks = [];

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
      vel = Math.min(dist, 90);
      if (dist > 0.5) angle = Math.atan2(dy, dx);
      prevX = mx;
      prevY = my;
      mx = e.clientX;
      my = e.clientY;

      // Trail points — interpolated for smoothness
      const steps = Math.max(1, Math.floor(dist / 2));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        trail.push({
          x: prevX + dx * t,
          y: prevY + dy * t,
          life: 1,
          width: vel,
        });
      }
      if (trail.length > 100) trail.splice(0, trail.length - 100);

      // Sparks — split off at angles like a sparkler
      if (vel > 6) {
        const count = Math.floor(vel / 12);
        for (let i = 0; i < count; i++) {
          // Fan out in a cone behind the cursor
          const spreadAngle = angle + Math.PI + (Math.random() - 0.5) * 1.2;
          const speed = 0.3 + Math.random() * (vel * 0.025);
          sparks.push({
            x: mx,
            y: my,
            vx: Math.cos(spreadAngle) * speed,
            vy: Math.sin(spreadAngle) * speed,
            life: 1,
            decay: 0.01 + Math.random() * 0.01,
            size: 0.3 + Math.random() * 0.8,
            bright: 0.5 + Math.random() * 0.5,
          });
        }
      }

      if (sparks.length > 150) sparks.splice(0, sparks.length - 150);
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // ── Trail ribbon — tapers from nothing to cursor ──
      for (let i = 0; i < trail.length; i++) {
        trail[i].life -= 0.012;
      }
      while (trail.length > 0 && trail[0].life <= 0) trail.shift();

      if (trail.length > 4) {
        // Draw as connected smooth segments
        for (let i = 3; i < trail.length; i++) {
          const p0 = trail[i - 3];
          const p1 = trail[i - 2];
          const p2 = trail[i - 1];
          const p3 = trail[i];

          const t = i / trail.length;
          const life = p3.life;

          // Smooth taper: thin at tail, thicker at head
          const taper = t * t * t;
          const fadeOut = life * life;
          const alpha = taper * fadeOut * 0.1;
          const width = taper * 3 * fadeOut;

          if (alpha < 0.0005) continue;

          // Catmull-Rom to Bezier control points
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // ── Sparks — fan out behind cursor like a sparkler ──
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= s.decay;
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.98;
        s.vy *= 0.98;
        s.vy += 0.005;

        if (s.life <= 0) { sparks.splice(i, 1); continue; }

        // Smooth fade with slight flicker
        const fade = s.life * s.life;
        const flicker = 0.85 + Math.sin(Date.now() * 0.02 + i) * 0.15;
        const alpha = fade * s.bright * flicker * 0.22;
        const radius = s.size * (0.4 + fade * 0.6);

        if (alpha < 0.001) { sparks.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();

        // Tiny connecting line from spark back toward trail
        if (fade > 0.5 && radius > 0.4) {
          const lineAlpha = alpha * 0.3;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3);
          ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
          ctx.lineWidth = radius * 0.4;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // ── Ambient light — soft pool under cursor ──
      const lightRadius = 35 + vel * 0.6;
      const lightAlpha = 0.018 + vel * 0.0004;
      const glow = ctx.createRadialGradient(mx, my, 0, mx, my, lightRadius);
      glow.addColorStop(0, `rgba(255,255,255,${lightAlpha})`);
      glow.addColorStop(0.6, `rgba(255,255,255,${lightAlpha * 0.2})`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, lightRadius, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      vel *= 0.88;
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

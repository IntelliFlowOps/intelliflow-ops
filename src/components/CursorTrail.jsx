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
    const wakeLines = [];
    const motes = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function handleMove(e) {
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      vel = Math.min(dist, 100);
      if (dist > 0.5) angle = Math.atan2(dy, dx);
      prevX = mx;
      prevY = my;
      mx = e.clientX;
      my = e.clientY;

      // Wake lines — two lines that spread outward perpendicular to movement
      if (vel > 3) {
        const perpAngle = angle + Math.PI / 2;
        const spread = 3 + vel * 0.15;

        // Left wake line
        wakeLines.push({
          x: mx,
          y: my,
          // Start point at cursor, end point spreads outward over time
          spreadAngle: perpAngle + 0.3 + (Math.random() - 0.5) * 0.2,
          length: 0,
          maxLength: spread + Math.random() * spread * 0.5,
          life: 1,
          speed: 0.8 + vel * 0.03,
          side: -1,
          curve: (Math.random() - 0.5) * 0.02,
        });

        // Right wake line
        wakeLines.push({
          x: mx,
          y: my,
          spreadAngle: perpAngle - Math.PI - 0.3 + (Math.random() - 0.5) * 0.2,
          length: 0,
          maxLength: spread + Math.random() * spread * 0.5,
          life: 1,
          speed: 0.8 + vel * 0.03,
          side: 1,
          curve: (Math.random() - 0.5) * 0.02,
        });

        // Occasional center line — like the seam of the wake
        if (Math.random() < 0.15 && vel > 15) {
          const backAngle = angle + Math.PI + (Math.random() - 0.5) * 0.3;
          wakeLines.push({
            x: mx,
            y: my,
            spreadAngle: backAngle,
            length: 0,
            maxLength: vel * 0.2,
            life: 1,
            speed: 0.4 + vel * 0.015,
            side: 0,
            curve: (Math.random() - 0.5) * 0.01,
          });
        }
      }

      if (wakeLines.length > 200) wakeLines.splice(0, wakeLines.length - 200);

      // Motes — tiny droplets that separate from the wake
      if (vel > 12 && Math.random() < 0.08) {
        const outAngle = angle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1) + (Math.random() - 0.5) * 0.8;
        motes.push({
          x: mx + Math.cos(outAngle) * (5 + Math.random() * 8),
          y: my + Math.sin(outAngle) * (5 + Math.random() * 8),
          vx: Math.cos(outAngle) * (0.06 + Math.random() * 0.08),
          vy: Math.sin(outAngle) * (0.06 + Math.random() * 0.08),
          life: 1,
          size: 0.3 + Math.random() * 0.5,
        });
      }
      if (motes.length > 25) motes.splice(0, motes.length - 25);
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // ── Wake lines — V-shaped spread from each point ──
      for (let i = wakeLines.length - 1; i >= 0; i--) {
        const w = wakeLines[i];
        w.life -= 0.009;
        w.length += (w.maxLength - w.length) * 0.08;
        w.spreadAngle += w.curve;

        if (w.life <= 0) { wakeLines.splice(i, 1); continue; }

        const fade = w.life * w.life;
        const alpha = fade * 0.08;
        const endX = w.x + Math.cos(w.spreadAngle) * w.length;
        const endY = w.y + Math.sin(w.spreadAngle) * w.length;

        if (alpha < 0.001) { wakeLines.splice(i, 1); continue; }

        // Each wake line is a slight curve, not straight
        const midX = (w.x + endX) / 2 + w.curve * w.length * 8;
        const midY = (w.y + endY) / 2 + w.curve * w.length * 8;

        ctx.beginPath();
        ctx.moveTo(w.x, w.y);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.5 + fade * 0.8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Faint glow along the line
        if (fade > 0.4 && w.length > 3) {
          const glowAlpha = alpha * 0.2;
          const glow = ctx.createRadialGradient(
            (w.x + endX) / 2, (w.y + endY) / 2, 0,
            (w.x + endX) / 2, (w.y + endY) / 2, w.length * 0.4
          );
          glow.addColorStop(0, `rgba(255,255,255,${glowAlpha})`);
          glow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.arc((w.x + endX) / 2, (w.y + endY) / 2, w.length * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      // ── Motes — droplets that separated from the wake ──
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.life -= 0.005;
        m.x += m.vx;
        m.y += m.vy;
        m.vx *= 0.993;
        m.vy *= 0.993;

        if (m.life <= 0) { motes.splice(i, 1); continue; }

        const fade = m.life * m.life;
        const pulse = 0.75 + Math.sin(Date.now() * 0.003 + i * 3) * 0.25;
        const alpha = fade * pulse * 0.1;
        const r = m.size * (0.5 + fade * 0.5);

        if (alpha < 0.001) { motes.splice(i, 1); continue; }

        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 3);
        g.addColorStop(0, `rgba(255,255,255,${alpha * 1.2})`);
        g.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.3})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(m.x, m.y, r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // ── Surface tension — the surprise, when cursor rests ──
      if (vel < 1) {
        const t = Date.now() * 0.001;
        const breathe = Math.sin(t * 0.8) * 0.5 + 0.5;
        const breathe2 = Math.sin(t * 0.5 + 1.5) * 0.5 + 0.5;

        // Two concentric rings breathing at different rates
        const r1 = 15 + breathe * 12;
        const r2 = 28 + breathe2 * 18;
        const a1 = 0.025 + breathe * 0.012;
        const a2 = 0.012 + breathe2 * 0.008;

        ctx.beginPath();
        ctx.arc(mx, my, r1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${a1})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mx, my, r2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${a2})`;
        ctx.lineWidth = 0.3;
        ctx.stroke();

        // Inner pool
        const pool = ctx.createRadialGradient(mx, my, 0, mx, my, r1 * 0.5);
        pool.addColorStop(0, `rgba(255,255,255,${a1 * 0.4})`);
        pool.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(mx, my, r1 * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = pool;
        ctx.fill();
      }

      // ── Ambient light ──
      const lightR = 25 + vel * 0.3;
      const lightA = 0.01 + vel * 0.0002;
      const amb = ctx.createRadialGradient(mx, my, 0, mx, my, lightR);
      amb.addColorStop(0, `rgba(255,255,255,${lightA})`);
      amb.addColorStop(0.5, `rgba(255,255,255,${lightA * 0.15})`);
      amb.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, lightR, 0, Math.PI * 2);
      ctx.fillStyle = amb;
      ctx.fill();

      vel *= 0.85;
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

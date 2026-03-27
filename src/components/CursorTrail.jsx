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
    let vel = 0;
    const trail = [];
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
      vel = Math.min(Math.sqrt(dx * dx + dy * dy), 90);
      prevX = mx; prevY = my;
      mx = e.clientX; my = e.clientY;

      const steps = Math.max(1, Math.floor(vel / 3));
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        trail.push({
          x: prevX + dx * t,
          y: prevY + dy * t,
          life: 1,
        });
      }
      if (trail.length > 90) trail.splice(0, trail.length - 90);

      if (vel > 10 && Math.random() < 0.1) {
        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
        motes.push({
          x: mx, y: my,
          vx: Math.cos(a) * (0.05 + Math.random() * 0.08),
          vy: Math.sin(a) * (0.05 + Math.random() * 0.08),
          life: 1,
          size: 0.3 + Math.random() * 0.4,
        });
      }
      if (motes.length > 20) motes.splice(0, motes.length - 20);
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Ribbon
      for (let i = 0; i < trail.length; i++) trail[i].life -= 0.01;
      while (trail.length && trail[0].life <= 0) trail.shift();

      if (trail.length > 4) {
        for (let i = 3; i < trail.length; i++) {
          const a = trail[i - 2], b = trail[i - 1], c = trail[i];
          const t = i / trail.length;
          const life = c.life;
          const fade = t * t * life * life * life;
          const alpha = fade * 0.09;
          const width = fade * 2.8;
          if (alpha < 0.0005) continue;

          ctx.beginPath();
          ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
          ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }

      // Motes
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.life -= 0.005;
        m.x += m.vx; m.y += m.vy;
        m.vx *= 0.996; m.vy *= 0.996;
        if (m.life <= 0) { motes.splice(i, 1); continue; }
        const f = m.life * m.life;
        const pulse = 0.75 + Math.sin(Date.now() * 0.003 + i * 3) * 0.25;
        const a = f * pulse * 0.1;
        const r = m.size * (0.5 + f * 0.5);
        if (a < 0.001) { motes.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r * 3.5);
        g.addColorStop(0, `rgba(255,255,255,${a * 1.3})`);
        g.addColorStop(0.4, `rgba(255,255,255,${a * 0.3})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(m.x, m.y, r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Resting breath
      if (vel < 1.5) {
        const t = Date.now() * 0.001;
        const b1 = Math.sin(t * 0.8) * 0.5 + 0.5;
        const b2 = Math.sin(t * 0.5 + 1.5) * 0.5 + 0.5;
        const r1 = 14 + b1 * 10;
        const r2 = 26 + b2 * 14;

        ctx.beginPath();
        ctx.arc(mx, my, r1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.02 + b1 * 0.01})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(mx, my, r2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.01 + b2 * 0.007})`;
        ctx.lineWidth = 0.3;
        ctx.stroke();

        const pool = ctx.createRadialGradient(mx, my, 0, mx, my, r1 * 0.5);
        pool.addColorStop(0, `rgba(255,255,255,${0.012 + b1 * 0.006})`);
        pool.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(mx, my, r1 * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = pool;
        ctx.fill();
      }

      // Ambient
      const lr = 25 + vel * 0.3;
      const la = 0.01 + vel * 0.0002;
      const amb = ctx.createRadialGradient(mx, my, 0, mx, my, lr);
      amb.addColorStop(0, `rgba(255,255,255,${la})`);
      amb.addColorStop(0.5, `rgba(255,255,255,${la * 0.15})`);
      amb.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, lr, 0, Math.PI * 2);
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

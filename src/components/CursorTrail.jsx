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
    const ripples = [];
    const motes = [];
    let lastRippleTime = 0;
    let totalDistance = 0;

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
      totalDistance += dist;

      const now = Date.now();

      // Ripples — spawn based on distance traveled, not time
      if (vel > 2 && now - lastRippleTime > 30) {
        lastRippleTime = now;
        ripples.push({
          x: mx,
          y: my,
          life: 1,
          maxRadius: 18 + vel * 0.6,
          radius: 2,
          vel: vel,
        });

        // Secondary ripple — slightly delayed, slightly offset
        if (vel > 20) {
          ripples.push({
            x: mx + (Math.random() - 0.5) * 6,
            y: my + (Math.random() - 0.5) * 6,
            life: 1,
            maxRadius: 10 + vel * 0.3,
            radius: 1,
            vel: vel * 0.6,
            delay: 0.15,
          });
        }
      }

      if (ripples.length > 60) ripples.splice(0, ripples.length - 60);

      // Motes — rare, beautiful, drift outward slowly
      if (vel > 8 && Math.random() < 0.12) {
        const outAngle = angle + Math.PI + (Math.random() - 0.5) * Math.PI * 1.5;
        const speed = 0.08 + Math.random() * 0.12;
        motes.push({
          x: mx,
          y: my,
          vx: Math.cos(outAngle) * speed,
          vy: Math.sin(outAngle) * speed,
          life: 1,
          size: 0.4 + Math.random() * 0.6,
          drift: (Math.random() - 0.5) * 0.02,
        });
      }

      if (motes.length > 40) motes.splice(0, motes.length - 40);
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // ── Ripples — concentric rings expanding outward ──
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];

        if (r.delay && r.delay > 0) {
          r.delay -= 0.016;
          continue;
        }

        r.life -= 0.012;
        r.radius += (r.maxRadius - r.radius) * 0.06;

        if (r.life <= 0) { ripples.splice(i, 1); continue; }

        const fade = r.life * r.life * r.life;
        const alpha = fade * 0.09;

        if (alpha < 0.001) { ripples.splice(i, 1); continue; }

        // Main ripple ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.8 + fade * 0.8;
        ctx.stroke();

        // Inner glow — fills the ripple with a whisper of light
        if (fade > 0.3) {
          const fillGrad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.radius);
          fillGrad.addColorStop(0, `rgba(255,255,255,${alpha * 0.25})`);
          fillGrad.addColorStop(0.7, `rgba(255,255,255,${alpha * 0.05})`);
          fillGrad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.fillStyle = fillGrad;
          ctx.fill();
        }
      }

      // ── Motes — tiny lights that drift outward and fade ──
      for (let i = motes.length - 1; i >= 0; i--) {
        const m = motes[i];
        m.life -= 0.006;
        m.x += m.vx;
        m.y += m.vy;
        m.vx += m.drift;
        m.vy += m.drift * 0.5;
        m.vx *= 0.997;
        m.vy *= 0.997;

        if (m.life <= 0) { motes.splice(i, 1); continue; }

        const fade = m.life * m.life;
        // Gentle pulse — breathes in and out
        const pulse = 0.7 + Math.sin(Date.now() * 0.003 + i * 2.5) * 0.3;
        const alpha = fade * pulse * 0.1;
        const radius = m.size * (0.6 + fade * 0.4);

        if (alpha < 0.001) { motes.splice(i, 1); continue; }

        // Soft glow around each mote
        const moteGlow = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, radius * 4);
        moteGlow.addColorStop(0, `rgba(255,255,255,${alpha})`);
        moteGlow.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.3})`);
        moteGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(m.x, m.y, radius * 4, 0, Math.PI * 2);
        ctx.fillStyle = moteGlow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(m.x, m.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 1.5})`;
        ctx.fill();
      }

      // ── The surprise: surface tension ──
      // When cursor is still, a single slow ring pulses outward
      // like the surface settling after being disturbed
      if (vel < 1.5 && ripples.length < 5) {
        const breathe = Math.sin(Date.now() * 0.0015) * 0.5 + 0.5;
        const settleRadius = 20 + breathe * 15;
        const settleAlpha = 0.02 + breathe * 0.015;

        ctx.beginPath();
        ctx.arc(mx, my, settleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${settleAlpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Inner pool of light — like the water is still but alive
        const poolGrad = ctx.createRadialGradient(mx, my, 0, mx, my, settleRadius * 0.6);
        poolGrad.addColorStop(0, `rgba(255,255,255,${settleAlpha * 0.5})`);
        poolGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.arc(mx, my, settleRadius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = poolGrad;
        ctx.fill();
      }

      // ── Ambient cursor light ──
      const lightRadius = 30 + vel * 0.4;
      const lightAlpha = 0.012 + vel * 0.0003;
      const ambient = ctx.createRadialGradient(mx, my, 0, mx, my, lightRadius);
      ambient.addColorStop(0, `rgba(255,255,255,${lightAlpha})`);
      ambient.addColorStop(0.5, `rgba(255,255,255,${lightAlpha * 0.2})`);
      ambient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, lightRadius, 0, Math.PI * 2);
      ctx.fillStyle = ambient;
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

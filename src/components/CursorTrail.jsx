import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const animationRef = useRef(null);

  useEffect(() => {
    if ('ontouchstart' in window) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;width:100vw;height:100vh;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let mx = -200, my = -200;
    let vel = 0, angle = 0;
    let prevX = -200, prevY = -200;

    // Distortion field — grid of points that get displaced by the cursor
    const cols = 60;
    const rows = 40;
    const points = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rebuild grid
      points.length = 0;
      const spacingX = window.innerWidth / (cols - 1);
      const spacingY = window.innerHeight / (rows - 1);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          points.push({
            homeX: c * spacingX,
            homeY: r * spacingY,
            x: c * spacingX,
            y: r * spacingY,
            vx: 0,
            vy: 0,
          });
        }
      }
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
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const cursorRadius = 80 + vel * 1.5;
      const pushStrength = 0.15 + vel * 0.008;

      // Physics: push points away from cursor, spring them back home
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < cursorRadius && dist > 0) {
          // Push force — falls off with distance squared
          const force = (1 - dist / cursorRadius);
          const forceSquared = force * force * pushStrength;
          p.vx += (dx / dist) * forceSquared * vel * 0.15;
          p.vy += (dy / dist) * forceSquared * vel * 0.15;

          // Add movement direction bias — wake effect
          p.vx += Math.cos(angle) * forceSquared * 0.3;
          p.vy += Math.sin(angle) * forceSquared * 0.3;
        }

        // Spring back to home position
        const hx = p.homeX - p.x;
        const hy = p.homeY - p.y;
        p.vx += hx * 0.015;
        p.vy += hy * 0.015;

        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;

        p.x += p.vx;
        p.y += p.vy;
      }

      // Draw the displaced field as subtle connecting lines
      const spacingX = window.innerWidth / (cols - 1);
      const spacingY = window.innerHeight / (rows - 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const p = points[i];

          // How displaced is this point?
          const dispX = p.x - p.homeX;
          const dispY = p.y - p.homeY;
          const displacement = Math.sqrt(dispX * dispX + dispY * dispY);

          if (displacement < 0.3) continue;

          const alpha = Math.min(displacement * 0.008, 0.07);

          // Draw horizontal lines to neighbor
          if (c < cols - 1) {
            const next = points[i + 1];
            const nextDisp = Math.sqrt(
              (next.x - next.homeX) ** 2 + (next.y - next.homeY) ** 2
            );
            const lineAlpha = Math.min((displacement + nextDisp) * 0.004, 0.05);

            if (lineAlpha > 0.003) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(next.x, next.y);
              ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }

          // Draw vertical lines to neighbor below
          if (r < rows - 1) {
            const below = points[i + cols];
            const belowDisp = Math.sqrt(
              (below.x - below.homeX) ** 2 + (below.y - below.homeY) ** 2
            );
            const lineAlpha = Math.min((displacement + belowDisp) * 0.004, 0.05);

            if (lineAlpha > 0.003) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(below.x, below.y);
              ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }

          // Displaced points glow faintly
          if (displacement > 2) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
            ctx.fill();
          }
        }
      }

      // Cursor pressure light — like the water surface dipping
      const pressureRadius = 40 + vel * 0.5;
      const pressureAlpha = 0.008 + vel * 0.0002;
      const pressure = ctx.createRadialGradient(mx, my, 0, mx, my, pressureRadius);
      pressure.addColorStop(0, `rgba(255,255,255,${pressureAlpha})`);
      pressure.addColorStop(0.4, `rgba(255,255,255,${pressureAlpha * 0.15})`);
      pressure.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(mx, my, pressureRadius, 0, Math.PI * 2);
      ctx.fillStyle = pressure;
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

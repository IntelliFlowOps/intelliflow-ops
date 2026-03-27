import { useEffect, useRef } from 'react';

export default function CursorTrail() {
  const animationRef = useRef(null);

  useEffect(() => {
    if ('ontouchstart' in window) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;width:100vw;height:100vh;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let mx = -500, my = -500, vel = 0, angle = 0;

    // Dense field — no visible grid, just light values
    const res = 8;
    let cols, rows, field;

    function buildField() {
      cols = Math.ceil(window.innerWidth / res) + 2;
      rows = Math.ceil(window.innerHeight / res) + 2;
      field = new Float32Array(cols * rows * 4); // x-displacement, y-displacement, vx, vy
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildField();
    }
    resize();

    function handleMove(e) {
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      vel = Math.min(dist, 100);
      if (dist > 0.5) angle = Math.atan2(dy, dx);
      mx = e.clientX;
      my = e.clientY;
    }

    function draw() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const pushRadius = 12 + vel * 0.8;
      const pushStrength = 0.4 + vel * 0.05;

      // Update field physics
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = (r * cols + c) * 4;
          const px = c * res;
          const py = r * res;

          // Distance from cursor
          const dx = px - mx;
          const dy = py - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pushRadius * res && dist > 0) {
            const force = (1 - dist / (pushRadius * res));
            const f = force * force * pushStrength;
            // Push outward from cursor + along movement direction
            field[i + 2] += (dx / dist) * f * 0.6;
            field[i + 3] += (dy / dist) * f * 0.6;
            field[i + 2] += Math.cos(angle) * f * 0.15;
            field[i + 3] += Math.sin(angle) * f * 0.15;
          }

          // Spring back
          field[i + 2] -= field[i] * 0.03;
          field[i + 3] -= field[i + 1] * 0.03;

          // Damping
          field[i + 2] *= 0.94;
          field[i + 3] *= 0.94;

          // Apply velocity
          field[i] += field[i + 2];
          field[i + 1] += field[i + 3];
        }
      }

      // Render — smooth light based on displacement magnitude
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;

      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const i = (r * cols + c) * 4;
          const dispX = field[i];
          const dispY = field[i + 1];
          const displacement = Math.sqrt(dispX * dispX + dispY * dispY);

          if (displacement < 0.15) continue;

          // Light intensity from displacement
          const intensity = Math.min(displacement * 3, 18);

          // Paint a soft area for this cell
          const sx = Math.round(c * res * dpr);
          const sy = Math.round(r * res * dpr);
          const size = Math.round(res * dpr);

          for (let py = sy; py < sy + size && py < canvas.height; py++) {
            for (let px = sx; px < sx + size && px < canvas.width; px++) {
              const pi = (py * w + px) * 4;
              // Soft falloff from cell center
              const cx = sx + size / 2;
              const cy = sy + size / 2;
              const cdist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
              const falloff = Math.max(0, 1 - cdist / (size * 0.7));
              const val = intensity * falloff * falloff;
              data[pi] = Math.min(255, data[pi] + val);
              data[pi + 1] = Math.min(255, data[pi + 1] + val);
              data[pi + 2] = Math.min(255, data[pi + 2] + val);
              data[pi + 3] = Math.min(255, data[pi + 3] + val * 3.5);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Soft gaussian blur pass
      ctx.globalAlpha = 0.85;
      ctx.filter = 'blur(6px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;

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

'use client';

import React, { useEffect, useRef } from 'react';

const RAMP = [
  { i: 0.0, c: [3, 3, 3] },        // #030303
  { i: 0.1, c: [16, 7, 32] },      // #100720
  { i: 0.25, c: [35, 14, 72] },    // #230e48
  { i: 0.45, c: [60, 23, 120] },   // #3c1778
  { i: 0.65, c: [99, 50, 172] },   // #6332ac
  { i: 0.85, c: [154, 95, 232] },  // #9a5fe8
  { i: 1.0, c: [172, 112, 247] }   // #ac70f7
];

function getColor(intensity: number) {
  if (intensity <= 0) return '#030303';
  if (intensity >= 1) return '#ac70f7';
  let lower = RAMP[0], upper = RAMP[1];
  for (let j = 0; j < RAMP.length - 1; j++) {
    if (intensity >= RAMP[j].i && intensity <= RAMP[j+1].i) {
      lower = RAMP[j];
      upper = RAMP[j+1];
      break;
    }
  }
  const t = (intensity - lower.i) / (upper.i - lower.i);
  const r = Math.round(lower.c[0] + (upper.c[0] - lower.c[0]) * t);
  const g = Math.round(lower.c[1] + (upper.c[1] - lower.c[1]) * t);
  const b = Math.round(lower.c[2] + (upper.c[2] - lower.c[2]) * t);
  return `rgb(${r},${g},${b})`;
}

export function GridField({ timeProgress = 0 }: { timeProgress?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let resizeTimeout: NodeJS.Timeout;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // 110% of viewport
      const vpWidth = window.innerWidth;
      const vpHeight = window.innerHeight;
      const width = vpWidth * 1.1;
      const height = vpHeight * 1.1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);

      const isSmall = vpWidth < 600;
      const pitch = isSmall ? 4 : 5;
      const size = isSmall ? 3 : 4; // 1px gap

      const angle = -20 * (Math.PI / 180);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Streak passing through (54% x, 45% y) of the viewport
      const cx = vpWidth * 0.54;
      const cy = vpHeight * 0.45;

      const halfThick = vpHeight * 0.10;

      // Group by color to batch fillRect calls
      const colorBatches: Record<string, [number, number][]> = {};

      for (let x = 0; x < width; x += pitch) {
        for (let y = 0; y < height; y += pitch) {
          // coordinate relative to center point
          const dx = x - cx;
          const dy = y - cy;
          
          // rotate to align with band
          // u is along the band, v is across the band
          const u = dx * cosA - dy * sinA;
          const v = dx * sinA + dy * cosA;

          // distance across the band
          const distV = Math.abs(v);
          if (distV > halfThick * 2) continue; // optimization

          let intensity = 0;

          // band falloff (softness)
          const bandV = Math.max(0, 1 - (distV / halfThick));
          
          if (bandV > 0) {
            // Lobes along u (u=0 is at 54% x)
            // Lobe 1 (54%): u=0
            const l1 = Math.max(0, 1 - Math.abs(u) / (vpWidth * 0.2)) * 1.0;
            // Lobe 2 (27%): distance is cx - 0.27*vpWidth along X, roughly projected to u
            const dx2 = (vpWidth * 0.27) - cx;
            const u2 = dx2 / cosA; 
            const l2 = Math.max(0, 1 - Math.abs(u - u2) / (vpWidth * 0.15)) * 0.6;
            // Lobe 3 (92%):
            const dx3 = (vpWidth * 0.92) - cx;
            const u3 = dx3 / cosA;
            const l3 = Math.max(0, 1 - Math.abs(u - u3) / (vpWidth * 0.25)) * 0.4;

            intensity = bandV * Math.max(l1, l2, l3);
          }

          // Cap intensity behind logo (logo bounds + 8% margin)
          // Logo is roughly 60vw wide centered.
          const logoW = Math.min(Math.max(vpWidth * 0.6, 240), 640);
          const logoH = logoW * (486 / 828);
          const marginW = vpWidth * 0.08;
          const marginH = vpHeight * 0.08;
          
          const inBoxX = Math.abs(x - vpWidth/2) < (logoW/2 + marginW);
          const inBoxY = Math.abs(y - vpHeight/2) < (logoH/2 + marginH);
          
          if (inBoxX && inBoxY && intensity > 0.45) {
            intensity = 0.45;
          }

          if (intensity > 0) {
            const hex = getColor(intensity);
            if (!colorBatches[hex]) colorBatches[hex] = [];
            colorBatches[hex].push([x, y]);
          }
        }
      }

      for (const [hex, points] of Object.entries(colorBatches)) {
        ctx.fillStyle = hex;
        for (const [x, y] of points) {
          ctx.fillRect(x, y, size, size);
        }
      }
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(draw, 150);
    };

    draw();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Drift 4% over the intro along the band axis
  // 4% of viewport width
  // Drift happens via transform controlled by parent based on timeProgress
  const driftX = (timeProgress * 0.04 * 100) * Math.cos(-20 * Math.PI / 180);
  const driftY = (timeProgress * 0.04 * 100) * Math.sin(-20 * Math.PI / 180);

  return (
    <div 
      ref={containerRef}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vw] h-[110vh] overflow-hidden bg-[#030303]"
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block" 
        style={{
          transform: `translate(${driftX}vw, ${driftY}vw)`
        }}
      />
    </div>
  );
}

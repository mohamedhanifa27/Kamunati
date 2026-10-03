'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GridField } from './GridField';

let hasCompleted = false;
let isPlaying = false;


function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function getProgress(t: number, start: number, end: number, easeFn = easeInOutCubic) {
  return easeFn(clamp((t - start) / (end - start), 0, 1));
}

export function IntroGate() {
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(!hasCompleted);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const logoWrapperRef = useRef<HTMLDivElement>(null);
  
  // Masks
  const kStemRef = useRef<SVGPathElement>(null);
  const kArmRef = useRef<SVGPathElement>(null);
  const aTopLegsRef = useRef<SVGPathElement>(null);
  const aTopBarRef = useRef<SVGPathElement>(null);
  
  const mRef = useRef<SVGPathElement>(null);
  const uRef = useRef<SVGPathElement>(null);
  
  const nRef = useRef<SVGPathElement>(null);
  const aBotLegsRef = useRef<SVGPathElement>(null);
  const aBotBarRef = useRef<SVGPathElement>(null);
  
  const tRef = useRef<SVGPathElement>(null);
  const iRef = useRef<SVGPathElement>(null);
  
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const rOffsetRef = useRef<SVGFEOffsetElement>(null);
  const cOffsetRef = useRef<SVGFEOffsetElement>(null);
  const rMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const cMatrixRef = useRef<SVGFEColorMatrixElement>(null);

  const [timeProgress, setTimeProgress] = useState(0);

  const sessionResolvedRef = useRef(false);
  const sessionActiveRef = useRef(false);
  const routeTriggeredRef = useRef(false);
  const reducedMotionSetupRef = useRef(false);
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hasCompleted) {
      setShouldRender(false);
      return;
    }
    
    isPlaying = true;

    document.body.style.overflow = 'hidden';
    const originalPointerEvents = document.body.style.pointerEvents;
    document.body.style.pointerEvents = 'none';

    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        sessionActiveRef.current = !!session?.user;
        sessionResolvedRef.current = true;
        router.prefetch(sessionActiveRef.current ? (window.location.pathname === '/login' ? '/' : window.location.pathname) : '/login');
      })
      .catch(() => {
        sessionActiveRef.current = false;
        sessionResolvedRef.current = true;
        router.prefetch('/login');
      });

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    let startTime = performance.now();
    let rafId: number;

    const tick = (now: number) => {
      const t = now - startTime;
      const progress = t / 2000;
      setTimeProgress(progress);

      if (isReducedMotion) {
        if (!reducedMotionSetupRef.current) {
          reducedMotionSetupRef.current = true;
          // Force all masks to be fully visible immediately
          [kStemRef, kArmRef, aTopLegsRef, aTopBarRef, mRef, uRef, nRef, aBotLegsRef, aBotBarRef, tRef, iRef].forEach(ref => {
            if (ref.current) ref.current.style.strokeDashoffset = '0';
          });
          if (gridWrapperRef.current) gridWrapperRef.current.style.opacity = '1';
        }
        if (t > 400) {
           if (!routeTriggeredRef.current) {
             routeTriggeredRef.current = true;
             const dest = sessionActiveRef.current ? (window.location.pathname === '/login' ? '/' : window.location.pathname) : '/login';
             if (window.location.pathname !== dest) {
               router.replace(dest);
             }
           }
           
           if (containerRef.current) {
             const fade = clamp((t - 400) / 400, 0, 1);
             containerRef.current.style.opacity = (1 - fade).toString();
           }
           if (t > 800) {
             hasCompleted = true;
             document.body.style.overflow = '';
             document.body.style.pointerEvents = originalPointerEvents;
             setShouldRender(false);
             return;
           }
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      // 0.00-0.15s grid fade in
      if (gridWrapperRef.current) {
        const gridFade = clamp(t / 150, 0, 1);
        gridWrapperRef.current.style.opacity = gridFade.toString();
      }

      // K grows 0.00-0.35
      const kStemProg = getProgress(t, 0, 150);
      const kArmProg = getProgress(t, 150, 350);
      if (kStemRef.current) kStemRef.current.style.strokeDashoffset = (1 - kStemProg).toString();
      if (kArmRef.current) kArmRef.current.style.strokeDashoffset = (1 - kArmProg).toString();

      // Camera pull-back 0.35-1.50
      if (logoWrapperRef.current) {
        let currentScale = 1;
        let currentTx = 0;
        if (t <= 350) {
          const pushIn = getProgress(t, 0, 350);
          currentScale = 2.2 + (0.15 * pushIn);
          currentTx = 302;
        } else {
          // Use easeOutCubic for a very smooth camera landing
          const pullBack = getProgress(t, 350, 1500, easeOutCubic);
          currentScale = 2.35 - (1.35 * pullBack);
          currentTx = 302 * (1 - pullBack);
        }
        logoWrapperRef.current.style.transform = `scale(${currentScale}) translateX(${currentTx}px)`;
      }

      // Glitch Effect (1.30 to 1.70 seconds)
      if (t > 1300 && t < 1700) {
        if (Math.random() > 0.4) {
          const intensity = Math.random();
          
          // Vary the displacement scale massively
          if (dispRef.current) dispRef.current.setAttribute('scale', (intensity * 60).toString());
          
          // Randomize Y-axis tearing
          const wantsVertical = Math.random() > 0.8;
          if (dispRef.current) dispRef.current.setAttribute('yChannelSelector', wantsVertical ? 'G' : 'B');
          
          // Randomize RGB offset direction and magnitude
          const dirX = Math.random() > 0.5 ? 1 : -1;
          const dirY = wantsVertical ? (Math.random() > 0.5 ? 1 : -1) : 0;
          if (rOffsetRef.current) {
             rOffsetRef.current.setAttribute('dx', (intensity * 20 * dirX).toString());
             rOffsetRef.current.setAttribute('dy', (intensity * 8 * dirY).toString());
          }
          if (cOffsetRef.current) {
             cOffsetRef.current.setAttribute('dx', (-intensity * 20 * dirX).toString());
             cOffsetRef.current.setAttribute('dy', (-intensity * 8 * dirY).toString());
          }
          
          // Swap RGB split colors occasionally (Red/Cyan vs Magenta/Green)
          if (Math.random() > 0.7) {
             if (rMatrixRef.current) rMatrixRef.current.setAttribute('values', '1 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0');
             if (cMatrixRef.current) cMatrixRef.current.setAttribute('values', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0');
          } else {
             if (rMatrixRef.current) rMatrixRef.current.setAttribute('values', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0');
             if (cMatrixRef.current) cMatrixRef.current.setAttribute('values', '0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0');
          }
          
          // Vary slicing thickness and introduce X noise occasionally
          const freqX = Math.random() > 0.8 ? Math.random() * 0.2 : 0;
          const freqY = 0.02 + Math.random() * 0.8;
          if (turbRef.current) turbRef.current.setAttribute('baseFrequency', `${freqX} ${freqY}`);
          
          // Full logo CSS skew/scale/opacity glitch
          if (logoWrapperRef.current && Math.random() > 0.6) {
             const skewX = (Math.random() - 0.5) * 15;
             const scaleY = 1 + (Math.random() - 0.5) * 0.15;
             logoWrapperRef.current.style.transform += ` skewX(${skewX}deg) scaleY(${scaleY})`;
             logoWrapperRef.current.style.opacity = (0.5 + Math.random() * 0.5).toString();
          } else if (logoWrapperRef.current) {
             logoWrapperRef.current.style.opacity = '1';
          }

        } else {
          // Reset filters for this frame
          if (dispRef.current) dispRef.current.setAttribute('scale', '0');
          if (rOffsetRef.current) {
            rOffsetRef.current.setAttribute('dx', '0');
            rOffsetRef.current.setAttribute('dy', '0');
          }
          if (cOffsetRef.current) {
            cOffsetRef.current.setAttribute('dx', '0');
            cOffsetRef.current.setAttribute('dy', '0');
          }
          if (logoWrapperRef.current) {
             logoWrapperRef.current.style.opacity = '1';
          }
        }
      } else {
        // Reset everything outside glitch window
        if (dispRef.current) dispRef.current.setAttribute('scale', '0');
        if (rOffsetRef.current) {
           rOffsetRef.current.setAttribute('dx', '0');
           rOffsetRef.current.setAttribute('dy', '0');
        }
        if (cOffsetRef.current) {
           cOffsetRef.current.setAttribute('dx', '0');
           cOffsetRef.current.setAttribute('dy', '0');
        }
        if (logoWrapperRef.current) {
           logoWrapperRef.current.style.opacity = '1';
        }
      }

      // A (top) 0.35-0.50
      const aTopLegsProg = getProgress(t, 350, 450);
      const aTopBarProg = getProgress(t, 450, 500);
      if (aTopLegsRef.current) aTopLegsRef.current.style.strokeDashoffset = (1 - aTopLegsProg).toString();
      if (aTopBarRef.current) aTopBarRef.current.style.strokeDashoffset = (1 - aTopBarProg).toString();

      // M 0.50-0.80, U 0.65-0.80
      const mProg = getProgress(t, 500, 800);
      const uProg = getProgress(t, 650, 800);
      if (mRef.current) mRef.current.style.strokeDashoffset = (1 - mProg).toString();
      if (uRef.current) uRef.current.style.strokeDashoffset = (1 - uProg).toString();

      // N 0.80-1.15, A (bot) 1.00-1.15
      const nProg = getProgress(t, 800, 1150);
      const aBotLegsProg = getProgress(t, 1000, 1100);
      const aBotBarProg = getProgress(t, 1050, 1150);
      if (nRef.current) nRef.current.style.strokeDashoffset = (1 - nProg).toString();
      if (aBotLegsRef.current) aBotLegsRef.current.style.strokeDashoffset = (1 - aBotLegsProg).toString();
      if (aBotBarRef.current) aBotBarRef.current.style.strokeDashoffset = (1 - aBotBarProg).toString();

      // T 1.15-1.50, I 1.35-1.50
      const tProg = getProgress(t, 1150, 1500);
      const iProg = getProgress(t, 1350, 1500);
      if (tRef.current) tRef.current.style.strokeDashoffset = (1 - tProg).toString();
      if (iRef.current) iRef.current.style.strokeDashoffset = (1 - iProg).toString();

      // Exit 1.75-2.00
      if (t >= 1750) {
        if (!sessionResolvedRef.current && t < 3000) { // watchdog 3.0s max
          rafId = requestAnimationFrame(tick);
          return;
        }
        
        // Trigger routing exactly at 1.75s once
        if (!routeTriggeredRef.current) {
          routeTriggeredRef.current = true;
          const dest = sessionActiveRef.current ? (window.location.pathname === '/login' ? '/' : window.location.pathname) : '/login';
          if (window.location.pathname !== dest) {
            router.replace(dest);
          }
        }
        
        const exitProg = getProgress(t, 1750, 2000, easeOutCubic);
        if (containerRef.current) {
           containerRef.current.style.opacity = (1 - exitProg).toString();
        }
        
        if (t >= 2000) {
          // Remove from DOM
          hasCompleted = true;
          document.body.style.overflow = '';
          document.body.style.pointerEvents = originalPointerEvents;
          setShouldRender(false);
          return;
        }
      } else if (t > 3000) {
        // Watchdog failsafe
        hasCompleted = true;
        document.body.style.overflow = '';
        document.body.style.pointerEvents = originalPointerEvents;
        setShouldRender(false);
        const dest = sessionActiveRef.current ? (window.location.pathname === '/login' ? '/' : window.location.pathname) : '/login';
        if (window.location.pathname !== dest) router.replace(dest);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      isPlaying = false;
      cancelAnimationFrame(rafId);
      document.body.style.overflow = '';
      document.body.style.pointerEvents = originalPointerEvents;
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, [router]);

  if (!shouldRender) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[2147483647] pointer-events-auto flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#030303' }}
      aria-hidden="true"
    >
      <div ref={gridWrapperRef} className="absolute inset-0 opacity-0">
        <GridField timeProgress={timeProgress} />
      </div>
      
      <div 
        ref={logoWrapperRef} 
        className="relative z-10 w-[60vw] min-w-[240px] max-w-[640px]"
        style={{ transformOrigin: '50% 50%' }}
      >
        <svg viewBox="0 0 828 486" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <filter id="glow-white" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="32" result="blur" />
            </filter>

            <filter id="glitch" x="-20%" y="-20%" width="140%" height="140%">
              {/* 1. Slicing Displacement */}
              <feTurbulence ref={turbRef} type="fractalNoise" baseFrequency="0 0.5" numOctaves="1" result="noise" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0.5  0 0 0 15 -5" in="noise" result="hardNoise" />
              <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="hardNoise" scale="0" xChannelSelector="R" yChannelSelector="B" result="sliced" />
              
              {/* 2. RGB Split on Sliced */}
              <feOffset ref={rOffsetRef} dx="0" dy="0" in="sliced" result="red-shift" />
              <feColorMatrix ref={rMatrixRef} type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" in="red-shift" result="red" />
              
              <feOffset ref={cOffsetRef} dx="0" dy="0" in="sliced" result="cyan-shift" />
              <feColorMatrix ref={cMatrixRef} type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" in="cyan-shift" result="cyan" />
              
              <feBlend mode="screen" in="red" in2="cyan" />
            </filter>

            <clipPath id="clip-k">
              <rect x="0" y="0" width="205" height="486" />
            </clipPath>
            <clipPath id="clip-a-top">
              <rect x="205" y="0" width="828" height="486" />
            </clipPath>
            <clipPath id="clip-m">
              <rect x="0" y="0" width="617" height="486" />
            </clipPath>
            <clipPath id="clip-u">
              <rect x="617" y="0" width="828" height="486" />
            </clipPath>
            <clipPath id="clip-n">
              <rect x="0" y="0" width="245" height="486" />
            </clipPath>
            <clipPath id="clip-a-bot">
              <rect x="245" y="0" width="828" height="486" />
            </clipPath>
            <clipPath id="clip-t">
              <rect x="0" y="0" width="703" height="486" />
            </clipPath>
            <clipPath id="clip-i">
              <rect x="703" y="0" width="828" height="486" />
            </clipPath>

            <mask id="mask-k">
              <path ref={kStemRef} d="M 54 120 L 54 31 M 54 120 L 54 210" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
              <path ref={kArmRef} d="M 54 120 L 210 30 M 54 120 L 210 220" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>
            
            <mask id="mask-a-top">
              <path ref={aTopLegsRef} d="M 198 210 L 277 31 L 404 210" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
              <path ref={aTopBarRef} d="M 270 120 L 340 120" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>

            <mask id="mask-m">
              <path ref={mRef} d="M 435 210 L 435 31 L 513 210 L 590 31 L 590 210" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>
            <mask id="mask-u">
              <path ref={uRef} d="M 590 31 L 590 150 C 590 230, 750 230, 750 150 L 750 31" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>

            <mask id="mask-n">
              <path ref={nRef} d="M 61 451 L 61 224 L 236 451 L 236 224" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>
            <mask id="mask-a-bot">
              <path ref={aBotLegsRef} d="M 236 451 L 337 224 L 498 451" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
              <path ref={aBotBarRef} d="M 330 360 L 400 360" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>

            <mask id="mask-t">
              <path ref={tRef} d="M 449 260 L 771 260 M 580 260 L 580 451" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>
            <mask id="mask-i">
              <path ref={iRef} d="M 736 260 L 736 451" pathLength="1" strokeDasharray="1" strokeDashoffset="1" strokeWidth="150" strokeLinecap="round" strokeLinejoin="round" stroke="white" fill="none" />
            </mask>

            {/* The Logo Shapes Group */}
            <g id="logo-shapes" filter="url(#glitch)">
              {/* Row 1 */}
              <g clipPath="url(#clip-k)"><path mask="url(#mask-k)" fillRule="evenodd" clipRule="evenodd" d="M 26 31 L 26 210 L 82 210 L 83 157 L 124 198 L 141 208 L 149 210 L 198 210 L 198 155 L 168 155 L 161 153 L 131 124 L 190 35 L 192 87 L 252 88 L 211 210 L 269 210 L 277 188 L 337 188 L 340 192 L 345 210 L 404 210 L 357 69 L 355 67 L 344 31 L 128 31 L 83 99 L 82 31 Z M 307 100 L 309 101 L 325 148 L 324 149 L 290 148 Z" /></g>
              <g clipPath="url(#clip-a-top)"><path mask="url(#mask-a-top)" fillRule="evenodd" clipRule="evenodd" d="M 26 31 L 26 210 L 82 210 L 83 157 L 124 198 L 141 208 L 149 210 L 198 210 L 198 155 L 168 155 L 161 153 L 131 124 L 190 35 L 192 87 L 252 88 L 211 210 L 269 210 L 277 188 L 337 188 L 340 192 L 345 210 L 404 210 L 357 69 L 355 67 L 344 31 L 128 31 L 83 99 L 82 31 Z M 307 100 L 309 101 L 325 148 L 324 149 L 290 148 Z" /></g>
              
              <g clipPath="url(#clip-m)"><path mask="url(#mask-m)" fillRule="evenodd" clipRule="evenodd" d="M 398 31 L 398 87 L 417 88 L 417 210 L 473 210 L 474 153 L 512 209 L 514 210 L 554 152 L 555 210 L 610 210 L 611 87 L 623 88 L 624 143 L 629 160 L 638 176 L 652 191 L 661 198 L 677 206 L 693 210 L 719 210 L 742 203 L 758 193 L 771 180 L 780 167 L 785 156 L 789 136 L 789 31 L 734 31 L 733 134 L 730 141 L 719 152 L 710 155 L 702 155 L 691 150 L 682 141 L 679 133 L 679 31 L 554 31 L 514 90 L 507 82 L 473 31 Z" /></g>
              <g clipPath="url(#clip-u)"><path mask="url(#mask-u)" fillRule="evenodd" clipRule="evenodd" d="M 398 31 L 398 87 L 417 88 L 417 210 L 473 210 L 474 153 L 512 209 L 514 210 L 554 152 L 555 210 L 610 210 L 611 87 L 623 88 L 624 143 L 629 160 L 638 176 L 652 191 L 661 198 L 677 206 L 693 210 L 719 210 L 742 203 L 758 193 L 771 180 L 780 167 L 785 156 L 789 136 L 789 31 L 734 31 L 733 134 L 730 141 L 719 152 L 710 155 L 702 155 L 691 150 L 682 141 L 679 133 L 679 31 L 554 31 L 514 90 L 507 82 L 473 31 Z" /></g>

              {/* Row 2 */}
              <g clipPath="url(#clip-n)"><path mask="url(#mask-n)" fillRule="evenodd" clipRule="evenodd" d="M 26 224 L 26 451 L 96 451 L 97 336 L 108 337 L 122 343 L 141 360 L 148 370 L 155 384 L 161 403 L 165 427 L 166 451 L 236 451 L 237 294 L 306 295 L 294 327 L 253 451 L 327 451 L 337 423 L 414 423 L 419 434 L 424 451 L 498 451 L 443 286 L 441 284 L 438 271 L 436 269 L 421 224 L 166 224 L 165 280 L 147 260 L 131 249 L 111 239 L 92 232 L 72 227 L 51 224 Z M 376 309 L 398 373 L 354 374 L 353 373 L 357 360 L 364 343 L 372 316 Z" /></g>
              <g clipPath="url(#clip-a-bot)"><path mask="url(#mask-a-bot)" fillRule="evenodd" clipRule="evenodd" d="M 26 224 L 26 451 L 96 451 L 97 336 L 108 337 L 122 343 L 141 360 L 148 370 L 155 384 L 161 403 L 165 427 L 166 451 L 236 451 L 237 294 L 306 295 L 294 327 L 253 451 L 327 451 L 337 423 L 414 423 L 419 434 L 424 451 L 498 451 L 443 286 L 441 284 L 438 271 L 436 269 L 421 224 L 166 224 L 165 280 L 147 260 L 131 249 L 111 239 L 92 232 L 72 227 L 51 224 Z M 376 309 L 398 373 L 354 374 L 353 373 L 357 360 L 364 343 L 372 316 Z" /></g>
              
              <g clipPath="url(#clip-t)"><path mask="url(#mask-t)" fillRule="evenodd" clipRule="evenodd" d="M 449 224 L 449 294 L 543 295 L 544 451 L 614 451 L 615 294 L 701 295 L 701 451 L 771 451 L 771 224 Z" /></g>
              <g clipPath="url(#clip-i)"><path mask="url(#mask-i)" fillRule="evenodd" clipRule="evenodd" d="M 449 224 L 449 294 L 543 295 L 544 451 L 614 451 L 615 294 L 701 295 L 701 451 L 771 451 L 771 224 Z" /></g>
            </g>
          </defs>

          {/* Deep Purple Outer Glow Layer */}
          <use href="#logo-shapes" fill="#3c1778" filter="url(#glow-purple)" opacity="0.6" />
          
          {/* White Inner Glow Layer + Crisp White Logo on Top */}
          <use href="#logo-shapes" fill="#ffffff" filter="url(#glow-white)" />
          
        </svg>
      </div>
    </div>
  );
}

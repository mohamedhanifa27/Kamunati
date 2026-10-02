"use client";

import { useEffect, useState } from "react";

const letters = ["A", "M", "U", "N", "A", "T", "I"];

export default function Intro({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const finish = window.setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 5000);

    return () => window.clearTimeout(finish);
  }, [onComplete]);

  if (!visible) return null;

  const skip = () => {
    setVisible(false);
    onComplete?.();
  };

  return (
    <div
      className="fixed inset-0 z-[999] grid place-items-center overflow-hidden bg-black text-white"
      role="dialog"
      aria-label="KAMUNATI opening animation"
    >
      <div className="vignette pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.035),transparent_48%),linear-gradient(to_bottom,rgba(255,255,255,.012),transparent_25%,transparent_75%,rgba(255,255,255,.018))]" />

      <div className="pointer-events-none relative h-40 w-[min(92vw,900px)] sm:h-48 md:h-56">
        <div className="logo-settle absolute inset-0 flex items-center justify-center overflow-visible">
          <div className="kamunati-font relative flex items-center justify-center whitespace-nowrap text-[clamp(4rem,15vw,10rem)] font-black leading-none tracking-[-0.07em]">
            <span
              className="k-reveal relative z-20 inline-block"
              style={{
                transformOrigin: "center center",
                textShadow: "0 0 28px rgba(255,255,255,.10)"
              }}
            >
              K
            </span>

            <span className="ml-[0.01em] flex">
              {letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  className="letter-reveal inline-block opacity-0"
                  style={{ animationDelay: `${1150 + index * 170}ms` }}
                >
                  {letter}
                </span>
              ))}
            </span>

            <span className="light-sweep pointer-events-none absolute inset-y-[-10%] left-0 z-30 w-[12%] bg-white/30 blur-2xl" />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={skip}
        className="absolute bottom-7 right-7 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.18em] text-white/60 backdrop-blur transition hover:border-white/40 hover:bg-white/10 hover:text-white"
        aria-label="Skip KAMUNATI intro"
      >
        SKIP
      </button>
    </div>
  );
}

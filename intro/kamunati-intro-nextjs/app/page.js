"use client";

import { useCallback, useState } from "react";
import Intro from "./components";

export default function Home() {
  const [introDone, setIntroDone] = useState(false);
  const completeIntro = useCallback(() => setIntroDone(true), []);

  return (
    <main className="min-h-screen bg-black text-white">
      {!introDone && <Intro onComplete={completeIntro} />}

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.055),transparent_42%)]" />
        <div className="relative z-10 text-center">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.45em] text-white/40">
            Your cinema, your way
          </p>
          <h1 className="kamunati-font text-6xl font-black tracking-[-0.06em] sm:text-8xl">
            KAMUNATI
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
            Replace this section with your movie catalogue, hero banner, search,
            profiles and streaming UI.
          </p>
        </div>
      </section>
    </main>
  );
}

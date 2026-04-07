"use client";

import { useEffect, useState } from "react";

type StickyWorkoutHeroProps = {
  moveSteps: number;
  activeMinutes: number;
  recoveryScore: number;
};

export function StickyWorkoutHero({ moveSteps, activeMinutes, recoveryScore }: StickyWorkoutHeroProps) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setCompact(window.scrollY > 140);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className={`sticky z-40 mt-5 border border-primary-200/40 bg-white/95 backdrop-blur-md transition-all duration-300 dark:border-primary-300/20 dark:bg-primary-950/85 ${
        compact
          ? "top-14 rounded-xl px-4 py-3 shadow-lg"
          : "top-20 rounded-2xl px-5 py-5 shadow-sm"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-200/80">
            Workout command center
          </p>
          <h2 className={`font-bold tracking-tight text-slate-900 dark:text-white ${compact ? "text-lg" : "text-2xl"}`}>
            Keep key metrics visible while you scroll
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-primary-200/35 bg-primary-50/70 px-3 py-2 text-center dark:border-primary-300/20 dark:bg-primary-900/20">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-600 dark:text-primary-100/75">Move</p>
            <p className="text-sm font-bold text-slate-900 dark:text-primary-50">{Math.round(moveSteps).toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-primary-200/35 bg-primary-50/70 px-3 py-2 text-center dark:border-primary-300/20 dark:bg-primary-900/20">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-600 dark:text-primary-100/75">Exercise</p>
            <p className="text-sm font-bold text-slate-900 dark:text-primary-50">{Math.round(activeMinutes)} min</p>
          </div>
          <div className="rounded-lg border border-primary-200/35 bg-primary-50/70 px-3 py-2 text-center dark:border-primary-300/20 dark:bg-primary-900/20">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-600 dark:text-primary-100/75">Recovery</p>
            <p className="text-sm font-bold text-slate-900 dark:text-primary-50">{Math.round(recoveryScore)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

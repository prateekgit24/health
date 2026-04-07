"use client";

import { useState } from "react";

type RingProps = {
  value: number;
  goal: number;
  colorClass: string;
};

function ProgressRing({ value, goal, colorClass }: RingProps) {
  const progress = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <circle cx="32" cy="32" r={radius} strokeWidth="8" fill="none" className="stroke-slate-200 dark:stroke-primary-200/20" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        className={colorClass}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset 300ms ease" }}
      />
      <text x="32" y="36" textAnchor="middle" className="fill-slate-700 text-[10px] font-bold dark:fill-primary-100">
        {progress}%
      </text>
    </svg>
  );
}

export function QuickLogWidgets() {
  const [waterMl, setWaterMl] = useState(0);
  const [caffeineMg, setCaffeineMg] = useState(0);

  const waterGoal = 3000;
  const caffeineLimit = 300;

  return (
    <section className="mt-4 grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-primary-200/40 bg-white p-4 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">One-tap hydration</h3>
            <p className="text-xs text-slate-600 dark:text-primary-100/75">Tap once to log water instantly</p>
          </div>
          <ProgressRing value={waterMl} goal={waterGoal} colorClass="stroke-sky-500" />
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-primary-100">{waterMl.toLocaleString()} ml / {waterGoal.toLocaleString()} ml</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWaterMl((prev) => Math.max(0, prev - 250))}
            className="rounded-full border border-primary-300/40 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-primary-50 dark:border-primary-300/30 dark:text-primary-100 dark:hover:bg-primary-900/40"
            aria-label="Decrease water by 250 milliliters"
          >
            -250 ml
          </button>
          <button
            type="button"
            onClick={() => setWaterMl((prev) => prev + 250)}
            className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
            aria-label="Add 250 milliliters of water"
          >
            +250 ml
          </button>
          <button
            type="button"
            onClick={() => setWaterMl((prev) => prev + 500)}
            className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
            aria-label="Add 500 milliliters of water"
          >
            +500 ml
          </button>
          <button
            type="button"
            onClick={() => setWaterMl(0)}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-primary-300/25 dark:text-primary-100 dark:hover:bg-primary-900/35"
            aria-label="Reset water intake"
          >
            Reset
          </button>
        </div>
      </article>

      <article className="rounded-2xl border border-primary-200/40 bg-white p-4 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">One-tap caffeine</h3>
            <p className="text-xs text-slate-600 dark:text-primary-100/75">Track coffee or tea in a single tap</p>
          </div>
          <ProgressRing value={caffeineMg} goal={caffeineLimit} colorClass="stroke-amber-500" />
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-primary-100">{caffeineMg.toLocaleString()} mg / {caffeineLimit.toLocaleString()} mg</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCaffeineMg((prev) => Math.max(0, prev - 50))}
            className="rounded-full border border-primary-300/40 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-primary-50 dark:border-primary-300/30 dark:text-primary-100 dark:hover:bg-primary-900/40"
            aria-label="Decrease caffeine by 50 milligrams"
          >
            -50 mg
          </button>
          <button
            type="button"
            onClick={() => setCaffeineMg((prev) => prev + 80)}
            className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600"
            aria-label="Log espresso 80 milligrams"
          >
            Espresso 80
          </button>
          <button
            type="button"
            onClick={() => setCaffeineMg((prev) => prev + 120)}
            className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            aria-label="Log coffee 120 milligrams"
          >
            Coffee 120
          </button>
          <button
            type="button"
            onClick={() => setCaffeineMg(0)}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-primary-300/25 dark:text-primary-100 dark:hover:bg-primary-900/35"
            aria-label="Reset caffeine intake"
          >
            Reset
          </button>
        </div>
      </article>
    </section>
  );
}

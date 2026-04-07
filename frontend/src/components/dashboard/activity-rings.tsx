type RingMetric = {
  label: string;
  value: number;
  goal: number;
  colorClass: string;
};

type ActivityRingsProps = {
  move: number;
  exercise: number;
  recover: number;
  moveGoal?: number;
  exerciseGoal?: number;
  recoverGoal?: number;
};

function clampPercent(value: number, goal: number) {
  if (!Number.isFinite(value) || goal <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((value / goal) * 100)));
}

function Ring({ radius, progress, className }: { radius: number; progress: number; className: string }) {
  const normalizedRadius = radius;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <circle
      cx="80"
      cy="80"
      r={normalizedRadius}
      strokeWidth="11"
      fill="none"
      strokeLinecap="round"
      className={className}
      strokeDasharray={circumference}
      strokeDashoffset={offset}
      style={{ transition: "stroke-dashoffset 600ms ease" }}
      transform="rotate(-90 80 80)"
    />
  );
}

export function ActivityRings({
  move,
  exercise,
  recover,
  moveGoal = 10000,
  exerciseGoal = 60,
  recoverGoal = 8,
}: ActivityRingsProps) {
  const metrics: RingMetric[] = [
    {
      label: "Move",
      value: move,
      goal: moveGoal,
      colorClass: "stroke-rose-500",
    },
    {
      label: "Exercise",
      value: exercise,
      goal: exerciseGoal,
      colorClass: "stroke-emerald-500",
    },
    {
      label: "Recover",
      value: recover,
      goal: recoverGoal,
      colorClass: "stroke-sky-500",
    },
  ];

  const moveProgress = clampPercent(move, moveGoal);
  const exerciseProgress = clampPercent(exercise, exerciseGoal);
  const recoverProgress = clampPercent(recover, recoverGoal);

  return (
    <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity Rings</h3>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-primary-100/75">
          Daily goal progress
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative h-40 w-40 shrink-0">
          <svg viewBox="0 0 160 160" className="h-40 w-40" aria-hidden="true">
            <circle cx="80" cy="80" r="58" strokeWidth="11" fill="none" className="stroke-slate-200 dark:stroke-primary-200/20" />
            <circle cx="80" cy="80" r="44" strokeWidth="11" fill="none" className="stroke-slate-200 dark:stroke-primary-200/20" />
            <circle cx="80" cy="80" r="30" strokeWidth="11" fill="none" className="stroke-slate-200 dark:stroke-primary-200/20" />
            <Ring radius={58} progress={moveProgress} className="stroke-rose-500" />
            <Ring radius={44} progress={exerciseProgress} className="stroke-emerald-500" />
            <Ring radius={30} progress={recoverProgress} className="stroke-sky-500" />
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-primary-100/70">Move</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{moveProgress}%</p>
          </div>
        </div>

        <div className="w-full space-y-2">
          {metrics.map((metric) => {
            const progress = clampPercent(metric.value, metric.goal);
            return (
              <div key={metric.label} className="rounded-xl border border-primary-200/35 bg-primary-50/40 p-3 dark:border-primary-300/20 dark:bg-primary-900/25">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-primary-50">{metric.label}</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-primary-100/80">{progress}%</p>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-primary-100/70">
                  {Math.round(metric.value).toLocaleString()} / {Math.round(metric.goal).toLocaleString()}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-primary-200/20">
                  <div className={`h-full rounded-full ${metric.colorClass}`} style={{ width: `${progress}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

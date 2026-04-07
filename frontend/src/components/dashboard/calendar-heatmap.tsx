type HeatmapPoint = {
  date: string;
  value: number;
};

type CalendarHeatmapProps = {
  title?: string;
  data: HeatmapPoint[];
};

function getIntensity(value: number, max: number) {
  if (value <= 0 || max <= 0) {
    return 0;
  }
  const ratio = value / max;
  if (ratio < 0.25) {
    return 1;
  }
  if (ratio < 0.5) {
    return 2;
  }
  if (ratio < 0.75) {
    return 3;
  }
  return 4;
}

function intensityClass(level: number) {
  if (level === 1) {
    return "bg-emerald-200 dark:bg-emerald-900/65";
  }
  if (level === 2) {
    return "bg-emerald-300 dark:bg-emerald-700/75";
  }
  if (level === 3) {
    return "bg-emerald-500 dark:bg-emerald-500/85";
  }
  if (level === 4) {
    return "bg-emerald-700 dark:bg-emerald-300";
  }
  return "bg-slate-200 dark:bg-primary-200/15";
}

export function CalendarHeatmap({ title = "365-day activity heatmap", data }: CalendarHeatmapProps) {
  const maxValue = data.reduce((max, point) => Math.max(max, point.value), 0);

  return (
    <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-600 dark:text-primary-100/75">Low to high intensity</p>
      </div>

      <div className="mt-4 overflow-x-auto pb-2">
        <div className="grid min-w-[780px] grid-flow-col grid-rows-7 gap-1">
          {data.map((point) => {
            const intensity = getIntensity(point.value, maxValue);
            return (
              <div
                key={point.date}
                className={`h-3.5 w-3.5 rounded-sm ${intensityClass(intensity)}`}
                title={`${point.date}: ${Math.round(point.value).toLocaleString()}`}
                aria-label={`${point.date} activity ${Math.round(point.value).toLocaleString()}`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600 dark:text-primary-100/75">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-primary-200/15" />
        <span className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/65" />
        <span className="h-3 w-3 rounded-sm bg-emerald-300 dark:bg-emerald-700/75" />
        <span className="h-3 w-3 rounded-sm bg-emerald-500 dark:bg-emerald-500/85" />
        <span className="h-3 w-3 rounded-sm bg-emerald-700 dark:bg-emerald-300" />
        <span>More</span>
      </div>
    </article>
  );
}

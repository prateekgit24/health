"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OverlayPoint = {
  label: string;
  activeMinutes: number;
  sleepHours: number;
  recoveryScore: number;
};

type PerformanceOverlayChartProps = {
  data: OverlayPoint[];
};

export function PerformanceOverlayChart({ data }: PerformanceOverlayChartProps) {
  const [showActiveMinutes, setShowActiveMinutes] = useState(true);
  const [showSleepHours, setShowSleepHours] = useState(true);
  const [showRecovery, setShowRecovery] = useState(true);

  const visibleCount = useMemo(
    () => Number(showActiveMinutes) + Number(showSleepHours) + Number(showRecovery),
    [showActiveMinutes, showSleepHours, showRecovery],
  );

  return (
    <article className="rounded-2xl border border-primary-200/40 bg-white p-5 shadow-sm dark:border-primary-300/20 dark:bg-primary-950/30">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data overlays</h3>
        <p className="text-xs text-slate-600 dark:text-primary-100/75">Sleep vs active minutes vs recovery</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowActiveMinutes((prev) => !prev)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            showActiveMinutes
              ? "bg-sky-500 text-white"
              : "border border-primary-300/40 bg-white text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
          }`}
        >
          Active minutes
        </button>
        <button
          type="button"
          onClick={() => setShowSleepHours((prev) => !prev)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            showSleepHours
              ? "bg-indigo-500 text-white"
              : "border border-primary-300/40 bg-white text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
          }`}
        >
          Sleep hours
        </button>
        <button
          type="button"
          onClick={() => setShowRecovery((prev) => !prev)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            showRecovery
              ? "bg-emerald-500 text-white"
              : "border border-primary-300/40 bg-white text-slate-700 dark:border-primary-300/30 dark:bg-primary-950/40 dark:text-primary-100"
          }`}
        >
          Recovery
        </button>
      </div>

      {visibleCount === 0 ? (
        <p className="mt-4 text-sm text-slate-700 dark:text-primary-100/80">Select at least one dataset to view chart overlays.</p>
      ) : (
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
              <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#475569", fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {showActiveMinutes ? (
                <Bar yAxisId="left" dataKey="activeMinutes" name="Active min" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              ) : null}
              {showSleepHours ? (
                <Line yAxisId="right" dataKey="sleepHours" name="Sleep h" stroke="#6366f1" strokeWidth={2.4} dot={false} />
              ) : null}
              {showRecovery ? (
                <Line yAxisId="right" dataKey="recoveryScore" name="Recovery" stroke="#10b981" strokeWidth={2.4} dot={false} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

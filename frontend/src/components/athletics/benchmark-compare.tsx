"use client";

import { useMemo, useState } from "react";

type Row = { distance: string; sex: "Male" | "Female"; values: string[] };
type Table = { columns: string[]; rows: Row[] };

type Props = { table: Table };

function parseSingleTime(value: string): number | null {
  const clean = value.trim().toLowerCase().replace("s", "");
  if (!clean) return null;

  if (clean.includes(":")) {
    const [m, s] = clean.split(":");
    const mins = Number(m);
    const secs = Number(s);
    if (Number.isNaN(mins) || Number.isNaN(secs)) return null;
    return mins * 60 + secs;
  }

  const direct = Number(clean);
  return Number.isNaN(direct) ? null : direct;
}

function parseRange(value: string): { min: number | null; max: number | null } {
  const cleaned = value.replace("+", "").trim();
  if (value.includes("+")) {
    return { min: parseSingleTime(cleaned), max: null };
  }

  if (cleaned.includes("-")) {
    const [a, b] = cleaned.split("-");
    return { min: parseSingleTime(a), max: parseSingleTime(b) };
  }

  const single = parseSingleTime(cleaned);
  return { min: single, max: single };
}

export function BenchmarkCompare({ table }: Props) {
  const distances = Array.from(new Set(table.rows.map((row) => row.distance)));
  const [distance, setDistance] = useState(distances[0] ?? "");
  const [sex, setSex] = useState<"Male" | "Female">("Male");
  const [timeInput, setTimeInput] = useState("12.50");

  const selectedRow = useMemo(
    () => table.rows.find((row) => row.distance === distance && row.sex === sex),
    [table.rows, distance, sex],
  );

  const verdict = useMemo(() => {
    if (!selectedRow) return "No benchmark row found.";
    const userTime = parseSingleTime(timeInput);
    if (userTime == null) return "Enter time as seconds (e.g., 12.5) or mm:ss (e.g., 2:05).";

    for (let i = 0; i < selectedRow.values.length; i += 1) {
      const tier = selectedRow.values[i];
      const range = parseRange(tier);

      if (range.max != null && userTime <= range.max) {
        return `Current estimate: ${table.columns[i]} tier (${tier})`;
      }

      if (range.max == null && range.min != null && userTime >= range.min) {
        return `Current estimate: ${table.columns[i]} tier (${tier})`;
      }
    }

    return "You are currently below the listed beginner benchmark. Keep progressing with structured training.";
  }, [selectedRow, timeInput, table.columns]);

  return (
    <section className="mt-6 rounded-2xl border border-primary-200/15 bg-primary-950/25 p-5">
      <h3 className="text-xl font-semibold text-secondary-200">Compare Your Time</h3>
      <p className="mt-2 text-sm text-primary-100/80">
        Enter your time and compare against benchmark tiers.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <select
          value={distance}
          onChange={(event) => setDistance(event.target.value)}
          className="rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2 text-sm"
        >
          {distances.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={sex}
          onChange={(event) => setSex(event.target.value as "Male" | "Female")}
          className="rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2 text-sm"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <input
          value={timeInput}
          onChange={(event) => setTimeInput(event.target.value)}
          placeholder="12.5 or 2:05"
          className="rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2 text-sm"
        />
      </div>

      <p className="mt-4 rounded-lg border border-secondary-300/35 bg-secondary-200/10 px-4 py-3 text-sm text-secondary-100">
        {verdict}
      </p>
    </section>
  );
}

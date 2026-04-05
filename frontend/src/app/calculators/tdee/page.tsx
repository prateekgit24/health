"use client";

import { useMemo, useState } from "react";
import { calculateBmr, calculateTdee } from "@/lib/calculators";

const factors = [
  { label: "Sedentary", value: 1.2 },
  { label: "Lightly active", value: 1.375 },
  { label: "Moderately active", value: 1.55 },
  { label: "Very active", value: 1.725 },
  { label: "Extra active", value: 1.9 },
];

export default function TdeePage() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [factor, setFactor] = useState(1.55);

  const bmr = useMemo(() => calculateBmr(sex, weight, height, age), [sex, weight, height, age]);
  const tdee = useMemo(() => calculateTdee(bmr, factor), [bmr, factor]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold text-emerald-50">TDEE Calculator</h1>
      <p className="mt-3 text-emerald-100/80">TDEE = BMR x activity factor</p>

      <div className="mt-8 rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-6">
        <label className="block text-sm font-medium text-emerald-100/85">Sex</label>
        <select
          value={sex}
          onChange={(e) => setSex(e.target.value as "male" | "female")}
          className="mt-2 w-full rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <label className="mt-5 block text-sm font-medium text-emerald-100/85">Age (years)</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2"
        />

        <label className="mt-5 block text-sm font-medium text-emerald-100/85">Weight (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2"
        />

        <label className="mt-5 block text-sm font-medium text-emerald-100/85">Height (cm)</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2"
        />

        <label className="mt-5 block text-sm font-medium text-emerald-100/85">Activity Level</label>
        <select
          value={factor}
          onChange={(e) => setFactor(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2"
        >
          {factors.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label} ({f.value})
            </option>
          ))}
        </select>

        <p className="mt-6 text-sm text-emerald-100/80">BMR: {Math.round(bmr)} kcal/day</p>
        <p className="mt-1 text-xl font-semibold text-amber-200">Estimated TDEE: {Math.round(tdee)} kcal/day</p>
      </div>
    </main>
  );
}

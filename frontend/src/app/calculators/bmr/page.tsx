"use client";

import { useMemo, useState } from "react";
import { calculateBmr } from "@/lib/calculators";

export default function BmrPage() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [age, setAge] = useState(25);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const bmr = useMemo(() => calculateBmr(sex, weight, height, age), [sex, weight, height, age]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold text-emerald-50">BMR Calculator</h1>
      <p className="mt-3 text-emerald-100/80">Uses the Mifflin-St Jeor equation.</p>

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

        <p className="mt-6 text-xl font-semibold text-amber-200">Estimated BMR: {Math.round(bmr)} kcal/day</p>
      </div>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import { bmiCategory, calculateBmi } from "@/lib/calculators";

export default function BmiPage() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);

  const bmi = useMemo(() => calculateBmi(weight, height), [weight, height]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold text-primary-50">BMI Calculator</h1>
      <p className="mt-3 text-primary-100/80">Formula: weight (kg) / height (m)^2</p>

      <div className="mt-8 rounded-2xl border border-primary-200/15 bg-primary-950/25 p-6">
        <label className="block text-sm font-medium text-primary-100/85">Weight (kg)</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
        />

        <label className="mt-5 block text-sm font-medium text-primary-100/85">Height (cm)</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(Number(e.target.value))}
          className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
        />

        <p className="mt-6 text-xl font-semibold text-secondary-200">BMI: {bmi.toFixed(1)}</p>
        <p className="mt-1 text-sm text-primary-100/80">Category: {bmiCategory(bmi)}</p>
      </div>
    </main>
  );
}

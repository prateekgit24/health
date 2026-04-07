"use client";

import { useMemo, useState } from "react";
import { estimateBodyFatNavy } from "@/lib/calculators";

export default function BodyFatPage() {
  const [sex, setSex] = useState<"male" | "female">("male");
  const [height, setHeight] = useState(170);
  const [waist, setWaist] = useState(80);
  const [neck, setNeck] = useState(38);
  const [hip, setHip] = useState(95);

  const bodyFat = useMemo(
    () => estimateBodyFatNavy(sex, height, waist, neck, sex === "female" ? hip : undefined),
    [sex, height, waist, neck, hip],
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold text-primary-50">Body Fat Calculator</h1>
      <p className="mt-3 text-primary-100/80">
        Uses the US Navy circumference method. This is an estimate, not a medical diagnosis.
      </p>

      <div className="mt-8 rounded-2xl border border-primary-200/15 bg-primary-950/25 p-6">
        <label className="block text-sm font-medium text-primary-100/85">Sex</label>
        <select
          value={sex}
          onChange={(event) => setSex(event.target.value as "male" | "female")}
          className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>

        <label className="mt-5 block text-sm font-medium text-primary-100/85">Height (cm)</label>
        <input
          type="number"
          value={height}
          onChange={(event) => setHeight(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
        />

        <label className="mt-5 block text-sm font-medium text-primary-100/85">Waist (cm)</label>
        <input
          type="number"
          value={waist}
          onChange={(event) => setWaist(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
        />

        <label className="mt-5 block text-sm font-medium text-primary-100/85">Neck (cm)</label>
        <input
          type="number"
          value={neck}
          onChange={(event) => setNeck(Number(event.target.value))}
          className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
        />

        {sex === "female" ? (
          <>
            <label className="mt-5 block text-sm font-medium text-primary-100/85">Hip (cm)</label>
            <input
              type="number"
              value={hip}
              onChange={(event) => setHip(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-primary-100/20 bg-primary-950/40 px-3 py-2"
            />
          </>
        ) : null}

        <p className="mt-6 text-xl font-semibold text-secondary-200">
          Estimated Body Fat: {Math.max(bodyFat, 0).toFixed(1)}%
        </p>
      </div>
    </main>
  );
}

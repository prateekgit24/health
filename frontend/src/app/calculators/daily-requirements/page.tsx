"use client";

import { FormEvent, useState } from "react";
import type { ActivityLevel, GoalType, NutritionRequirements } from "@/lib/profile-types";

const activityOptions: ActivityLevel[] = ["sedentary", "light", "moderate", "active", "very-active"];
const goalOptions: GoalType[] = ["fat-loss", "recomposition", "maintenance", "muscle-gain"];

export default function DailyRequirementsCalculatorPage() {
  const [form, setForm] = useState({
    age: "26",
    sex: "male" as "male" | "female",
    heightCm: "172",
    weightKg: "72",
    activityLevel: "moderate" as ActivityLevel,
    goal: "maintenance" as GoalType,
    weeklyWorkoutDays: "4",
  });
  const [requirements, setRequirements] = useState<NutritionRequirements | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/calculators/daily-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        age: Number(form.age),
        sex: form.sex,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        activityLevel: form.activityLevel,
        goal: form.goal,
        weeklyWorkoutDays: Number(form.weeklyWorkoutDays),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to calculate requirements");
      return;
    }

    setRequirements(data.requirements);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-emerald-50">Daily Requirements Calculator</h1>
      <p className="mt-3 max-w-2xl text-emerald-100/80">
        Estimate daily calories, macros, hydration, and key micronutrients from your body stats and goal.
      </p>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Inputs</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input type="number" value={form.age} onChange={(event) => setForm((prev) => ({ ...prev, age: event.target.value }))} placeholder="Age" className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm" required />
            <select value={form.sex} onChange={(event) => setForm((prev) => ({ ...prev, sex: event.target.value as "male" | "female" }))} className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <input type="number" value={form.heightCm} onChange={(event) => setForm((prev) => ({ ...prev, heightCm: event.target.value }))} placeholder="Height (cm)" className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm" required />
            <input type="number" value={form.weightKg} onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))} placeholder="Weight (kg)" className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm" required />
            <select value={form.activityLevel} onChange={(event) => setForm((prev) => ({ ...prev, activityLevel: event.target.value as ActivityLevel }))} className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm">
              {activityOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select value={form.goal} onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value as GoalType }))} className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm">
              {goalOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input type="number" value={form.weeklyWorkoutDays} onChange={(event) => setForm((prev) => ({ ...prev, weeklyWorkoutDays: event.target.value }))} placeholder="Workout days per week" className="rounded-lg border border-emerald-100/20 bg-emerald-950/40 px-3 py-2 text-sm sm:col-span-2" required />
          </div>
          <button type="submit" className="mt-4 rounded-full bg-amber-300 px-5 py-2 text-sm font-semibold text-zinc-900 hover:bg-amber-200">
            Calculate
          </button>
        </form>

        <section className="rounded-2xl border border-emerald-200/15 bg-emerald-950/25 p-5">
          <h2 className="text-xl font-semibold text-amber-200">Results</h2>
          {!requirements ? <p className="mt-3 text-sm text-emerald-100/75">Fill the form to calculate your requirements.</p> : null}
          {requirements ? (
            <div className="mt-3 grid gap-2 text-sm text-emerald-100/90 sm:grid-cols-2">
              <p>Calories: {requirements.targetCalories} kcal</p>
              <p>BMR: {requirements.bmr}</p>
              <p>TDEE: {requirements.tdee}</p>
              <p>Protein: {requirements.macros.protein_g} g</p>
              <p>Carbs: {requirements.macros.carbs_g} g</p>
              <p>Fat: {requirements.macros.fat_g} g</p>
              <p>Water: {requirements.hydration.water_ml} ml</p>
              <p>Fiber: {requirements.micros.fiber_g} g</p>
              <p>Calcium: {requirements.micros.calcium_mg} mg</p>
              <p>Iron: {requirements.micros.iron_mg} mg</p>
              <p>Vitamin C: {requirements.micros.vitamin_c_mg} mg</p>
              <p>Vitamin D: {requirements.micros.vitamin_d_iu} IU</p>
              <p>Vitamin B12: {requirements.micros.vitamin_b12_mcg} mcg</p>
              <p>Magnesium: {requirements.micros.magnesium_mg} mg</p>
              <p>Zinc: {requirements.micros.zinc_mg} mg</p>
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-rose-100">{error}</p> : null}
        </section>
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase-client";

type LogFoodModalProps = {
  food: {
    slug: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving: string;
  };
  onClose: () => void;
};

export default function LogFoodModal({ food, onClose }: LogFoodModalProps) {
  const [servings, setServings] = useState(1);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    setLoading(true);

    const auth = getFirebaseAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("Please log in to your profile to track meals.");
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dateStr,
          foodSlug: food.slug,
          foodName: food.name,
          servings: servings,
          calories: food.calories * servings,
          protein: food.protein * servings,
          carbs: food.carbs * servings,
          fat: food.fat * servings,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save meal");
      }

      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-primary-200/15 bg-primary-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary-50">Log Food</h2>
          <button onClick={onClose} className="text-primary-100/50 hover:text-primary-100">
            X
          </button>
        </div>

        <div className="mt-4">
          <p className="text-lg font-medium text-secondary-200">{food.name}</p>
          <p className="text-sm text-primary-100/70">Per serving: {food.serving}</p>
        </div>

        {error && <p className="mt-3 rounded-lg bg-alert-500/20 p-2 text-xs text-alert-200">{error}</p>}
        {success && <p className="mt-3 rounded-lg bg-success-500/20 p-2 text-xs text-success-200">Added to your Action Tracker!</p>}

        <div className="mt-6 flex flex-col gap-4">
          <label className="text-sm font-medium text-primary-100">
            Date
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-primary-100/20 bg-primary-900/40 px-3 py-2 text-primary-50 outline-none focus:border-secondary-200"
            />
          </label>

          <label className="text-sm font-medium text-primary-100">
            Number of Servings ({servings})
            <input
              type="range"
              min="0.25"
              max="5"
              step="0.25"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="mt-2 w-full appearance-none rounded-full bg-primary-900/60 outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary-300"
            />
          </label>

          <div className="mt-2 rounded-xl bg-primary-900/30 p-3 text-sm text-primary-100/80">
            <div className="flex justify-between">
              <span>Calories</span>
              <span className="font-medium text-primary-50">{Math.round(food.calories * servings)} kcal</span>
            </div>
            <div className="flex justify-between">
              <span>Protein</span>
              <span className="font-medium text-primary-50">{Math.round(food.protein * servings)}g</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || success}
            className="mt-4 w-full rounded-full bg-secondary-300 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-secondary-200 disabled:opacity-50"
          >
            {loading ? "Saving..." : success ? "Logged!" : "Save to Tracker"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase-client";

// simple inline SVG icons
const Loader2 = ({ className = "" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
const Plus = ({ className = "" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const Search = ({ className = "" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const Trash2 = ({ className = "" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);

type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type AddedFood = {
  id: string; // random string for keying
  name: string;
  serving: string;
  quantity: number | string; // Allow string for "" while typing backspace
  nutrients: Nutrients;
};

type MealName = "breakfast" | "lunch" | "snacks" | "dinner";

type SuggestedFood = {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Props = {
  defaultTarget: Nutrients;
};

export default function MyPlateClient({ defaultTarget }: Props) {
  const [target, setTarget] = useState<Nutrients>(defaultTarget);
  const [meals, setMeals] = useState<Record<MealName, AddedFood[]>>({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {     
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/profile/requirements", {       
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.requirements) {
              setTarget({
                calories: data.requirements.targetCalories,
                protein: data.requirements.macros.protein_g,
                carbs: data.requirements.macros.carbs_g,
                fat: data.requirements.macros.fat_g,
              });
            }
          }
        } catch (e) {
          console.error("Failed to load profile targets", e);
        }
      } else {
        setTarget(defaultTarget);
      }
    });
    return () => unsubscribe();
  }, [defaultTarget]);

  const [activeMeal, setActiveMeal] = useState<MealName>("breakfast");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestedFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [computed, setComputed] = useState<Nutrients | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/nutrition/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.foods || []);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce API call

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddFood = (food: SuggestedFood) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setMeals((prev) => ({
      ...prev,
      [activeMeal]: [
        ...prev[activeMeal],
        {
          id,
          name: food.name,
          serving: food.serving,
          quantity: 1, // default quantity is 1
          nutrients: {
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          },
        },
      ],
    }));
    setQuery("");
    setShowDropdown(false);
    setComputed(null); // Dirty computed when changed
  };

  const handleRemoveFood = (meal: MealName, foodId: string) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((f) => f.id !== foodId),
    }));
    setComputed(null);
  };

  const handleUpdateQuantity = (meal: MealName, foodId: string, val: string) => {
    let newQuant: number | string = val;
    if (val !== "") {
      const parsed = parseFloat(val);
      if (parsed < 0) return; // disallow negative
      newQuant = val; // keep exactly as typed (including decimal point like "2.")
    }
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].map((f) => (f.id === foodId ? { ...f, quantity: newQuant } : f)),
    }));
    setComputed(null);
  };

  const handleCompute = () => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(meals).forEach((mealList) => {
      mealList.forEach((f) => {
        const q = typeof f.quantity === "string" ? parseFloat(f.quantity) || 0 : f.quantity;
        totalCalories += (f.nutrients.calories * q);
        totalProtein += (f.nutrients.protein * q);
        totalCarbs += (f.nutrients.carbs * q);
        totalFat += (f.nutrients.fat * q);
      });
    });

    setComputed({
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    });
  };

  return (
    <div className="space-y-10">
      {/* 1. SELECTION AREA */}
      <section className="grid md:grid-cols-[1fr_2fr] gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary-50 border-b border-primary-800 pb-2">Meals</h2>
          <div className="flex flex-col gap-2">
            {(["breakfast", "lunch", "snacks", "dinner"] as MealName[]).map((m) => (
              <button
                key={m}
                onClick={() => setActiveMeal(m)}
                className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                  activeMeal === m
                    ? "bg-primary-900/50 border-primary-400/50 text-primary-50"
                    : "bg-[#03170f]/80 border-primary-900 text-primary-100/60 hover:bg-primary-900/30 hover:text-primary-100"
                }`}
              >
                <div className="flex justify-between">
                  <span className="capitalize font-medium">{m}</span>
                  <span className="text-xs bg-primary-800/40 text-primary-100 px-2 py-0.5 rounded-full">
                    {meals[m].length} items
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search & List */}
        <div className="space-y-6">
          <div className="bg-[#03170f]/80 border border-primary-900 p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-secondary-200 capitalize mb-4">Adding to {activeMeal}</h3>
            
            {/* Search input with suggestions list */}
            <div className="relative mb-6" ref={containerRef}>
              <div className="flex items-center gap-2 bg-primary-950/40 rounded-xl border border-primary-800/80 px-3 py-2 text-primary-100 placeholder:text-primary-100/40 focus-within:ring-2 focus-within:ring-primary-400">
                <Search className="h-5 w-5 text-primary-100/40" />
                <input
                  type="text"
                  placeholder="E.g., apple, chicken, rice..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (query.length > 0) setShowDropdown(true); }}
                  className="flex-1 bg-transparent py-1 outline-none font-medium"
                />
                {loading && <Loader2 className="h-4 w-4 animate-spin text-primary-400" />}
              </div>
              
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto rounded-xl border border-primary-800 bg-[#0a2a1c] shadow-xl z-10">
                  {suggestions.map((s, idx) => (
                    <li key={idx} className="border-b border-primary-900/50 last:border-0 hover:bg-primary-900/40 cursor-pointer">
                      <button className="w-full text-left px-4 py-3 flex gap-3 items-center justify-between" onClick={() => handleAddFood(s)}>
                        <div className="truncate">
                          <span className="block font-medium text-primary-50 truncate">{s.name}</span>
                          <span className="text-xs text-primary-100/60 block">{s.serving} • {s.calories} kcal</span>
                        </div>
                        <Plus className="h-4 w-4 text-primary-400 shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showDropdown && !loading && query.length > 0 && suggestions.length === 0 && (
                <div className="absolute left-0 right-0 mt-2 px-4 py-3 rounded-xl border border-primary-800 bg-[#0a2a1c] shadow-xl z-10 text-primary-100/60 text-sm list-none border-b border-primary-900/50 last:border-0 hover:bg-primary-900/40 cursor-pointer">
                  No foods match &quot;{query}&quot;.
                </div>
              )}
            </div>

            {/* List for Active Meal */}
            <div className="space-y-3">
              {meals[activeMeal].length === 0 ? (
                <p className="text-sm text-primary-100/50 italic px-2">No items added to {activeMeal} yet.</p>
              ) : (
                meals[activeMeal].map((f) => (
                  <div key={f.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-primary-950/20 border border-primary-800/40 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-semibold text-primary-100 truncate mb-1">{f.name}</p>
                      <p className="text-xs text-primary-100/60 inline-block bg-primary-950/50 px-2 py-0.5 rounded-md border border-primary-900">Base Unit: {f.serving} • {f.nutrients.calories} kcal</p>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`qty-${f.id}`} className="text-xs font-medium text-primary-100/70">Multiplier:</label>
                        <input
                          id={`qty-${f.id}`}
                          type="number"
                          step="1"
                          min="0"
                          value={f.quantity}
                          onChange={(e) => handleUpdateQuantity(activeMeal, f.id, e.target.value)}
                          onBlur={(e) => {
                            if (e.target.value === "") handleUpdateQuantity(activeMeal, f.id, "0");
                          }}
                          className="w-16 bg-primary-900/40 border border-primary-700/50 rounded-lg px-2 py-1 text-sm text-primary-50 text-center focus:outline-none focus:border-primary-400"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveFood(activeMeal, f.id)}
                        className="p-2 text-alert-400/70 hover:text-alert-400 hover:bg-alert-400/10 rounded-full transition-colors flex-shrink-0"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMPUTE BUTTON */}
      <div className="flex justify-center border-t border-primary-900/50 pt-8">
        <button
          onClick={handleCompute}
          className="app-btn-primary min-w-[200px]"
          disabled={Object.values(meals).every((m) => m.length === 0)}
        >
          Compute Daily Nutrients
        </button>
      </div>

      {/* 3. RESULTS */}
      {computed && (
        <section className="bg-primary-900/20 border border-secondary-300/30 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4">
          <h2 className="text-2xl font-bold text-secondary-300 mb-6 text-center">Your Plate vs Target</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Calories" value={computed.calories} target={target.calories} unit="kcal" />
            <MetricCard label="Protein" value={computed.protein} target={target.protein} unit="g" />
            <MetricCard label="Carbs" value={computed.carbs} target={target.carbs} unit="g" />
            <MetricCard label="Fat" value={computed.fat} target={target.fat} unit="g" />
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, target, unit }: { label: string, value: number, target: number, unit: string }) {
  const percentage = Math.min(100, Math.round((value / target) * 100)) || 0;
  const isOver = value > target;
  
  return (
    <div className={`rounded-xl p-4 border ${isOver ? "bg-alert-950/20 border-alert-500/30" : "bg-[#03170f]/80 border-primary-800"}`}>
      <div className="flex items-center justify-between text-sm text-primary-100/70 mb-1.5">
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-primary-50">{value}</span>
        <span className="text-xs text-primary-100/50 whitespace-nowrap">/ {Math.round(target)}{unit}</span>
      </div>

      <div className="mt-3 h-1.5 w-full bg-primary-950/60 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${isOver ? "bg-alert-500" : "bg-secondary-300"}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function calculateBmi(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return weightKg / (heightM * heightM);
}

export function calculateBmr(
  sex: "male" | "female",
  weightKg: number,
  heightCm: number,
  age: number,
) {
  // Mifflin-St Jeor equation.
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTdee(bmr: number, activityFactor: number) {
  return bmr * activityFactor;
}

export function caloriesBurnedFromMets(mets: number, weightKg: number, minutes: number) {
  return (mets * 3.5 * weightKg * minutes) / 200;
}

export function bmiCategory(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

export function estimateBodyFatNavy(
  sex: "male" | "female",
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number,
) {
  if (heightCm <= 0 || waistCm <= 0 || neckCm <= 0) return 0;

  const heightIn = heightCm / 2.54;
  const waistIn = waistCm / 2.54;
  const neckIn = neckCm / 2.54;

  if (sex === "male") {
    const value =
      86.01 * Math.log10(Math.max(waistIn - neckIn, 1)) -
      70.041 * Math.log10(heightIn) +
      36.76;
    return Number.isFinite(value) ? value : 0;
  }

  const hipIn = (hipCm ?? 0) / 2.54;
  if (hipIn <= 0) return 0;

  const value =
    163.205 * Math.log10(Math.max(waistIn + hipIn - neckIn, 1)) -
    97.684 * Math.log10(heightIn) -
    78.387;
  return Number.isFinite(value) ? value : 0;
}

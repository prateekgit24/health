import MyPlateClient from "./my-plate-client";

export const metadata = {
  title: "Calculate My Plate | HOW",
  description: "Sum up nutrients across breakfast, lunch, snacks, and dinner to compare against your TDEE.",
};

export default function MyPlatePage() {
  // Client component will fetch actual profile requirements if logged in
  const defaultTarget = { calories: 2000, protein: 150, carbs: 200, fat: 65 };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight text-primary-50">Calculate My Plate</h1>
        <p className="mt-3 text-primary-100/80">
          Build your meals across Breakfast, Lunch, Snacks, and Dinner to see how your entire day stacks up against your targets.
        </p>
      </div>

      <MyPlateClient defaultTarget={defaultTarget} />
    </main>
  );
}

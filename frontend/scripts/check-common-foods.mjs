import fs from "node:fs";
import path from "node:path";

const baseDir = process.cwd();
const foodsPath = path.join(baseDir, "src", "data", "nutrition", "foods.final.json");
const requiredPath = path.join(baseDir, "src", "data", "nutrition", "common-foods.required.json");

const foods = JSON.parse(fs.readFileSync(foodsPath, "utf8"));
const required = JSON.parse(fs.readFileSync(requiredPath, "utf8"));

const names = foods.map((f) => String(f.name || "").toLowerCase());

const missing = required.filter((term) => {
  const t = String(term).toLowerCase().trim();
  return !names.some((name) => name.includes(t));
});

console.log(`Checked common foods: required=${required.length} available=${foods.length}`);
if (missing.length === 0) {
  console.log("All required common food terms are covered.");
  process.exit(0);
}

console.log("Missing common food terms:");
for (const item of missing) {
  console.log(`- ${item}`);
}
process.exit(1);

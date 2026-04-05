import fs from "node:fs";
import path from "node:path";

const base = process.cwd();
const commonPath = path.join(base, "src", "data", "nutrition", "foods.common.json");
const manualPath = path.join(base, "src", "data", "nutrition", "foods.manual.json");
const usdaPath = path.join(base, "src", "data", "nutrition", "foods.usda.common.seed.json");
const outPath = path.join(base, "src", "data", "nutrition", "foods.final.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function key(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ");
}

const common = readJson(commonPath);
const manual = readJson(manualPath);
const usda = readJson(usdaPath);

const merged = new Map();

for (const item of [...common, ...manual]) {
  merged.set(key(item.name), {
    ...item,
    fdc_id: item.fdc_id ?? null,
    source_url: item.source_url ?? null,
    verified_at: item.verified_at ?? null,
    data_quality_note: item.data_quality_note ?? null,
  });
}

for (const item of usda) {
  const k = key(item.name);
  const existing = merged.get(k);
  if (!existing) {
    merged.set(k, item);
    continue;
  }

  merged.set(k, {
    ...existing,
    ...item,
    source: "USDA FoodData Central",
    verified: true,
    validation_flags: [],
  });
}

const finalData = Array.from(merged.values()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
fs.writeFileSync(outPath, JSON.stringify(finalData, null, 2), { encoding: "utf8" });

console.log(`Final dataset generated: ${finalData.length} records`);

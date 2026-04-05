type AggregatePointValue = {
  intVal?: number;
  fpVal?: number;
};

type AggregatePoint = {
  value?: AggregatePointValue[];
};

type AggregateDataset = {
  dataSourceId?: string;
  point?: AggregatePoint[];
};

type AggregateBucket = {
  startTimeMillis?: string;
  dataset?: AggregateDataset[];
};

type AggregateApiResponse = {
  bucket?: AggregateBucket[];
};

export type GoogleHealthDailyMetric = {
  date: string;
  steps: number;
  caloriesKcal: number;
  distanceMeters: number;
  activeMinutes: number;
  heartMinutes: number;
  avgHeartRateBpm?: number;
};

export type GoogleHealthAggregateMetrics = {
  startTimeMillis: number;
  endTimeMillis: number;
  syncedAt: string;
  steps: number;
  caloriesKcal: number;
  distanceMeters: number;
  activeMinutes: number;
  heartMinutes: number;
  avgHeartRateBpm?: number;
  confidence: "low" | "medium" | "high";
  dailyBuckets: GoogleHealthDailyMetric[];
};

function toNumber(value: AggregatePointValue) {
  return Number(value.fpVal ?? value.intVal ?? 0);
}

function round(value: number, precision = 2) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function resolveConfidence(metrics: GoogleHealthAggregateMetrics) {
  const optionalSignals = [
    metrics.distanceMeters > 0,
    metrics.activeMinutes > 0,
    metrics.heartMinutes > 0,
    typeof metrics.avgHeartRateBpm === "number",
  ].filter(Boolean).length;

  if (optionalSignals >= 3) {
    return "high";
  }

  if (optionalSignals >= 1) {
    return "medium";
  }

  return "low";
}

export async function fetchGoogleHealthAggregate(
  accessToken: string,
  startTimeMillis: number,
  endTimeMillis: number,
) {
  let response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.calories.expended" },
        { dataTypeName: "com.google.distance.delta" },
        { dataTypeName: "com.google.active_minutes" },
        { dataTypeName: "com.google.heart_minutes" },
        { dataTypeName: "com.google.heart_rate.bpm" },
      ],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis,
    }),
  });

  // Fallback: If user has no heart rate/minutes data sources, Google API returns 400 (no default datasource)
  if (response.status === 400) {
    const errorText = await response.text();
    if (errorText.includes("no default datasource")) {
      response = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aggregateBy: [
            { dataTypeName: "com.google.step_count.delta" },
            { dataTypeName: "com.google.calories.expended" },
            { dataTypeName: "com.google.distance.delta" },
            { dataTypeName: "com.google.active_minutes" },
          ],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis,
          endTimeMillis,
        }),
      });
    } else {
      throw new Error(`Google aggregate request failed (${response.status}): ${errorText.slice(0, 500)}`);
    }
  }

  if (!response.ok) {
    let detail = "";
    try { detail = (await response.text()).slice(0, 500); } catch (e) {}
    throw new Error(`Google aggregate request failed (${response.status}): ${detail}`);
  }

  const raw = (await response.json()) as AggregateApiResponse;
  const dailyBuckets: GoogleHealthDailyMetric[] = [];
  const globalHeartRates: number[] = [];

  for (const bucket of raw.bucket ?? []) {
    const dayStart = Number(bucket.startTimeMillis ?? startTimeMillis);
    const daily: GoogleHealthDailyMetric = {
      date: new Date(dayStart).toISOString().slice(0, 10),
      steps: 0,
      caloriesKcal: 0,
      distanceMeters: 0,
      activeMinutes: 0,
      heartMinutes: 0,
    };

    const bucketHeartRates: number[] = [];

    for (const dataset of bucket.dataset ?? []) {
      const sourceId = (dataset.dataSourceId ?? "").toLowerCase();

      for (const point of dataset.point ?? []) {
        for (const value of point.value ?? []) {
          const parsed = toNumber(value);

          if (sourceId.includes("step_count")) {
            daily.steps += parsed;
            continue;
          }

          if (sourceId.includes("calories")) {
            daily.caloriesKcal += parsed;
            continue;
          }

          if (sourceId.includes("distance")) {
            daily.distanceMeters += parsed;
            continue;
          }

          if (sourceId.includes("active_minutes")) {
            daily.activeMinutes += parsed;
            continue;
          }

          if (sourceId.includes("heart_minutes")) {
            daily.heartMinutes += parsed;
            continue;
          }

          if (sourceId.includes("heart_rate") && parsed > 0) {
            bucketHeartRates.push(parsed);
            globalHeartRates.push(parsed);
          }
        }
      }
    }

    if (bucketHeartRates.length > 0) {
      daily.avgHeartRateBpm = round(
        bucketHeartRates.reduce((total, value) => total + value, 0) / bucketHeartRates.length,
      );
    }

    daily.steps = Math.round(daily.steps);
    daily.caloriesKcal = round(daily.caloriesKcal);
    daily.distanceMeters = round(daily.distanceMeters);
    daily.activeMinutes = round(daily.activeMinutes);
    daily.heartMinutes = round(daily.heartMinutes);
    dailyBuckets.push(daily);
  }

  const metrics: GoogleHealthAggregateMetrics = {
    startTimeMillis,
    endTimeMillis,
    syncedAt: new Date().toISOString(),
    steps: dailyBuckets.reduce((total, item) => total + item.steps, 0),
    caloriesKcal: round(dailyBuckets.reduce((total, item) => total + item.caloriesKcal, 0)),
    distanceMeters: round(dailyBuckets.reduce((total, item) => total + item.distanceMeters, 0)),
    activeMinutes: round(dailyBuckets.reduce((total, item) => total + item.activeMinutes, 0)),
    heartMinutes: round(dailyBuckets.reduce((total, item) => total + item.heartMinutes, 0)),
    avgHeartRateBpm:
      globalHeartRates.length > 0
        ? round(globalHeartRates.reduce((total, value) => total + value, 0) / globalHeartRates.length)
        : undefined,
    confidence: "low",
    dailyBuckets,
  };

  metrics.confidence = resolveConfidence(metrics);

  return {
    metrics,
    raw,
  };
}

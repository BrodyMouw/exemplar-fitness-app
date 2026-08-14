// Every weight is stored in kilograms. This module is the only place that
// knows about pounds - convert on the way to the screen, convert back on the
// way to the API, and nothing else has to care.

export type WeightUnit = "Kg" | "Lb";

const LB_PER_KG = 2.20462262;

export function unitLabel(unit: WeightUnit): string {
  return unit === "Lb" ? "lb" : "kg";
}

/** Storage (kg) -> what the user sees, rounded to one decimal. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  const value = unit === "Lb" ? kg * LB_PER_KG : kg;
  return Math.round(value * 10) / 10;
}

/** What the user typed -> storage (kg), kept to two decimals so a
 *  kg -> lb -> kg round trip doesn't visibly drift. */
export function toKg(value: number, unit: WeightUnit): number {
  const kg = unit === "Lb" ? value / LB_PER_KG : value;
  return Math.round(kg * 100) / 100;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${toDisplayWeight(kg, unit)} ${unitLabel(unit)}`;
}

/** Formats an already-converted display value with its unit. */
export function formatDisplayWeight(value: number, unit: WeightUnit): string {
  return `${Math.round(value * 10) / 10} ${unitLabel(unit)}`;
}

/** Plate-sized increments and a sane ceiling for each unit. */
export function weightStepperConfig(unit: WeightUnit) {
  return unit === "Lb"
    ? { step: 5, max: 1100, decimals: 1 }
    : { step: 2.5, max: 500, decimals: 1 };
}

/**
 * A round starting weight in whichever unit the user thinks in, returned as kg
 * for storage. Converting a fixed 20 kg default would show 44.1 lb, which is
 * not a number anyone loads on a bar.
 */
export function defaultWeightKg(unit: WeightUnit): number {
  return unit === "Lb" ? toKg(45, "Lb") : 20;
}

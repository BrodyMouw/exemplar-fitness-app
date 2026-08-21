import {
  defaultWeightKg,
  formatWeight,
  toDisplayWeight,
  toKg,
  unitLabel,
  weightStepperConfig,
} from "../units";

describe("weight conversion", () => {
  it("leaves kilograms untouched", () => {
    expect(toDisplayWeight(82.5, "Kg")).toBe(82.5);
    expect(toKg(82.5, "Kg")).toBe(82.5);
  });

  it("converts kilograms to pounds", () => {
    expect(toDisplayWeight(100, "Lb")).toBe(220.5);
    expect(toDisplayWeight(60, "Lb")).toBe(132.3);
  });

  it("converts pounds back to kilograms", () => {
    expect(toKg(220.5, "Lb")).toBeCloseTo(100, 1);
  });

  it("labels and formats with the active unit", () => {
    expect(unitLabel("Kg")).toBe("kg");
    expect(unitLabel("Lb")).toBe("lb");
    expect(formatWeight(100, "Lb")).toBe("220.5 lb");
    expect(formatWeight(100, "Kg")).toBe("100 kg");
  });
});

describe("stepper round-tripping", () => {
  // Display rounds to 1dp and storage to 2dp, so a value that passes through
  // both could drift a little further on every step. Stepping repeatedly is
  // exactly what a user does, and silent drift would corrupt stored weights
  // over time - so the round trip has to be a fixed point.
  it("does not drift when stepping repeatedly in pounds", () => {
    const { step } = weightStepperConfig("Lb");
    let displayed = toDisplayWeight(55, "Lb");

    for (let i = 0; i < 20; i++) {
      const next = displayed + step;
      const stored = toKg(next, "Lb");
      const rendered = toDisplayWeight(stored, "Lb");

      expect(rendered).toBe(next);
      displayed = rendered;
    }
  });

  it("is stable for kilograms", () => {
    const { step } = weightStepperConfig("Kg");
    let value = 20;

    for (let i = 0; i < 20; i++) {
      value += step;
      expect(toDisplayWeight(toKg(value, "Kg"), "Kg")).toBe(value);
    }
  });
});

describe("stepper configuration", () => {
  it("uses plate-sized increments per unit", () => {
    expect(weightStepperConfig("Kg").step).toBe(2.5);
    expect(weightStepperConfig("Lb").step).toBe(5);
  });
});

describe("default starting weight", () => {
  // Converting a fixed 20 kg default would surface as 44.1 lb - not a number
  // anyone loads on a bar, and it forced typing to correct.
  it("is a round number in the unit the user thinks in", () => {
    expect(toDisplayWeight(defaultWeightKg("Kg"), "Kg")).toBe(20);
    expect(toDisplayWeight(defaultWeightKg("Lb"), "Lb")).toBe(45);
  });

  it("keeps subsequent steps round in pounds", () => {
    const { step } = weightStepperConfig("Lb");
    const first = toDisplayWeight(defaultWeightKg("Lb"), "Lb");

    expect(first + step).toBe(50);
    expect(toDisplayWeight(toKg(first + step, "Lb"), "Lb")).toBe(50);
  });
});

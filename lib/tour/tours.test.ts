import { describe, expect, it } from "vitest";
import { getTour } from "./tours";

// Guards the string tour ids the trades pages pass to <HelpButton> /
// <TourAutoStart> against typos, and that every step is well-formed.
describe("tour registry", () => {
  it.each(["home-welcome", "trades-list", "trade-detail"])(
    "defines the %s tour with steps",
    (id) => {
      const tour = getTour(id);
      expect(tour).toBeDefined();
      expect(tour!.steps.length).toBeGreaterThan(0);
      for (const step of tour!.steps) {
        expect(step.title).not.toBe("");
        expect(step.body).not.toBe("");
      }
    }
  );

  it("returns undefined for an unknown tour", () => {
    expect(getTour("nope")).toBeUndefined();
  });
});

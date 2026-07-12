import { describe, expect, it } from "vitest";
import { computeCurrentStreak } from "./streak";

describe("computeCurrentStreak", () => {
  it("returns 0 for no activity at all", () => {
    expect(computeCurrentStreak([], "2026-07-11")).toBe(0);
  });

  it("counts a single day active today as a 1-day streak", () => {
    expect(computeCurrentStreak(["2026-07-11"], "2026-07-11")).toBe(1);
  });

  it("keeps yesterday's streak alive if today hasn't been recorded yet", () => {
    expect(computeCurrentStreak(["2026-07-10"], "2026-07-11")).toBe(1);
  });

  it("resets to 0 once more than a day has been missed", () => {
    expect(computeCurrentStreak(["2026-07-08"], "2026-07-11")).toBe(0);
  });

  it("counts a run of consecutive days ending today", () => {
    const dates = ["2026-07-11", "2026-07-10", "2026-07-09", "2026-07-08"];
    expect(computeCurrentStreak(dates, "2026-07-11")).toBe(4);
  });

  it("stops counting at the first gap", () => {
    const dates = ["2026-07-11", "2026-07-10", "2026-07-07", "2026-07-06"];
    expect(computeCurrentStreak(dates, "2026-07-11")).toBe(2);
  });

  it("tolerates a duplicate date without double-counting", () => {
    const dates = ["2026-07-11", "2026-07-11", "2026-07-10"];
    expect(computeCurrentStreak(dates, "2026-07-11")).toBe(2);
  });
});

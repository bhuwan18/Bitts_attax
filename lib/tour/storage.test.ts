import { afterEach, describe, expect, it, vi } from "vitest";
import { hasSeenTour, markTourSeen } from "./storage";

function fakeLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tour storage", () => {
  it("reports an unseen tour, then remembers it once marked", () => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });

    expect(hasSeenTour("trades-list")).toBe(false);
    markTourSeen("trades-list");
    expect(hasSeenTour("trades-list")).toBe(true);
  });

  it("tracks tours independently", () => {
    vi.stubGlobal("window", { localStorage: fakeLocalStorage() });

    markTourSeen("trades-list");
    expect(hasSeenTour("trades-list")).toBe(true);
    expect(hasSeenTour("trade-detail")).toBe(false);
  });

  it("treats a tour as seen on the server (no window) so it never auto-opens", () => {
    // node test env: window is undefined unless stubbed.
    expect(hasSeenTour("trades-list")).toBe(true);
    expect(() => markTourSeen("trades-list")).not.toThrow();
  });

  it("does not throw when storage access is blocked", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("storage disabled");
      },
    });

    expect(hasSeenTour("trades-list")).toBe(true); // swallowed → assume seen
    expect(() => markTourSeen("trades-list")).not.toThrow();
  });
});

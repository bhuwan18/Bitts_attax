import { describe, expect, it } from "vitest";
import { firstNameOf } from "./name";

describe("firstNameOf", () => {
  it("takes the leading token of a display name", () => {
    expect(firstNameOf({ username: "bhuwan18", display_name: "Bhuwan Lodha" })).toBe("Bhuwan");
  });

  it("passes a single-word display name through", () => {
    expect(firstNameOf({ username: "pele", display_name: "Pelé" })).toBe("Pelé");
  });

  it("keeps only the first of several names", () => {
    expect(
      firstNameOf({ username: "jvdb", display_name: "Jan van den Berg" })
    ).toBe("Jan");
  });

  it("tolerates messy whitespace", () => {
    expect(firstNameOf({ username: "ada", display_name: "  Ada   Lovelace " })).toBe("Ada");
  });

  it("falls back to the username, unsplit, when there's no display name", () => {
    // A handle isn't a name — "bhuwan18" has no first name to take.
    expect(firstNameOf({ username: "bhuwan18", display_name: null })).toBe("bhuwan18");
    expect(firstNameOf({ username: "bhuwan18", display_name: "   " })).toBe("bhuwan18");
  });

  it("returns null when there's no profile at all", () => {
    expect(firstNameOf(null)).toBeNull();
    expect(firstNameOf(undefined)).toBeNull();
  });
});

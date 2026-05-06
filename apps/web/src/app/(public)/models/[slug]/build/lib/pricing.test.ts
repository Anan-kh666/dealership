import { describe, it, expect } from "vitest";
import { computeTotal, formatRM } from "./pricing";

describe("formatRM", () => {
  it("formats whole-number ringgit with comma thousand-separators", () => {
    expect(formatRM(285000)).toBe("RM 285,000");
  });

  it("rounds away decimals (no fraction digits)", () => {
    expect(formatRM(285000.49)).toBe("RM 285,000");
    expect(formatRM(285000.5)).toBe("RM 285,001");
  });

  it("returns RM 0 for non-finite input", () => {
    expect(formatRM(Number.NaN)).toBe("RM 0");
    expect(formatRM(Number.POSITIVE_INFINITY)).toBe("RM 0");
  });

  it("formats sub-thousand values without commas", () => {
    expect(formatRM(750)).toBe("RM 750");
  });

  it("formats millions correctly", () => {
    expect(formatRM(1_250_000)).toBe("RM 1,250,000");
  });
});

describe("computeTotal", () => {
  it("returns the trim base when nothing is selected", () => {
    const total = computeTotal({
      trimPrice: "200000.00",
      exteriorColorId: null,
      trimColors: [],
      trimOptions: [],
      selectedOptionIds: [],
    });
    expect(total).toBe(200000);
  });

  it("adds exterior colour upcharge when selected", () => {
    const total = computeTotal({
      trimPrice: "200000.00",
      exteriorColorId: "c1",
      trimColors: [{ colorId: "c1", upcharge: "2500.00" }],
      trimOptions: [],
      selectedOptionIds: [],
    });
    expect(total).toBe(202500);
  });

  it("sums selected option deltas and ignores unknown ids", () => {
    const total = computeTotal({
      trimPrice: "200000.00",
      exteriorColorId: null,
      trimColors: [],
      trimOptions: [
        { id: "o1", price: "1500.00" },
        { id: "o2", price: "3000.00" },
      ],
      selectedOptionIds: ["o1", "o2", "stale-id"],
    });
    expect(total).toBe(204500);
  });
});

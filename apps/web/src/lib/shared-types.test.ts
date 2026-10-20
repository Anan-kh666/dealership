import { describe, expect, it } from "vitest";
import {
  calculateMalaysianLoan,
  financingReferenceFromId,
  registerSchema,
  testDriveReferenceFromId,
  tradeInIdSuffixFromReference,
  tradeInReferenceFromId,
} from "@dealership/types";

describe("reference numbers", () => {
  const id = "clx9abc123def456ghi789xyz";
  it("formats prefix + last six chars uppercased", () => {
    expect(testDriveReferenceFromId(id)).toBe("TD-789XYZ");
    expect(tradeInReferenceFromId(id)).toBe("TI-789XYZ");
    expect(financingReferenceFromId(id)).toBe("FA-789XYZ");
  });

  it("round-trips a trade-in reference to its id suffix", () => {
    expect(tradeInIdSuffixFromReference(" ti-789XYZ ")).toBe("789xyz");
    expect(tradeInIdSuffixFromReference("TD-789XYZ")).toBeNull();
    expect(tradeInIdSuffixFromReference("TI-12345")).toBeNull();
  });
});

describe("calculateMalaysianLoan (flat rate)", () => {
  it("matches the bank flat-rate formula", () => {
    const r = calculateMalaysianLoan({
      vehiclePrice: 100_000,
      downPaymentPercent: 10,
      tenureYears: 9,
      interestRatePercent: 2.5,
    });
    expect(r.downPaymentAmount).toBe(10_000);
    expect(r.principal).toBe(90_000);
    expect(r.totalInterest).toBeCloseTo(20_250);
    expect(r.monthlyPayment).toBeCloseTo(110_250 / 108);
  });

  it("returns zeros for invalid input", () => {
    expect(
      calculateMalaysianLoan({
        vehiclePrice: -1,
        downPaymentPercent: 10,
        tenureYears: 9,
        interestRatePercent: 2.5,
      }).monthlyPayment,
    ).toBe(0);
  });
});

describe("registerSchema", () => {
  it("normalises email and accepts an empty phone", () => {
    const r = registerSchema.parse({
      name: "Aisyah",
      email: "  Aisyah@Example.COM ",
      phone: "",
      password: "longenough",
    });
    expect(r.email).toBe("aisyah@example.com");
  });

  it("rejects short passwords and landline phones", () => {
    expect(
      registerSchema.safeParse({ name: "A", email: "a@b.co", password: "short" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: "A",
        email: "a@b.co",
        phone: "+60378012345",
        password: "longenough",
      }).success,
    ).toBe(false);
  });
});

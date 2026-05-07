import { describe, expect, it } from "vitest";
import {
  passwordSchema,
  malaysianIcStrict,
  mlPhone,
} from "@dealership/types";

describe("passwordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(passwordSchema.safeParse("ab1").success).toBe(false);
  });

  it("rejects passwords with no number", () => {
    expect(passwordSchema.safeParse("password").success).toBe(false);
  });

  it("rejects passwords with no letter", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("accepts an 8-char alphanumeric password", () => {
    expect(passwordSchema.safeParse("hello123").success).toBe(true);
  });

  it("rejects passwords longer than 128 characters", () => {
    expect(passwordSchema.safeParse("a1" + "x".repeat(127)).success).toBe(false);
  });
});

describe("malaysianIcStrict", () => {
  it("accepts the canonical XXXXXX-XX-XXXX shape", () => {
    expect(malaysianIcStrict.safeParse("900101-14-5678").success).toBe(true);
  });

  it("rejects ICs without the dashes", () => {
    expect(malaysianIcStrict.safeParse("900101145678").success).toBe(false);
  });

  it("rejects ICs with the wrong digit count", () => {
    expect(malaysianIcStrict.safeParse("90010-14-5678").success).toBe(false);
  });

  it("rejects ICs with letters", () => {
    expect(malaysianIcStrict.safeParse("9001A1-14-5678").success).toBe(false);
  });
});

describe("mlPhone (+60 mobile)", () => {
  it("accepts a local 0XX number", () => {
    expect(mlPhone.safeParse("012-3456789").success).toBe(true);
  });

  it("accepts a +60 international number", () => {
    expect(mlPhone.safeParse("+60123456789").success).toBe(true);
  });

  it("rejects landlines (03-…)", () => {
    expect(mlPhone.safeParse("03-12345678").success).toBe(false);
  });

  it("rejects too-short numbers", () => {
    expect(mlPhone.safeParse("0123456").success).toBe(false);
  });
});

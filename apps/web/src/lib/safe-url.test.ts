import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./safe-url";

describe("safeCallbackUrl", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeCallbackUrl("/account/test-drives")).toBe("/account/test-drives");
    expect(safeCallbackUrl("/admin?status=NEW")).toBe("/admin?status=NEW");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeCallbackUrl("https://evil.example/phish")).toBe("/account");
    expect(safeCallbackUrl("//evil.example")).toBe("/account");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/account");
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/account");
  });

  it("falls back for missing or non-string input", () => {
    expect(safeCallbackUrl(null)).toBe("/account");
    expect(safeCallbackUrl(undefined, "/")).toBe("/");
    expect(safeCallbackUrl(42)).toBe("/account");
  });
});

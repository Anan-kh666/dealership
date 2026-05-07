import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the prisma client BEFORE importing the module under test.
const mocks = vi.hoisted(() => ({
  testDriveCount: vi.fn(),
  financeCount: vi.fn(),
  tradeInCount: vi.fn(),
  testDriveUpdateMany: vi.fn(),
  financeUpdateMany: vi.fn(),
  tradeInUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@dealership/db", () => ({
  prisma: {
    testDrive: {
      count: mocks.testDriveCount,
      updateMany: mocks.testDriveUpdateMany,
    },
    financeApplication: {
      count: mocks.financeCount,
      updateMany: mocks.financeUpdateMany,
    },
    tradeIn: {
      count: mocks.tradeInCount,
      updateMany: mocks.tradeInUpdateMany,
    },
    user: { update: mocks.userUpdate },
    $transaction: mocks.transaction,
  },
}));

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
});

describe("countClaimable", () => {
  it("matches by lowercase email and sums across tables", async () => {
    mocks.testDriveCount.mockResolvedValue(2);
    mocks.financeCount.mockResolvedValue(1);
    mocks.tradeInCount.mockResolvedValue(0);
    const { countClaimable } = await import("../claim");

    const out = await countClaimable("Foo@Example.COM");
    expect(out).toEqual({
      testDrives: 2,
      financeApplications: 1,
      tradeIns: 0,
      total: 3,
    });
    // All three calls receive the lowercased email + insensitive mode.
    expect(mocks.testDriveCount).toHaveBeenCalledWith({
      where: {
        userId: null,
        guestEmail: { equals: "foo@example.com", mode: "insensitive" },
      },
    });
    expect(mocks.financeCount).toHaveBeenCalledWith({
      where: {
        userId: null,
        email: { equals: "foo@example.com", mode: "insensitive" },
      },
    });
    expect(mocks.tradeInCount).toHaveBeenCalledWith({
      where: {
        userId: null,
        contactEmail: { equals: "foo@example.com", mode: "insensitive" },
      },
    });
  });
});

describe("claimAllForUser", () => {
  it("links every matching row to the user and stamps claimedAt", async () => {
    mocks.transaction.mockResolvedValue([
      { count: 3 },
      { count: 1 },
      { count: 0 },
    ]);
    mocks.testDriveUpdateMany.mockReturnValue("td");
    mocks.financeUpdateMany.mockReturnValue("fa");
    mocks.tradeInUpdateMany.mockReturnValue("ti");
    mocks.userUpdate.mockResolvedValue({});

    const { claimAllForUser } = await import("../claim");
    const out = await claimAllForUser("u1", "Foo@Example.com");

    expect(out).toEqual({
      testDrives: 3,
      financeApplications: 1,
      tradeIns: 0,
      total: 4,
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { claimedAt: expect.any(Date) },
    });
  });
});

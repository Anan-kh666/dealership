import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "./server.js";
import { escapeHtml } from "./lib/mailer.js";
import { isClosedDay } from "./lib/slots.js";

/**
 * Request-level checks that short-circuit before touching the database, so
 * they run in CI without Postgres.
 */
let server: FastifyInstance;
beforeAll(async () => {
  server = await buildServer();
});
afterAll(async () => {
  await server.close();
});

describe("test-drive availability", () => {
  it("returns no slots on Sundays", async () => {
    // 2026-10-25 is a Sunday.
    const res = await server.inject({ url: "/public/test-drives/availability?date=2026-10-25" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ date: "2026-10-25", slots: [] });
  });

  it("returns no slots on public holidays", async () => {
    const res = await server.inject({ url: "/public/test-drives/availability?date=2026-08-31" });
    expect(res.json()).toEqual({ date: "2026-08-31", slots: [] });
  });

  it("rejects malformed dates", async () => {
    const res = await server.inject({ url: "/public/test-drives/availability?date=31-08-2026" });
    expect(res.statusCode).toBe(400);
  });
});

describe("request validation", () => {
  it("rejects a test-drive booking without contact details", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/public/test-drives",
      payload: { scheduledAt: "2026-10-27T01:00:00.000Z" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects a trade-in without consent", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/public/trade-ins",
      payload: { make: "Proton", model: "X50", year: 2022, consent: false },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 503 for uploads when storage isn't configured", async () => {
    const saved = process.env.R2_BUCKET;
    delete process.env.R2_BUCKET;
    const res = await server.inject({
      method: "POST",
      url: "/public/uploads/presign",
      payload: { purpose: "trade-in", contentType: "image/jpeg", fileSize: 1000 },
    });
    if (saved !== undefined) process.env.R2_BUCKET = saved;
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ error: "storage_not_configured" });
  });
});

describe("helpers", () => {
  it("escapes HTML in notification emails", () => {
    expect(escapeHtml(`<b>"Tan" & 'Co'</b>`)).toBe(
      "&lt;b&gt;&quot;Tan&quot; &amp; &#39;Co&#39;&lt;/b&gt;",
    );
  });

  it("knows Sundays and holidays are closed", () => {
    expect(isClosedDay("2026-10-25")).toBe(true); // Sunday
    expect(isClosedDay("2026-12-25")).toBe(true); // Christmas
    expect(isClosedDay("2026-10-27")).toBe(false); // Tuesday
  });
});

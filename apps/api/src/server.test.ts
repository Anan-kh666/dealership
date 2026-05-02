import { describe, expect, it } from "vitest";
import { buildServer } from "./server.js";

describe("buildServer", () => {
  it("responds to /health with ok", async () => {
    const server = await buildServer();
    try {
      const res = await server.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      const body = res.json() as { status: string; timestamp: string };
      expect(body.status).toBe("ok");
      expect(typeof body.timestamp).toBe("string");
    } finally {
      await server.close();
    }
  });
});

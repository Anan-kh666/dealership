import type { FastifyServerOptions } from "fastify";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Logger options passed to Fastify so it owns the pino instance directly —
 * avoids the FastifyBaseLogger / pino.Logger type mismatch you hit when
 * passing `loggerInstance` together with a typed type-provider.
 */
export const loggerOptions: FastifyServerOptions["logger"] = {
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss.l" },
        },
      }
    : {}),
};

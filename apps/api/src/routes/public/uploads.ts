import { nanoid } from "nanoid";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { presignRequestSchema } from "@dealership/types";
import { presignR2Put, readR2Config } from "../../lib/r2.js";
import { createRateLimiter } from "../../lib/rate-limit.js";

const PRESIGN_TTL_SECONDS = 5 * 60;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

const presignLimiter = createRateLimiter({
  max: 30,
  windowMs: 60 * 60 * 1000,
});

export const uploadsPublicRoutes: FastifyPluginAsyncZod = async (server) => {
  server.post(
    "/uploads/presign",
    {
      schema: {
        body: presignRequestSchema,
      },
    },
    async (request, reply) => {
      const limit = presignLimiter.check(request.ip);
      if (!limit.ok) {
        return reply
          .code(429)
          .header("retry-after", String(limit.retryAfter))
          .send({ error: "rate_limited" });
      }

      const cfg = readR2Config();
      if (!cfg) {
        request.log.warn(
          "presign requested but R2 is not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT must all be set)",
        );
        return reply.code(503).send({ error: "storage_not_configured" });
      }

      const { contentType, fileSize, purpose } = request.body;
      const ext = EXT_BY_TYPE[contentType] ?? "bin";
      const key = `${purpose}/${nanoid(24)}.${ext}`;

      const { uploadUrl, publicUrl } = await presignR2Put({
        cfg,
        key,
        contentType,
        contentLength: fileSize,
        expiresIn: PRESIGN_TTL_SECONDS,
      });

      return { uploadUrl, publicUrl, key, expiresIn: PRESIGN_TTL_SECONDS };
    },
  );
};

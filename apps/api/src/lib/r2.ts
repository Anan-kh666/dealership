import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
  publicBaseUrl: string;
}

let cachedClient: S3Client | null = null;

export function readR2Config(): R2Config | null {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const endpoint = process.env.R2_ENDPOINT;
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) return null;
  // R2 public URL pattern is `${endpoint}/${bucket}/${key}` when using a
  // bucket-prefixed public domain. Operators using a custom CDN domain can
  // override via R2_PUBLIC_BASE_URL.
  const publicBaseUrl =
    process.env.R2_PUBLIC_BASE_URL ?? `${endpoint.replace(/\/+$/, "")}/${bucket}`;
  return { accessKeyId, secretAccessKey, bucket, endpoint, publicBaseUrl };
}

export function getR2Client(cfg: R2Config): S3Client {
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });
  return cachedClient;
}

export async function presignR2Put(opts: {
  cfg: R2Config;
  key: string;
  contentType: string;
  contentLength: number;
  expiresIn: number;
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  const client = getR2Client(opts.cfg);
  const command = new PutObjectCommand({
    Bucket: opts.cfg.bucket,
    Key: opts.key,
    ContentType: opts.contentType,
    ContentLength: opts.contentLength,
  });
  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: opts.expiresIn,
  });
  const publicUrl = `${opts.cfg.publicBaseUrl.replace(/\/+$/, "")}/${opts.key}`;
  return { uploadUrl, publicUrl };
}

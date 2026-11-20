
import 'dotenv/config';

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${name} must be a positive number`);
  return value;
}

const port = numberFromEnv('PORT', 3000);
const serviceBaseUrl = process.env.RENDER_EXTERNAL_URL ?? `http://localhost:${port}`;

export const config = {
  port,
  redisUrl: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  temporalAddress: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  temporalTaskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'hotel-offer-task-queue',
  supplierAUrl: process.env.SUPPLIER_A_URL ?? `${serviceBaseUrl}/supplierA/hotels`,
  supplierBUrl: process.env.SUPPLIER_B_URL ?? `${serviceBaseUrl}/supplierB/hotels`,
  supplierTimeoutMs: numberFromEnv('SUPPLIER_TIMEOUT_MS', 5000),
  cacheTtlSeconds: numberFromEnv('CACHE_TTL_SECONDS', 3600),
  nodeEnv: process.env.NODE_ENV ?? 'development',
};


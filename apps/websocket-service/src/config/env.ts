import dotenv from "dotenv";
import { resolve } from "node:path";
import { getNumberEnv } from "@risk-engine/utils";

dotenv.config({ path: resolve(__dirname, "../../../../.env") });

export function getWebsocketPort(): number {
  return getNumberEnv("WS_SERVICE_PORT", 4001);
}

export function getRedisStreamName(): string {
  return process.env.REDIS_STREAM_NAME ?? "platform-events";
}

export function getAllowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
}


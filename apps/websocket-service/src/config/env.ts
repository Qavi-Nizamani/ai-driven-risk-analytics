import dotenv from "dotenv";
import { getNumberEnv } from "@risk-engine/utils";

dotenv.config();

export function getWebsocketPort(): number {
  return getNumberEnv("WS_SERVICE_PORT", 4001);
}

export function getRedisStreamName(): string {
  return process.env.REDIS_STREAM_NAME ?? "platform-events";
}

export function getAllowedOrigin(): string {
  return process.env.ALLOWED_ORIGIN ?? "http://localhost:3000";
}


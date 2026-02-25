import dotenv from "dotenv";
import { getNumberEnv } from "@risk-engine/utils";

dotenv.config();

export function getApiGatewayPort(): number {
  return getNumberEnv("API_GATEWAY_PORT", 4000);
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  return url;
}

export function getRedisStreamName(): string {
  return process.env.REDIS_STREAM_NAME ?? "platform-events";
}

export function getRiskQueueName(): string {
  return process.env.ANOMALY_QUEUE_NAME ?? "risk-scoring";
}

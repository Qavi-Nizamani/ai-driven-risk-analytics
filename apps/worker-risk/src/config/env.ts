import dotenv from "dotenv";
import { getNumberEnv } from "@risk-engine/utils";

dotenv.config();

export function getWorkerPort(): number {
  return getNumberEnv("WORKER_PORT", 4002);
}

export function getMongoUri(): string {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  return uri;
}

export function getRiskQueueName(): string {
  return process.env.ANOMALY_QUEUE_NAME ?? "risk-scoring";
}

export function getRedisStreamName(): string {
  return process.env.REDIS_STREAM_NAME ?? "installment-events";
}


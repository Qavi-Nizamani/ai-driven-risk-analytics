import dotenv from "dotenv";
import { getNumberEnv } from "@risk-engine/utils";

dotenv.config();

export function getMongoUri(): string {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is required");
  }

  return uri;
}

export function getIngestionPort(): number {
  return getNumberEnv("INGESTION_PORT", 4100);
}

export function getAnomalyQueueName(): string {
  return process.env.ANOMALY_QUEUE_NAME ?? "anomaly-detection";
}


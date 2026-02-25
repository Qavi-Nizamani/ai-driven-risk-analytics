import dotenv from "dotenv";
import { getNumberEnv } from "@risk-engine/utils";

dotenv.config();

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  return url;
}

export function getIngestionPort(): number {
  return getNumberEnv("INGESTION_PORT", 4100);
}

export function getAnomalyQueueName(): string {
  return process.env.ANOMALY_QUEUE_NAME ?? "anomaly-detection";
}

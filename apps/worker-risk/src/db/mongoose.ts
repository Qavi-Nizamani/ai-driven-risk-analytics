import mongoose from "mongoose";
import { createLogger } from "@risk-engine/logger";
import { getMongoUri } from "../config/env";

const logger = createLogger("worker-risk:db");

export async function connectMongo(): Promise<void> {
  const uri = getMongoUri();

  await mongoose.connect(uri);
  logger.info({ uri }, "Connected to MongoDB (worker)");
}


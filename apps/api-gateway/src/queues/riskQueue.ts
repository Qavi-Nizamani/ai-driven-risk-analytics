import { Queue } from "bullmq";
import { getBullMqConnectionOptions } from "@risk-engine/redis";
import { getRiskQueueName } from "../config/env";

export interface RiskJobPayload {
  customerId: string;
}

const queueName = getRiskQueueName();

export const riskQueue = new Queue<RiskJobPayload>(queueName, {
  connection: getBullMqConnectionOptions()
});

export async function enqueueRiskJob(customerId: string): Promise<void> {
  await riskQueue.add("risk-score", { customerId });
}


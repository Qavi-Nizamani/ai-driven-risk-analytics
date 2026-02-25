import { getRedisClient } from "@risk-engine/redis";
import {
  emitInstallmentCreated,
  emitInstallmentMarkedLate,
  emitInstallmentPaid,
  type RedisStreamClient
} from "@risk-engine/events";
import { getRedisStreamName } from "../config/env";

const redisClient = getRedisClient();
const streamClient: RedisStreamClient = redisClient as unknown as RedisStreamClient;

const streamName = getRedisStreamName();

export async function publishInstallmentCreated(installmentId: string, customerId: string): Promise<void> {
  await emitInstallmentCreated(
    streamClient,
    {
      installmentId,
      customerId
    },
    streamName
  );
}

export async function publishInstallmentPaid(installmentId: string, customerId: string): Promise<void> {
  await emitInstallmentPaid(
    streamClient,
    {
      installmentId,
      customerId
    },
    streamName
  );
}

export async function publishInstallmentMarkedLate(
  installmentId: string,
  customerId: string
): Promise<void> {
  await emitInstallmentMarkedLate(
    streamClient,
    {
      installmentId,
      customerId
    },
    streamName
  );
}


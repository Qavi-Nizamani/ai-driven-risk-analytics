import type Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisClient } from "./redisClient";

export async function createSocketIoRedisAdapter() {
  const pubClient: Redis = createRedisClient();
  const subClient: Redis = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  return createAdapter(pubClient, subClient);
}


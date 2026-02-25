import type { ConnectionOptions } from "bullmq";
import { getRedisConfig } from "./redisClient";

export function getBullMqConnectionOptions(): ConnectionOptions {
  const config = getRedisConfig();

  return {
    host: config.host,
    port: config.port,
    password: config.password
  };
}


import Redis from "ioredis";

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

let sharedClient: Redis | null = null;

export function getRedisConfig(): RedisConfig {
  const host = process.env.REDIS_HOST ?? "localhost";
  const portRaw = process.env.REDIS_PORT ?? "6379";
  const port = Number(portRaw);

  if (Number.isNaN(port)) {
    throw new Error(`Invalid REDIS_PORT value: ${portRaw}`);
  }

  const password = process.env.REDIS_PASSWORD;

  return { host, port, password };
}

export function createRedisClient(config: RedisConfig = getRedisConfig()): Redis {
  return new Redis({
    host: config.host,
    port: config.port,
    password: config.password
  });
}

export function getRedisClient(): Redis {
  if (!sharedClient) {
    sharedClient = createRedisClient();
  }

  return sharedClient;
}


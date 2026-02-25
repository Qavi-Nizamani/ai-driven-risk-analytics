import Redis from "ioredis";
import { createRedisClient } from "./index";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

export function getRedisPublisher(): Redis {
  if (!publisher) {
    publisher = createRedisClient();
  }
  return publisher;
}

export function getRedisSubscriber(): Redis {
  if (!subscriber) {
    subscriber = createRedisClient();
  }
  return subscriber;
}
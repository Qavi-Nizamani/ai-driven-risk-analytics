import pino from "pino";

export function createLogger(serviceName: string) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return pino({
    name: serviceName,
    level: process.env.LOG_LEVEL ?? "info",
    transport: isDevelopment
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard"
          }
        }
      : undefined
  });
}


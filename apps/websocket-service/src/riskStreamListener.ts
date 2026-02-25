import type { Server as SocketIOServer } from "socket.io";
import { createLogger } from "@risk-engine/logger";
import { createRedisClient } from "@risk-engine/redis";
import { INCIDENT_CREATED, INCIDENT_UPDATED } from "@risk-engine/events";
import type { IncidentCreatedData, IncidentUpdatedData } from "@risk-engine/types";
import { getRedisStreamName } from "./config/env";

const logger = createLogger("websocket-service:incident-stream");

interface StreamEntry {
  id: string;
  values: Record<string, string>;
}

function parseEntries(entries: unknown): StreamEntry[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entryRaw) => {
    const [id, fieldValues] = entryRaw as [string, unknown];
    const fieldsArray = fieldValues as unknown[];
    const values: Record<string, string> = {};

    for (let index = 0; index < fieldsArray.length; index += 2) {
      const field = String(fieldsArray[index]);
      const value = String(fieldsArray[index + 1]);
      values[field] = value;
    }

    return { id, values };
  });
}

export async function startIncidentStreamListener(io: SocketIOServer): Promise<void> {
  const redis = createRedisClient();
  const streamName = getRedisStreamName();
  const groupName = "ws-service";
  const consumerName = "ws-service-1";

  try {
    // Create consumer group if it does not exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await redis.xgroup("CREATE", streamName, groupName, "$", "MKSTREAM").catch((error: any) => {
      if (typeof error?.message === "string" && error.message.includes("BUSYGROUP")) {
        logger.info("Consumer group already exists");
        return;
      }
      throw error;
    });
  } catch (error) {
    logger.error({ error }, "Failed to ensure consumer group");
    throw error;
  }

  async function loop(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const reply = await redis.xreadgroup(
          "GROUP",
          groupName,
          consumerName,
          "BLOCK",
          5000,
          "COUNT",
          10,
          "STREAMS",
          streamName,
          ">"
        );

        if (!reply) {
          continue;
        }

        const streamReplies = reply as [string, unknown][];

        for (const [, entriesRaw] of streamReplies) {
          const entries = parseEntries(entriesRaw);

          for (const entry of entries) {
            const { id, values } = entry;
            const { type, data } = values;

            if (type !== INCIDENT_CREATED && type !== INCIDENT_UPDATED) {
              await redis.xack(streamName, groupName, id);
              continue;
            }

            try {
              if (type === INCIDENT_CREATED) {
                const incident = JSON.parse(data) as IncidentCreatedData;
                io.to(incident.projectId).emit("incident_created", incident);
                logger.info(
                  { projectId: incident.projectId, incidentId: incident.incidentId },
                  "Broadcasted INCIDENT_CREATED event"
                );
              } else if (type === INCIDENT_UPDATED) {
                const incident = JSON.parse(data) as IncidentUpdatedData;
                io.to(incident.projectId).emit("incident_updated", incident);
                logger.info(
                  { projectId: incident.projectId, incidentId: incident.incidentId },
                  "Broadcasted INCIDENT_UPDATED event"
                );
              }
            } catch (error) {
              logger.error({ error, values }, "Failed to process incident event");
            } finally {
              await redis.xack(streamName, groupName, id);
            }
          }
        }
      } catch (error) {
        logger.error({ error }, "Error while reading from Redis stream");
      }
    }
  }

  void loop();
}


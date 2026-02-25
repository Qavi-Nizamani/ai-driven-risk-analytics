import { Schema, model, type Document } from "mongoose";
import { EventSeverity } from "@risk-engine/types";

export interface EventDocument extends Document {
  projectId: string;
  source: string;
  type: string;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<EventDocument>(
  {
    projectId: {
      type: String,
      required: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      required: true,
      enum: Object.values(EventSeverity)
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const EventModel = model<EventDocument>("Event", eventSchema);


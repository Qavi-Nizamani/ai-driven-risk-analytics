import { Schema, model, type Document, Types } from "mongoose";
import { EventSeverity } from "@risk-engine/types";

export interface EventDocument extends Document {
  projectId: Types.ObjectId;
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
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    source: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
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


import { Schema, model, type Document } from "mongoose";
import { EventSeverity, IncidentStatus } from "@risk-engine/types";

export interface IncidentDocument extends Document {
  projectId: string;
  status: IncidentStatus;
  severity: EventSeverity;
  relatedEventIds: string[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IncidentDocument>(
  {
    projectId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(IncidentStatus),
      default: IncidentStatus.OPEN
    },
    severity: {
      type: String,
      required: true,
      enum: Object.values(EventSeverity)
    },
    relatedEventIds: [
      {
        type: String,
        required: true
      }
    ],
    summary: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const IncidentModel = model<IncidentDocument>("Incident", incidentSchema);


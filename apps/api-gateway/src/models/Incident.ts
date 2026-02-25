import { Schema, model, type Document, Types } from "mongoose";
import { EventSeverity, IncidentStatus } from "@risk-engine/types";

export interface IncidentDocument extends Document {
  projectId: Types.ObjectId;
  status: IncidentStatus;
  severity: EventSeverity;
  relatedEventIds: Types.ObjectId[];
  summary: string;
  createdAt: Date;
  updatedAt: Date;
}

const incidentSchema = new Schema<IncidentDocument>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true
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
        type: Schema.Types.ObjectId,
        ref: "Event",
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


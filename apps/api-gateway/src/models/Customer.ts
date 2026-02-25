import { Schema, model, type Document } from "mongoose";
import { RiskLevel } from "@risk-engine/types";

export interface CustomerDocument extends Document {
  name: string;
  phone: string;
  riskScore: number;
  riskLevel: RiskLevel;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<CustomerDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    riskScore: {
      type: Number,
      required: true,
      default: 0
    },
    riskLevel: {
      type: String,
      required: true,
      enum: Object.values(RiskLevel),
      default: RiskLevel.LOW
    }
  },
  {
    timestamps: true
  }
);

export const CustomerModel = model<CustomerDocument>("Customer", customerSchema);


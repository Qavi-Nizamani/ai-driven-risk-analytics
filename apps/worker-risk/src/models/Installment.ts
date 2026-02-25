import { Schema, model, type Document, Types } from "mongoose";
import { InstallmentStatus } from "@risk-engine/types";

export interface InstallmentDocument extends Document {
  customerId: Types.ObjectId;
  amount: number;
  dueDate: Date;
  paidAt: Date | null;
  status: InstallmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const installmentSchema = new Schema<InstallmentDocument>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(InstallmentStatus),
      default: InstallmentStatus.PENDING
    }
  },
  {
    timestamps: true
  }
);

export const InstallmentModel = model<InstallmentDocument>("Installment", installmentSchema);


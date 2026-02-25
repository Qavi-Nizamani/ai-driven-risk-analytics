import { Router, type Router as ExpressRouter } from "express";
import { Types } from "mongoose";
import { InstallmentModel, type InstallmentDocument } from "../models/Installment";
import { CustomerModel } from "../models/Customer";
import { InstallmentStatus } from "@risk-engine/types";
import {
  publishInstallmentCreated,
  publishInstallmentMarkedLate,
  publishInstallmentPaid
} from "../events/publisher";
import { enqueueRiskJob } from "../queues/riskQueue";

export const installmentsRouter: ExpressRouter = Router();

function validateObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id);
}

function toInstallmentDto(doc: InstallmentDocument) {
  return {
    id: doc.id,
    customerId: doc.customerId.toHexString(),
    amount: doc.amount,
    dueDate: doc.dueDate.toISOString(),
    paidAt: doc.paidAt ? doc.paidAt.toISOString() : null,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

installmentsRouter.post("/installments", async (req, res, next) => {
  try {
    const { customerId, amount, dueDate } = req.body as {
      customerId?: string;
      amount?: number;
      dueDate?: string;
    };

    if (!customerId || !validateObjectId(customerId)) {
      return res.status(400).json({ message: "Valid customerId is required" });
    }

    const customer = await CustomerModel.findById(customerId).exec();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ message: "amount must be a non-negative number" });
    }

    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ message: "dueDate must be a valid ISO date" });
    }

    const installment = await InstallmentModel.create({
      customerId,
      amount,
      dueDate
    });

    await publishInstallmentCreated(installment.id, customer.id);

    return res.status(201).json(toInstallmentDto(installment));
  } catch (error) {
    next(error);
  }
});

installmentsRouter.patch("/installments/:id/pay", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid installment id" });
    }

    const installment = await InstallmentModel.findById(id).exec();

    if (!installment) {
      return res.status(404).json({ message: "Installment not found" });
    }

    if (installment.status === InstallmentStatus.PAID) {
      return res.status(400).json({ message: "Installment already paid" });
    }

    installment.status = InstallmentStatus.PAID;
    installment.paidAt = new Date();
    await installment.save();

    const customerId = installment.customerId.toHexString();
    await publishInstallmentPaid(installment.id, customerId);
    await enqueueRiskJob(customerId);

    return res.json(toInstallmentDto(installment));
  } catch (error) {
    next(error);
  }
});

installmentsRouter.patch("/installments/:id/late", async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({ message: "Invalid installment id" });
    }

    const installment = await InstallmentModel.findById(id).exec();

    if (!installment) {
      return res.status(404).json({ message: "Installment not found" });
    }

    if (installment.status === InstallmentStatus.LATE) {
      return res.status(400).json({ message: "Installment already late" });
    }

    installment.status = InstallmentStatus.LATE;
    await installment.save();

    const customerId = installment.customerId.toHexString();
    await publishInstallmentMarkedLate(installment.id, customerId);
    await enqueueRiskJob(customerId);

    return res.json(toInstallmentDto(installment));
  } catch (error) {
    next(error);
  }
});


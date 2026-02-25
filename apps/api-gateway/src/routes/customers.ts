import { Router } from "express";
import { CustomerModel, type CustomerDocument } from "../models/Customer";
import type { Customer } from "@risk-engine/types";

export const customersRouter = Router();

function toCustomerDto(doc: CustomerDocument): Customer {
  return {
    id: doc.id,
    name: doc.name,
    phone: doc.phone,
    riskScore: doc.riskScore,
    riskLevel: doc.riskLevel,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString()
  };
}

customersRouter.post("/customers", async (req, res, next) => {
  try {
    const { name, phone } = req.body as { name?: string; phone?: string };

    if (!name || !phone) {
      return res.status(400).json({ message: "name and phone are required" });
    }

    const customer = await CustomerModel.create({
      name,
      phone
    });

    return res.status(201).json(toCustomerDto(customer));
  } catch (error) {
    next(error);
  }
});

customersRouter.get("/customers", async (_req, res, next) => {
  try {
    const customers = await CustomerModel.find().exec();
    const dtos = customers.map(toCustomerDto);
    return res.json(dtos);
  } catch (error) {
    next(error);
  }
});


import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { BadRequestError } from "./errors";

export function validate(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".") || "body"}: ${e.message}`)
        .join("; ");
      next(new BadRequestError(message));
      return;
    }
    req.body = result.data as Record<string, unknown>;
    next();
  };
}

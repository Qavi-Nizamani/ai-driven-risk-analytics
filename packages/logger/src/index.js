"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const pino_1 = __importDefault(require("pino"));
function createLogger(serviceName) {
    const isDevelopment = process.env.NODE_ENV !== "production";
    return (0, pino_1.default)({
        name: serviceName,
        level: process.env.LOG_LEVEL ?? "info",
        transport: isDevelopment
            ? {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard"
                }
            }
            : undefined
    });
}

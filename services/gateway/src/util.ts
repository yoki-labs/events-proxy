import type { NextFunction, Request, Response } from "express";

export function validateOptions<T = Record<string, string | boolean>>(args: [keyof T, "string" | "boolean", boolean][]) {
    return (req: Request, res: Response, next: NextFunction) => {
        for (const [key, type, optional] of args) {
            // if not optional, check if it equals type
            // if it is optional, check if it's not undefined then check if equals type
            if (!optional && typeof req.body[key] !== type) return res.status(400).json({ success: false, data: { message: `Expected data.${key} to be a ${type}!` } });
            if (Reflect.has(req.body, key) && typeof req.body[key] !== type)
                return res.status(400).json({ success: false, data: { message: `Expected data.${key} to be a ${type} when provided!` } });
        }
        return next();
    };
}

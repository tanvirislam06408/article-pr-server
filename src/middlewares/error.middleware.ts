import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { config } from "../config/env";

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal server error";
  let errors: any[] | undefined = undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  }

  if (config.nodeEnv === "development" && statusCode === 500) {
    console.error("Unhandled error caught in error middleware:", err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    stack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};

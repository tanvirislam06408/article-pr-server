import { Response } from "express";

export interface ApiResponseOptions<T = any> {
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

export const sendResponse = <T = any>(
  res: Response,
  { statusCode = 200, message = "Success", data, meta }: ApiResponseOptions<T>
) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    statusCode,
    message,
    data,
    meta,
  });
};

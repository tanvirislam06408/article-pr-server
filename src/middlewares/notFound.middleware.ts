import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound(`Cannot find endpoint ${req.method} ${req.originalUrl}`));
};

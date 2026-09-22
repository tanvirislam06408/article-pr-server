import express, { Application } from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";

import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config/env";
import apiRouter from "./routes";
import { notFound } from "./middlewares/notFound.middleware";
import { errorHandler } from "./middlewares/error.middleware";

export const createApp = (): Application => {
  const app = express();

  // Trust proxy for Vercel and reverse proxies
  app.set("trust proxy", 1);

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "unsafe-none" },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: true, // Allow all origins reflectively with credentials
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );
  app.options("*", cors() as any);

  // Rate limiting with disabled proxy validation (prevents Vercel crash)
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: {
      success: false,
      statusCode: 429,
      message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: {
      xForwardedForHeader: false,
      trustProxy: false,
    },
  });
  app.use("/api", limiter);

  // Request logging
  if (config.nodeEnv !== "test") {
    app.use(morgan(config.nodeEnv === "development" ? "dev" : "combined"));
  }

  // Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Static uploads directory
  const uploadsStaticPath = Boolean(process.env.VERCEL)
    ? path.join("/tmp", "uploads")
    : path.join(process.cwd(), "uploads");
  try {
    if (!fs.existsSync(uploadsStaticPath)) {
      fs.mkdirSync(uploadsStaticPath, { recursive: true });
    }
  } catch (e) {}
  app.use("/uploads", express.static(uploadsStaticPath));

  // API Routes
  app.use("/api/v1", apiRouter);


  // Root welcome route
  app.get(["/", "/api", "/api/index"], (_req, res) => {
    res.status(200).json({
      name: "মনন (MONON) API Server",
      description: "Journal of Mindful Living & Digital Wellness Backend",
      version: "1.0.0",
      health: "/api/v1/health",
    });
  });

  // 404 handler
  app.use(notFound);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
};

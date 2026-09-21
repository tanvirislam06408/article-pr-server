import express, { Application } from "express";
import path from "path";
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

  // Security Middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (config.corsOrigin.includes("*") || config.corsOrigin.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev, customize for strict prod
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Rate limiting
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
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Routes
  app.use("/api/v1", apiRouter);


  // Root welcome route
  app.get("/", (_req, res) => {
    res.status(200).json({
      name: "মনন (MONON) API Server",
      description: "Journal of Mindful Living & Digital Wellness Backend",
      version: "1.0.0",
      docs: "/api/v1/health",
    });
  });

  // 404 handler
  app.use(notFound);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
};

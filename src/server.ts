import http from "http";
import { createApp } from "./app";
import { config } from "./config/env";
import { testDbConnection, pool } from "./config/db";

const startServer = async () => {
  console.log("⏳ Initializing Monon API Server...");

  // Verify PostgreSQL connection
  const isDbConnected = await testDbConnection();
  if (!isDbConnected) {
    console.warn("⚠️ Warning: PostgreSQL database is not reachable. Check your DATABASE_URL in .env");
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 Monon API Server is running!`);
    console.log(`🌐 URL: http://localhost:${config.port}`);
    console.log(`📡 API Base: http://localhost:${config.port}/api/v1`);
    console.log(`🌱 Environment: ${config.nodeEnv}`);
    console.log(`=========================================`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log("HTTP server closed.");
      await pool.end();
      console.log("PostgreSQL connection pool closed.");
      process.exit(0);
    });

    // Force shutdown after 10s if connections don't close
    setTimeout(() => {
      console.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

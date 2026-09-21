import { Router } from "express";
import authRoutes from "./auth.routes";
import topicRoutes from "./topic.routes";
import articleRoutes from "./article.routes";
import contactRoutes from "./contact.routes";
import analyticsRoutes from "./analytics.routes";
import commentRoutes from "./comment.routes";
import uploadRoutes from "./upload.routes";

const router = Router();

// Health check endpoint
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Monon API Server",
  });
});

router.use("/auth", authRoutes);
router.use("/topics", topicRoutes);
router.use("/articles", articleRoutes);
router.use("/contact", contactRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/comments", commentRoutes);
router.use("/upload", uploadRoutes);

export default router;


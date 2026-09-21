import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Protected dashboard analytics (Admin & Author)
router.get(
  "/dashboard",
  authenticate,
  authorize("admin", "author"),
  AnalyticsController.getDashboardMetrics
);

export default router;

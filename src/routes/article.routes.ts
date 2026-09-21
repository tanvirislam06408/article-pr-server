import { Router } from "express";
import { ArticleController } from "../controllers/article.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createArticleSchema,
  updateArticleSchema,
  articleQuerySchema,
} from "../validators/article.validator";

const router = Router();

// Public routes
router.get(
  "/",
  validate({ query: articleQuerySchema }),
  ArticleController.getArticles
);

router.get("/featured", ArticleController.getFeaturedArticles);
router.get("/lead-cover", ArticleController.getLeadCover);
router.get("/:slug", ArticleController.getArticleBySlug);
router.post("/:id/view", ArticleController.recordView);

// Protected routes (Admin & Author)
router.post(
  "/",
  authenticate,
  authorize("admin", "author"),
  validate({ body: createArticleSchema }),
  ArticleController.createArticle
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin", "author"),
  validate({ body: updateArticleSchema }),
  ArticleController.updateArticle
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin", "author"),
  ArticleController.deleteArticle
);

export default router;

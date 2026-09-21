import { Router } from "express";
import { TopicController } from "../controllers/topic.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createTopicSchema, updateTopicSchema } from "../validators/topic.validator";

const router = Router();

// Public routes
router.get("/", TopicController.getAllTopics);
router.get("/:slug", TopicController.getTopicBySlug);

// Protected routes (Admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate({ body: createTopicSchema }),
  TopicController.createTopic
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate({ body: updateTopicSchema }),
  TopicController.updateTopic
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  TopicController.deleteTopic
);

export default router;

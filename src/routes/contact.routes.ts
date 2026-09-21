import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { contactSchema, subscriberSchema } from "../validators/contact.validator";

const router = Router();

// Public routes
router.post(
  "/message",
  validate({ body: contactSchema }),
  ContactController.submitMessage
);

router.post(
  "/subscribe",
  validate({ body: subscriberSchema }),
  ContactController.subscribeNewsletter
);

// Protected routes (Admin only)
router.get(
  "/messages",
  authenticate,
  authorize("admin"),
  ContactController.getMessages
);

router.get(
  "/subscribers",
  authenticate,
  authorize("admin"),
  ContactController.getSubscribers
);

export default router;

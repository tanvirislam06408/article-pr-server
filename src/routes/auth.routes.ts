import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate.middleware";
import { authenticate } from "../middlewares/auth.middleware";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator";

const router = Router();

router.post(
  "/register",
  validate({ body: registerSchema }),
  AuthController.register
);

router.post(
  "/login",
  validate({ body: loginSchema }),
  AuthController.login
);

router.get("/me", authenticate, AuthController.getMe);

router.patch(
  "/profile",
  authenticate,
  validate({ body: updateProfileSchema }),
  AuthController.updateProfile
);

export default router;

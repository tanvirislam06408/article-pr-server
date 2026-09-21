import { Router } from "express";
import { UploadController, upload } from "../controllers/upload.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Upload image route (protected)
router.post(
  "/image",
  authenticate,
  upload.single("image"),
  UploadController.uploadImage
);

export default router;

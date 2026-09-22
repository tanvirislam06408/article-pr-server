import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/apiError";
import { sendResponse } from "../utils/apiResponse";

const isVercel = Boolean(process.env.VERCEL);
const uploadDir = isVercel
  ? path.join("/tmp", "uploads")
  : path.join(process.cwd(), "uploads");

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn("Notice: Could not create upload directory synchronously:", e);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg\+xml|svg/;
    const mimeMatch = allowed.test(file.mimetype);
    const extMatch = allowed.test(path.extname(file.originalname).toLowerCase());
    if (mimeMatch || extMatch) {
      return cb(null, true);
    }
    cb(new Error("Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed!"));
  },
});

export class UploadController {
  static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return next(ApiError.badRequest("No image file provided"));
      }

      const host = req.get("host") || "localhost:5000";
      const protocol = req.protocol;
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      return sendResponse(res, {
        statusCode: 201,
        message: "Image uploaded successfully",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          url: fileUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

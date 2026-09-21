import { Router } from "express";
import { CommentController } from "../controllers/comment.controller";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware";

const router = Router();

const commentSchema = z.object({
  authorName: z.string().min(2, "Name must be at least 2 characters"),
  authorEmail: z.string().email("Invalid email address"),
  content: z.string().min(3, "Comment cannot be empty"),
  parentId: z.string().optional().nullable(),
});

router.get("/:slugOrId", CommentController.getComments);
router.post("/:slugOrId", validate({ body: commentSchema }), CommentController.addComment);
router.post("/:slugOrId/like", CommentController.addLike);

export default router;

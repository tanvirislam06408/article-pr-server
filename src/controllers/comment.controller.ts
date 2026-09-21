import { Request, Response, NextFunction } from "express";
import { CommentModel } from "../models/comment.model";
import { ArticleModel } from "../models/article.model";
import { ApiError } from "../utils/apiError";
import { sendResponse } from "../utils/apiResponse";

export class CommentController {
  static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { slugOrId } = req.params;

      let article = await ArticleModel.findBySlug(slugOrId);
      if (!article) {
        article = await ArticleModel.findById(slugOrId);
      }

      if (!article) {
        return next(ApiError.notFound("Article not found"));
      }

      const comments = await CommentModel.getCommentsByArticle(article.id);
      const likesCount = await CommentModel.getLikesCount(article.id);

      return sendResponse(res, {
        statusCode: 200,
        message: "Comments retrieved successfully",
        data: {
          comments,
          likesCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const { slugOrId } = req.params;
      const { authorName, authorEmail, content, parentId } = req.body;

      let article = await ArticleModel.findBySlug(slugOrId);
      if (!article) {
        article = await ArticleModel.findById(slugOrId);
      }

      if (!article) {
        return next(ApiError.notFound("Article not found"));
      }

      const id = `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const comment = await CommentModel.create({
        id,
        articleId: article.id,
        authorName,
        authorEmail,
        content,
        parentId,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: "Comment added successfully",
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async addLike(req: Request, res: Response, next: NextFunction) {
    try {
      const { slugOrId } = req.params;

      let article = await ArticleModel.findBySlug(slugOrId);
      if (!article) {
        article = await ArticleModel.findById(slugOrId);
      }

      if (!article) {
        return next(ApiError.notFound("Article not found"));
      }

      const fingerprint =
        req.body?.fingerprint ||
        (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous").toString();

      const updatedLikes = await CommentModel.addLike(article.id, fingerprint);

      return sendResponse(res, {
        statusCode: 200,
        message: "Like registered",
        data: { likes: updatedLikes },
      });
    } catch (error) {
      next(error);
    }
  }
}

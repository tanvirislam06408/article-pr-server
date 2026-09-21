import { Request, Response, NextFunction } from "express";
import { ArticleModel } from "../models/article.model";
import { TopicModel } from "../models/topic.model";
import { ApiError } from "../utils/apiError";
import { sendResponse } from "../utils/apiResponse";
import { slugify } from "../utils/slugify";

export class ArticleController {
  static async getArticles(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        page = "1",
        limit = "10",
        search,
        topic,
        status = "published",
        isFeatured,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query as any;

      const result = await ArticleModel.findWithFilters({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        search: search as string,
        topic: topic as string,
        status: status as string,
        isFeatured: isFeatured !== undefined ? isFeatured === "true" : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as string).toUpperCase() === "ASC" ? "ASC" : "DESC",
      });

      return sendResponse(res, {
        statusCode: 200,
        message: "Articles retrieved successfully",
        data: result.data,
        meta: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeaturedArticles(_req: Request, res: Response, next: NextFunction) {
    try {
      const articles = await ArticleModel.getFeatured();
      return sendResponse(res, {
        statusCode: 200,
        message: "Featured articles retrieved successfully",
        data: articles,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeadCover(_req: Request, res: Response, next: NextFunction) {
    try {
      const article = await ArticleModel.getLeadCover();
      if (!article) {
        return next(ApiError.notFound("Lead cover article not found"));
      }
      return sendResponse(res, {
        statusCode: 200,
        message: "Lead cover article retrieved successfully",
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getArticleBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const article = await ArticleModel.findBySlug(slug);

      if (!article) {
        return next(ApiError.notFound(`Article with slug '${slug}' not found`));
      }

      // Increment view asynchronously
      const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString();
      ArticleModel.incrementViews(article.id, ip).catch(console.error);

      return sendResponse(res, {
        statusCode: 200,
        message: "Article retrieved successfully",
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createArticle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const {
        title,
        slug,
        kicker,
        excerpt,
        content,
        topicId,
        publishedDate,
        readTime,
        isFeatured,
        isEditorPick,
        isLeadCover,
        artTheme,
        status,
      } = req.body;

      // Verify topic exists
      const topic = await TopicModel.findById(topicId);
      if (!topic) {
        return next(ApiError.badRequest(`Invalid topicId: Topic '${topicId}' does not exist`));
      }

      const generatedSlug = slug ? slugify(slug) : slugify(title);
      const existing = await ArticleModel.findBySlug(generatedSlug);
      const finalSlug = existing
        ? `${generatedSlug}-${Math.random().toString(36).substring(2, 6)}`
        : generatedSlug;

      const id = `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      // Approximate read time in Bengali if not provided (assume 200 words/min)
      const wordCount = content.trim().split(/\s+/).length;
      const calcMinutes = Math.max(1, Math.ceil(wordCount / 200));
      const finalReadTime = readTime || `${calcMinutes} মিনিট পাঠ`;

      const finalPublishedDate =
        publishedDate ||
        new Intl.DateTimeFormat("bn-BD", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date());

      const article = await ArticleModel.create({
        id,
        slug: finalSlug,
        title,
        kicker,
        excerpt,
        content,
        topicId,
        authorId: req.user.userId,
        publishedDate: finalPublishedDate,
        readTime: finalReadTime,
        isFeatured,
        isEditorPick,
        isLeadCover,
        artTheme,
        status,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: "Article created successfully",
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateArticle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const { id } = req.params;
      const existing = await ArticleModel.findById(id);

      if (!existing) {
        return next(ApiError.notFound(`Article with id '${id}' not found`));
      }

      // Check permissions: admin or owner
      if (req.user.role !== "admin" && existing.authorId !== req.user.userId) {
        return next(ApiError.forbidden("You do not have permission to edit this article"));
      }

      const updated = await ArticleModel.update(id, req.body);

      return sendResponse(res, {
        statusCode: 200,
        message: "Article updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteArticle(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized());
      }

      const { id } = req.params;
      const existing = await ArticleModel.findById(id);

      if (!existing) {
        return next(ApiError.notFound(`Article with id '${id}' not found`));
      }

      if (req.user.role !== "admin" && existing.authorId !== req.user.userId) {
        return next(ApiError.forbidden("You do not have permission to delete this article"));
      }

      await ArticleModel.delete(id);

      return sendResponse(res, {
        statusCode: 200,
        message: "Article deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordView(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const article = await ArticleModel.findById(id);

      if (!article) {
        return next(ApiError.notFound(`Article with id '${id}' not found`));
      }

      const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString();
      const updatedViews = await ArticleModel.incrementViews(id, ip);

      return sendResponse(res, {
        statusCode: 200,
        message: "View recorded successfully",
        data: { views: updatedViews },
      });
    } catch (error) {
      next(error);
    }
  }
}

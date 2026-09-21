import { Request, Response, NextFunction } from "express";
import { TopicModel } from "../models/topic.model";
import { ApiError } from "../utils/apiError";
import { sendResponse } from "../utils/apiResponse";
import { slugify } from "../utils/slugify";

export class TopicController {
  static async getAllTopics(_req: Request, res: Response, next: NextFunction) {
    try {
      const topics = await TopicModel.findAll();
      return sendResponse(res, {
        statusCode: 200,
        message: "Topics retrieved successfully",
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopicBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const topic = await TopicModel.findBySlug(slug);

      if (!topic) {
        return next(ApiError.notFound(`Topic with slug '${slug}' not found`));
      }

      return sendResponse(res, {
        statusCode: 200,
        message: "Topic details retrieved successfully",
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, slug, shortDesc, featuredQuote, badgeColor, iconName } = req.body;

      const generatedSlug = slug ? slugify(slug) : slugify(title);
      const existing = await TopicModel.findBySlug(generatedSlug);
      if (existing) {
        return next(ApiError.conflict(`Topic with slug '${generatedSlug}' already exists`));
      }

      const id = `topic-${generatedSlug}`;
      const newTopic = await TopicModel.create({
        id,
        slug: generatedSlug,
        title,
        shortDesc,
        featuredQuote,
        badgeColor,
        iconName,
      });

      return sendResponse(res, {
        statusCode: 201,
        message: "Topic created successfully",
        data: newTopic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, slug, shortDesc, featuredQuote, badgeColor, iconName } = req.body;

      const topic = await TopicModel.findById(id);
      if (!topic) {
        return next(ApiError.notFound(`Topic with id '${id}' not found`));
      }

      const updated = await TopicModel.update(id, {
        title,
        slug: slug ? slugify(slug) : undefined,
        shortDesc,
        featuredQuote,
        badgeColor,
        iconName,
      });

      return sendResponse(res, {
        statusCode: 200,
        message: "Topic updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTopic(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const topic = await TopicModel.findById(id);
      if (!topic) {
        return next(ApiError.notFound(`Topic with id '${id}' not found`));
      }

      await TopicModel.delete(id);

      return sendResponse(res, {
        statusCode: 200,
        message: "Topic deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

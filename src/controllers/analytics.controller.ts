import { Request, Response, NextFunction } from "express";
import { AnalyticsModel } from "../models/analytics.model";
import { sendResponse } from "../utils/apiResponse";

export class AnalyticsController {
  static async getDashboardMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await AnalyticsModel.getOverviewMetrics();
      const popular = await AnalyticsModel.getPopularArticles(5);
      const timeline = await AnalyticsModel.getViewsTimeline(7);

      return sendResponse(res, {
        statusCode: 200,
        message: "Dashboard analytics retrieved successfully",
        data: {
          metrics: [
            {
              id: "metric-views",
              label: "মোট পাঠ সংখ্যা (Total Views)",
              value: metrics.totalViews,
              changePercent: "+12.4%",
              isPositive: true,
              period: "গত ৩০ দিনে",
            },
            {
              id: "metric-articles",
              label: "প্রকাশিত প্রবন্ধ (Published)",
              value: metrics.totalArticles,
              changePercent: "+4",
              isPositive: true,
              period: "চলতি মাসে",
            },
            {
              id: "metric-subscribers",
              label: "নিউজলেটার পাঠক (Subscribers)",
              value: metrics.totalSubscribers,
              changePercent: "+18.2%",
              isPositive: true,
              period: "গত ৩০ দিনে",
            },
            {
              id: "metric-categories",
              label: "সক্রিয় বিভাগ (Topics)",
              value: metrics.totalTopics,
              changePercent: "স্থির",
              isPositive: true,
              period: "মোট বিভাগ",
            },
          ],
          popularArticles: popular,
          viewsTimeline: timeline,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

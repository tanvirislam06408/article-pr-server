import { query } from "../config/db";

export class AnalyticsModel {
  static async getOverviewMetrics() {
    const totalArticlesRes = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM articles WHERE status = 'published'`
    );
    const totalViewsRes = await query<{ total_views: string }>(
      `SELECT COALESCE(SUM(views), 0)::int AS total_views FROM articles`
    );
    const totalSubscribersRes = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM subscribers WHERE is_active = true`
    );
    const totalTopicsRes = await query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM topics`
    );

    return {
      totalArticles: parseInt(totalArticlesRes.rows[0]?.count || "0", 10),
      totalViews: parseInt(totalViewsRes.rows[0]?.total_views || "0", 10),
      totalSubscribers: parseInt(totalSubscribersRes.rows[0]?.count || "0", 10),
      totalTopics: parseInt(totalTopicsRes.rows[0]?.count || "0", 10),
    };
  }

  static async getPopularArticles(limit = 5) {
    const res = await query<any>(
      `SELECT 
        a.id, a.title, a.slug, a.views, a.published_date AS "publishedDate",
        t.title AS "category", t.slug AS "categorySlug",
        u.name AS "author"
       FROM articles a
       LEFT JOIN topics t ON a.topic_id = t.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.status = 'published'
       ORDER BY a.views DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  static async getViewsTimeline(days = 7) {
    const res = await query<any>(
      `SELECT 
        TO_CHAR(viewed_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS views
       FROM article_views
       WHERE viewed_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY TO_CHAR(viewed_at, 'YYYY-MM-DD')
       ORDER BY date ASC`,
      [days]
    );
    return res.rows;
  }
}

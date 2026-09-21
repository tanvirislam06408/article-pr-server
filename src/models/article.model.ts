import { query } from "../config/db";
import { Article, PaginatedResult, PaginationParams, ArtTheme } from "../types";

export interface CreateArticleData {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  excerpt: string;
  content: string;
  topicId: string;
  authorId: string;
  publishedDate: string;
  readTime: string;
  isFeatured?: boolean;
  isEditorPick?: boolean;
  isLeadCover?: boolean;
  artTheme?: ArtTheme;
  status?: "draft" | "published" | "archived";
}

export interface UpdateArticleData {
  slug?: string;
  title?: string;
  kicker?: string;
  excerpt?: string;
  content?: string;
  topicId?: string;
  publishedDate?: string;
  readTime?: string;
  isFeatured?: boolean;
  isEditorPick?: boolean;
  isLeadCover?: boolean;
  artTheme?: ArtTheme;
  status?: "draft" | "published" | "archived";
}

const mapArticleRow = (row: any): Article => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  kicker: row.kicker,
  excerpt: row.excerpt,
  content: row.content,
  contentSnippet: row.contentSnippet || row.excerpt,
  topicId: row.topicId,
  topicTitle: row.topicTitle,
  authorId: row.authorId,
  author: row.authorId
    ? {
        id: row.authorId,
        name: row.authorName || "Unknown",
        role: row.authorRole || "Author",
        bio: row.authorBio,
        avatarUrl: row.authorAvatarUrl,
      }
    : undefined,
  publishedDate: row.publishedDate,
  readTime: row.readTime,
  isFeatured: Boolean(row.isFeatured),
  isEditorPick: Boolean(row.isEditorPick),
  isLeadCover: Boolean(row.isLeadCover),
  artTheme: row.artTheme,
  status: row.status,
  views: parseInt(row.views || "0", 10),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class ArticleModel {
  static async findWithFilters(
    params: PaginationParams
  ): Promise<PaginatedResult<Article>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.status) {
      conditions.push(`a.status = $${idx++}`);
      values.push(params.status);
    } else {
      conditions.push(`a.status = 'published'`);
    }

    if (params.topic) {
      conditions.push(`(a.topic_id = $${idx} OR t.slug = $${idx})`);
      values.push(params.topic);
      idx++;
    }

    if (params.isFeatured !== undefined) {
      conditions.push(`a.is_featured = $${idx++}`);
      values.push(params.isFeatured);
    }

    if (params.search) {
      conditions.push(
        `(a.title ILIKE $${idx} OR a.kicker ILIKE $${idx} OR a.excerpt ILIKE $${idx} OR a.content ILIKE $${idx})`
      );
      values.push(`%${params.search}%`);
      idx++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countSql = `
      SELECT COUNT(a.id)::int AS total
      FROM articles a
      LEFT JOIN topics t ON a.topic_id = t.id
      ${whereClause}
    `;
    const countRes = await query(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    // Allowed sort columns
    const allowedSortColumns: Record<string, string> = {
      created_at: "a.created_at",
      views: "a.views",
      title: "a.title",
      published_date: "a.published_date",
    };
    const sortCol = allowedSortColumns[params.sortBy || "created_at"] || "a.created_at";
    const sortDirection = params.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Main query
    const dataSql = `
      SELECT 
        a.id,
        a.slug,
        a.title,
        a.kicker,
        a.excerpt,
        a.content,
        SUBSTRING(a.content FROM 1 FOR 300) AS "contentSnippet",
        a.topic_id AS "topicId",
        t.title AS "topicTitle",
        a.author_id AS "authorId",
        u.name AS "authorName",
        u.role AS "authorRole",
        u.bio AS "authorBio",
        u.avatar_url AS "authorAvatarUrl",
        a.published_date AS "publishedDate",
        a.read_time AS "readTime",
        a.is_featured AS "isFeatured",
        a.is_editor_pick AS "isEditorPick",
        a.is_lead_cover AS "isLeadCover",
        a.art_theme AS "artTheme",
        a.status,
        a.views,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt"
      FROM articles a
      LEFT JOIN topics t ON a.topic_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      ${whereClause}
      ORDER BY ${sortCol} ${sortDirection}
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const dataRes = await query(dataSql, [...values, limit, offset]);
    const articles = dataRes.rows.map(mapArticleRow);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static async findBySlug(slug: string): Promise<Article | null> {
    const sql = `
      SELECT 
        a.id,
        a.slug,
        a.title,
        a.kicker,
        a.excerpt,
        a.content,
        a.topic_id AS "topicId",
        t.title AS "topicTitle",
        a.author_id AS "authorId",
        u.name AS "authorName",
        u.role AS "authorRole",
        u.bio AS "authorBio",
        u.avatar_url AS "authorAvatarUrl",
        a.published_date AS "publishedDate",
        a.read_time AS "readTime",
        a.is_featured AS "isFeatured",
        a.is_editor_pick AS "isEditorPick",
        a.is_lead_cover AS "isLeadCover",
        a.art_theme AS "artTheme",
        a.status,
        a.views,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt"
      FROM articles a
      LEFT JOIN topics t ON a.topic_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.slug = $1
    `;
    const res = await query(sql, [slug]);
    return res.rows[0] ? mapArticleRow(res.rows[0]) : null;
  }

  static async findById(id: string): Promise<Article | null> {
    const sql = `
      SELECT 
        a.id,
        a.slug,
        a.title,
        a.kicker,
        a.excerpt,
        a.content,
        a.topic_id AS "topicId",
        t.title AS "topicTitle",
        a.author_id AS "authorId",
        u.name AS "authorName",
        u.role AS "authorRole",
        u.bio AS "authorBio",
        u.avatar_url AS "authorAvatarUrl",
        a.published_date AS "publishedDate",
        a.read_time AS "readTime",
        a.is_featured AS "isFeatured",
        a.is_editor_pick AS "isEditorPick",
        a.is_lead_cover AS "isLeadCover",
        a.art_theme AS "artTheme",
        a.status,
        a.views,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt"
      FROM articles a
      LEFT JOIN topics t ON a.topic_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] ? mapArticleRow(res.rows[0]) : null;
  }

  static async create(data: CreateArticleData): Promise<Article> {
    const sql = `
      INSERT INTO articles (
        id, slug, title, kicker, excerpt, content, topic_id, author_id,
        published_date, read_time, is_featured, is_editor_pick, is_lead_cover,
        art_theme, status, views
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0)
      RETURNING *
    `;
    await query(sql, [
      data.id,
      data.slug,
      data.title,
      data.kicker,
      data.excerpt,
      data.content,
      data.topicId,
      data.authorId,
      data.publishedDate,
      data.readTime,
      data.isFeatured || false,
      data.isEditorPick || false,
      data.isLeadCover || false,
      data.artTheme || "focus",
      data.status || "published",
    ]);

    const created = await this.findById(data.id);
    return created!;
  }

  static async update(
    id: string,
    data: UpdateArticleData
  ): Promise<Article | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(data.slug);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title);
    }
    if (data.kicker !== undefined) {
      fields.push(`kicker = $${idx++}`);
      values.push(data.kicker);
    }
    if (data.excerpt !== undefined) {
      fields.push(`excerpt = $${idx++}`);
      values.push(data.excerpt);
    }
    if (data.content !== undefined) {
      fields.push(`content = $${idx++}`);
      values.push(data.content);
    }
    if (data.topicId !== undefined) {
      fields.push(`topic_id = $${idx++}`);
      values.push(data.topicId);
    }
    if (data.publishedDate !== undefined) {
      fields.push(`published_date = $${idx++}`);
      values.push(data.publishedDate);
    }
    if (data.readTime !== undefined) {
      fields.push(`read_time = $${idx++}`);
      values.push(data.readTime);
    }
    if (data.isFeatured !== undefined) {
      fields.push(`is_featured = $${idx++}`);
      values.push(data.isFeatured);
    }
    if (data.isEditorPick !== undefined) {
      fields.push(`is_editor_pick = $${idx++}`);
      values.push(data.isEditorPick);
    }
    if (data.isLeadCover !== undefined) {
      fields.push(`is_lead_cover = $${idx++}`);
      values.push(data.isLeadCover);
    }
    if (data.artTheme !== undefined) {
      fields.push(`art_theme = $${idx++}`);
      values.push(data.artTheme);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    await query(
      `UPDATE articles SET ${fields.join(", ")} WHERE id = $${idx}`,
      values
    );

    return this.findById(id);
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM articles WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  static async incrementViews(id: string, ipHash?: string): Promise<number> {
    const res = await query<{ views: number }>(
      `UPDATE articles SET views = views + 1 WHERE id = $1 RETURNING views`,
      [id]
    );

    if (ipHash) {
      await query(
        `INSERT INTO article_views (id, article_id, ip_hash) VALUES ($1, $2, $3)`,
        [`view-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, id, ipHash]
      ).catch((err) => console.error("Error inserting view log:", err));
    }

    return res.rows[0]?.views || 0;
  }

  static async getLeadCover(): Promise<Article | null> {
    const sql = `
      SELECT 
        a.id, a.slug, a.title, a.kicker, a.excerpt, a.content,
        a.topic_id AS "topicId", t.title AS "topicTitle",
        a.author_id AS "authorId", u.name AS "authorName", u.role AS "authorRole",
        a.published_date AS "publishedDate", a.read_time AS "readTime",
        a.is_featured AS "isFeatured", a.is_editor_pick AS "isEditorPick",
        a.is_lead_cover AS "isLeadCover", a.art_theme AS "artTheme",
        a.status, a.views, a.created_at AS "createdAt", a.updated_at AS "updatedAt"
      FROM articles a
      LEFT JOIN topics t ON a.topic_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.is_lead_cover DESC, a.created_at DESC
      LIMIT 1
    `;
    const res = await query(sql);
    return res.rows[0] ? mapArticleRow(res.rows[0]) : null;
  }

  static async getFeatured(): Promise<Article[]> {
    const sql = `
      SELECT 
        a.id, a.slug, a.title, a.kicker, a.excerpt, a.content,
        a.topic_id AS "topicId", t.title AS "topicTitle",
        a.author_id AS "authorId", u.name AS "authorName", u.role AS "authorRole",
        a.published_date AS "publishedDate", a.read_time AS "readTime",
        a.is_featured AS "isFeatured", a.is_editor_pick AS "isEditorPick",
        a.is_lead_cover AS "isLeadCover", a.art_theme AS "artTheme",
        a.status, a.views, a.created_at AS "createdAt", a.updated_at AS "updatedAt"
      FROM articles a
      LEFT JOIN topics t ON a.topic_id = t.id
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.is_featured = true AND a.status = 'published'
      ORDER BY a.created_at DESC
      LIMIT 6
    `;
    const res = await query(sql);
    return res.rows.map(mapArticleRow);
  }
}

import { query } from "../config/db";
import { Topic } from "../types";

export interface CreateTopicData {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  featuredQuote?: string;
  badgeColor?: string;
  iconName?: string;
}

export interface UpdateTopicData {
  slug?: string;
  title?: string;
  shortDesc?: string;
  featuredQuote?: string;
  badgeColor?: string;
  iconName?: string;
}

export class TopicModel {
  static async findAll(): Promise<Topic[]> {
    const res = await query<any>(
      `SELECT 
        t.id, 
        t.slug, 
        t.title, 
        t.short_desc AS "shortDesc", 
        t.featured_quote AS "featuredQuote", 
        t.badge_color AS "badgeColor", 
        t.icon_name AS "iconName", 
        t.created_at AS "createdAt", 
        t.updated_at AS "updatedAt",
        COUNT(a.id)::int AS "articleCount"
       FROM topics t
       LEFT JOIN articles a ON t.id = a.topic_id AND a.status = 'published'
       GROUP BY t.id
       ORDER BY t.created_at ASC`
    );
    return res.rows;
  }

  static async findBySlug(slug: string): Promise<Topic | null> {
    const res = await query<any>(
      `SELECT 
        t.id, 
        t.slug, 
        t.title, 
        t.short_desc AS "shortDesc", 
        t.featured_quote AS "featuredQuote", 
        t.badge_color AS "badgeColor", 
        t.icon_name AS "iconName", 
        t.created_at AS "createdAt", 
        t.updated_at AS "updatedAt",
        COUNT(a.id)::int AS "articleCount"
       FROM topics t
       LEFT JOIN articles a ON t.id = a.topic_id AND a.status = 'published'
       WHERE t.slug = $1
       GROUP BY t.id`,
      [slug]
    );
    return res.rows[0] || null;
  }

  static async findById(id: string): Promise<Topic | null> {
    const res = await query<any>(
      `SELECT 
        t.id, 
        t.slug, 
        t.title, 
        t.short_desc AS "shortDesc", 
        t.featured_quote AS "featuredQuote", 
        t.badge_color AS "badgeColor", 
        t.icon_name AS "iconName", 
        t.created_at AS "createdAt", 
        t.updated_at AS "updatedAt",
        COUNT(a.id)::int AS "articleCount"
       FROM topics t
       LEFT JOIN articles a ON t.id = a.topic_id AND a.status = 'published'
       WHERE t.id = $1
       GROUP BY t.id`,
      [id]
    );
    return res.rows[0] || null;
  }

  static async create(data: CreateTopicData): Promise<Topic> {
    const res = await query<any>(
      `INSERT INTO topics (id, slug, title, short_desc, featured_quote, badge_color, icon_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING 
        id, 
        slug, 
        title, 
        short_desc AS "shortDesc", 
        featured_quote AS "featuredQuote", 
        badge_color AS "badgeColor", 
        icon_name AS "iconName", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"`,
      [
        data.id,
        data.slug,
        data.title,
        data.shortDesc,
        data.featuredQuote || null,
        data.badgeColor || "emerald",
        data.iconName || "Compass",
      ]
    );
    return { ...res.rows[0], articleCount: 0 };
  }

  static async update(id: string, data: UpdateTopicData): Promise<Topic | null> {
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
    if (data.shortDesc !== undefined) {
      fields.push(`short_desc = $${idx++}`);
      values.push(data.shortDesc);
    }
    if (data.featuredQuote !== undefined) {
      fields.push(`featured_quote = $${idx++}`);
      values.push(data.featuredQuote);
    }
    if (data.badgeColor !== undefined) {
      fields.push(`badge_color = $${idx++}`);
      values.push(data.badgeColor);
    }
    if (data.iconName !== undefined) {
      fields.push(`icon_name = $${idx++}`);
      values.push(data.iconName);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await query<any>(
      `UPDATE topics
       SET ${fields.join(", ")}
       WHERE id = $${idx}
       RETURNING 
        id, 
        slug, 
        title, 
        short_desc AS "shortDesc", 
        featured_quote AS "featuredQuote", 
        badge_color AS "badgeColor", 
        icon_name AS "iconName", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM topics WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }
}

import { query } from "../config/db";

export interface Comment {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: string | null;
  isApproved: boolean;
  createdAt: Date;
  replies?: Comment[];
}

export interface CreateCommentData {
  id: string;
  articleId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  parentId?: string | null;
}

export class CommentModel {
  static async getCommentsByArticle(articleId: string): Promise<Comment[]> {
    const res = await query<any>(
      `SELECT 
        id, 
        article_id AS "articleId", 
        author_name AS "authorName", 
        author_email AS "authorEmail", 
        content, 
        parent_id AS "parentId", 
        is_approved AS "isApproved", 
        created_at AS "createdAt"
       FROM comments
       WHERE article_id = $1 AND is_approved = true
       ORDER BY created_at ASC`,
      [articleId]
    );

    const rows: Comment[] = res.rows;
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    rows.forEach((c) => {
      c.replies = [];
      commentMap.set(c.id, c);
    });

    rows.forEach((c) => {
      if (c.parentId && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId)!.replies!.push(c);
      } else {
        rootComments.push(c);
      }
    });

    return rootComments;
  }

  static async create(data: CreateCommentData): Promise<Comment> {
    const res = await query<any>(
      `INSERT INTO comments (id, article_id, author_name, author_email, content, parent_id, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING 
        id, 
        article_id AS "articleId", 
        author_name AS "authorName", 
        author_email AS "authorEmail", 
        content, 
        parent_id AS "parentId", 
        is_approved AS "isApproved", 
        created_at AS "createdAt"`,
      [
        data.id,
        data.articleId,
        data.authorName,
        data.authorEmail.toLowerCase(),
        data.content,
        data.parentId || null,
      ]
    );
    return { ...res.rows[0], replies: [] };
  }

  static async getLikesCount(articleId: string): Promise<number> {
    const res = await query<{ total_likes: string }>(
      `SELECT COALESCE(SUM(count), 0)::int AS total_likes FROM article_likes WHERE article_id = $1`,
      [articleId]
    );
    return parseInt(res.rows[0]?.total_likes || "0", 10);
  }

  static async addLike(articleId: string, fingerprint: string): Promise<number> {
    const id = `like-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO article_likes (id, article_id, fingerprint, count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (article_id, fingerprint)
       DO UPDATE SET count = LEAST(article_likes.count + 1, 10), updated_at = CURRENT_TIMESTAMP`,
      [id, articleId, fingerprint]
    );

    return this.getLikesCount(articleId);
  }
}

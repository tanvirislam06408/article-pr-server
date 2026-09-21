import { z } from "zod";

const artThemes = [
  "dopamine",
  "focus",
  "solitude",
  "screen",
  "connection",
  "resilience",
  "habits",
  "nature",
] as const;

export const createArticleSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  slug: z.string().optional(),
  kicker: z.string().min(2, "Kicker is required"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(20, "Content must be at least 20 characters"),
  topicId: z.string().min(1, "Topic ID is required"),
  publishedDate: z.string().optional(),
  readTime: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  isEditorPick: z.boolean().optional().default(false),
  isLeadCover: z.boolean().optional().default(false),
  artTheme: z.enum(artThemes).optional().default("focus"),
  status: z.enum(["draft", "published", "archived"]).optional().default("published"),
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  topic: z.string().optional(),
  status: z.string().optional(),
  isFeatured: z.string().optional().transform((val) => (val ? val === "true" : undefined)),
  sortBy: z.string().optional().default("created_at"),
  sortOrder: z.enum(["asc", "desc", "ASC", "DESC"]).optional().default("DESC"),
});

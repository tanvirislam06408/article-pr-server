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
  title: z.string().min(1, "প্রবন্ধের শিরোনাম আবশ্যক (Title is required)"),
  slug: z.string().optional().nullable(),
  kicker: z.string().optional().default("বিশেষ নিবন্ধ"),
  excerpt: z.string().optional().default(""),
  content: z.string().min(1, "প্রবন্ধের মূল বিষয়বস্তু আবশ্যক (Content is required)"),
  topicId: z.string().optional().default("digital-wellness"),
  publishedDate: z.string().optional(),
  readTime: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  isEditorPick: z.boolean().optional().default(false),
  isLeadCover: z.boolean().optional().default(false),
  artTheme: z.string().optional().default("focus"),
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

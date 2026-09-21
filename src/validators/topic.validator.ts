import { z } from "zod";

export const createTopicSchema = z.object({
  title: z.string().min(2, "Topic title must be at least 2 characters"),
  slug: z.string().optional(),
  shortDesc: z.string().min(5, "Short description is required"),
  featuredQuote: z.string().optional(),
  badgeColor: z.string().optional(),
  iconName: z.string().optional(),
});

export const updateTopicSchema = createTopicSchema.partial();

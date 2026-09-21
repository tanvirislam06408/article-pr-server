import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "author", "user"]).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

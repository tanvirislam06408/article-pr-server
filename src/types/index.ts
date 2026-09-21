export type Role = "admin" | "author" | "user";

export type ArtTheme =
  | "dopamine"
  | "focus"
  | "solitude"
  | "screen"
  | "connection"
  | "resilience"
  | "habits"
  | "nature";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  bio?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  articleCount?: number;
  featuredQuote?: string;
  badgeColor?: string;
  iconName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  excerpt: string;
  content: string;
  contentSnippet?: string;
  topicId: string;
  topicTitle?: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    role: string;
    bio?: string;
    avatarUrl?: string;
  };
  publishedDate: string;
  readTime: string;
  isFeatured: boolean;
  isEditorPick: boolean;
  isLeadCover: boolean;
  artTheme: ArtTheme;
  status: "draft" | "published" | "archived";
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: Date;
}

export interface Subscriber {
  id: string;
  email: string;
  isActive: boolean;
  subscribedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  topic?: string;
  status?: string;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export const slugify = (text: string): string => {
  if (!text) return `article-${Date.now()}`;
  const slug = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-") // Keep all Unicode letters and numbers across any language (Bengali, English, etc.)
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
  return slug || `article-${Date.now()}`;
};

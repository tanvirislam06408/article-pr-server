export const slugify = (text: string): string => {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s\W-]+/gu, "-") // Matches spaces and non-word characters (supports Unicode)
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
};

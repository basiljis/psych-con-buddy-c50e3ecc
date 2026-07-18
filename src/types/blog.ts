export type BlogCategory = "specialists" | "admins" | "parents" | "product";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  keywords: string[];
  cover_url: string | null;
  author: string;
  reading_minutes: number;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export const BLOG_CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "specialists", label: "Для специалистов" },
  { value: "admins", label: "Для администраторов" },
  { value: "parents", label: "Для родителей" },
  { value: "product", label: "О продукте" },
];

export const blogCategoryLabel = (c: BlogCategory): string =>
  BLOG_CATEGORIES.find((x) => x.value === c)?.label ?? c;

/** Strip HTML tags for plain-text uses (previews, meta descriptions). */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Format a post as plain text suitable for Yandex Zen editor. */
export function postToZenText(post: BlogPost): string {
  // Convert HTML to a Zen-friendly plain text with line breaks between blocks.
  const withBreaks = post.content
    .replace(/<\/(h[1-6]|p|li|ul|ol|div)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");
  const text = stripHtml(withBreaks);
  return `${post.title}\n\n${post.excerpt}\n\n${text}`.replace(/\n{3,}/g, "\n\n").trim();
}

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

/** Format a post as plain text (fallback for editors without HTML paste). */
export function postToZenText(post: BlogPost): string {
  const withBreaks = post.content
    .replace(/<\/(h[1-6]|p|li|ul|ol|div|blockquote)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");
  const text = stripHtml(withBreaks);
  return `${post.title}\n\n${post.excerpt}\n\n${text}`.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Format a post as rich HTML for Яндекс Дзен / Дзен.Редактор.
 * Дзен принимает вставку HTML: сохраняются h2/h3, абзацы, списки, картинки и ссылки.
 */
export function postToZenHtml(post: BlogPost): string {
  const cover = post.cover_url
    ? `<figure><img src="${post.cover_url}" alt="${escapeAttr(post.title)}" /></figure>`
    : "";
  // Normalise: h1 → h2 (в Дзене свой h1), гарантируем абзацы у голого текста.
  let body = post.content.trim();
  body = body.replace(/<h1(\s[^>]*)?>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>");
  if (!/<(h[1-6]|p|ul|ol|figure|blockquote)[\s>]/i.test(body)) {
    body = body
      .split(/\n{2,}/)
      .map((chunk) => `<p>${chunk.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  }
  const lead = post.excerpt ? `<p><strong>${escapeHtml(post.excerpt)}</strong></p>` : "";
  return [
    `<h1>${escapeHtml(post.title)}</h1>`,
    cover,
    lead,
    body,
  ].filter(Boolean).join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}


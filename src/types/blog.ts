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

/** Canonical origin for the site — required for Zen: only absolute links survive paste. */
export const SITE_ORIGIN = "https://unvrsm.ru";

/** Convert every href/src in HTML to an absolute URL against SITE_ORIGIN. */
function absolutizeUrls(html: string): string {
  const abs = (u: string): string => {
    const url = u.trim();
    if (!url) return url;
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return url;
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return SITE_ORIGIN + url;
    return SITE_ORIGIN + "/" + url;
  };
  return html
    .replace(/(<a\b[^>]*\shref=")([^"]+)(")/gi, (_, a, u, c) => a + abs(u) + c)
    .replace(/(<a\b[^>]*\shref=')([^']+)(')/gi, (_, a, u, c) => a + abs(u) + c)
    .replace(/(<img\b[^>]*\ssrc=")([^"]+)(")/gi, (_, a, u, c) => a + abs(u) + c)
    .replace(/(<img\b[^>]*\ssrc=')([^']+)(')/gi, (_, a, u, c) => a + abs(u) + c);
}

/** Strip HTML tags for plain-text uses (previews, meta descriptions). */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Format a post as plain text (fallback for editors without HTML paste).
 * Сохраняем URL рядом с якорями: «текст (https://…)».
 */
export function postToZenText(post: BlogPost): string {
  let src = absolutizeUrls(post.content);
  // <a href="URL">text</a>  →  text (URL)
  src = src.replace(
    /<a\b[^>]*\shref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_, url, text) => `${stripHtml(text)} (${url})`
  );
  const withBreaks = src
    .replace(/<\/(h[1-6]|p|li|ul|ol|div|blockquote|figure)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ");
  const text = stripHtml(withBreaks);
  const cover = post.cover_url ? `[Обложка: ${post.cover_url}]\n\n` : "";
  return `${post.title}\n\n${cover}${post.excerpt}\n\n${text}`
    .replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Format a post as rich HTML for Яндекс Дзен / Дзен.Редактор.
 * Требования Дзена: только абсолютные URL, чистая семантика (h2/h3/p/ul/ol/a),
 * без inline-стилей и скриптов. Обложку в Дзен загружают отдельно (см. кнопку «Скачать обложку»).
 */
export function postToZenHtml(post: BlogPost): string {
  // Normalise: h1 → h2 (в Дзене свой h1), гарантируем абзацы у голого текста.
  let body = post.content.trim();
  body = body.replace(/<h1(\s[^>]*)?>/gi, "<h2>").replace(/<\/h1>/gi, "</h2>");
  if (!/<(h[1-6]|p|ul|ol|figure|blockquote)[\s>]/i.test(body)) {
    body = body
      .split(/\n{2,}/)
      .map((chunk) => `<p>${chunk.replace(/\n/g, "<br/>")}</p>`)
      .join("\n");
  }
  // Абсолютизируем ссылки и добавляем target/rel — Дзен уважает href, если он абсолютный.
  body = absolutizeUrls(body).replace(
    /<a\b([^>]*)>/gi,
    (m, attrs) => (/target=/i.test(attrs) ? m : `<a${attrs} target="_blank" rel="noopener">`)
  );
  const lead = post.excerpt ? `<p><strong>${escapeHtml(post.excerpt)}</strong></p>` : "";
  return [
    `<h1>${escapeHtml(post.title)}</h1>`,
    lead,
    body,
    `<p><em>Источник: <a href="${SITE_ORIGIN}/blog/${post.slug}" target="_blank" rel="noopener">${SITE_ORIGIN}/blog/${post.slug}</a></em></p>`,
  ].filter(Boolean).join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}


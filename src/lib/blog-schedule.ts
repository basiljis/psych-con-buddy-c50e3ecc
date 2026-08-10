import type { BlogPost } from "@/types/blog";

/** Шаг публикации: раз в два дня. */
export const PUBLISH_STEP_DAYS = 2;
/** Час публикации (по времени пользователя) — утро. */
export const PUBLISH_HOUR = 9;

const DAY_MS = 24 * 60 * 60 * 1000;

function atPublishHour(d: Date): Date {
  const x = new Date(d);
  x.setHours(PUBLISH_HOUR, 0, 0, 0);
  return x;
}

/**
 * Следующий свободный слот публикации: +2 дня от самой поздней даты
 * среди уже запланированных/опубликованных статей (но не раньше сегодня).
 */
export function nextPublishSlot(posts: Pick<BlogPost, "published_at">[]): Date {
  const now = new Date();
  const latest = posts.reduce<number>((max, p) => {
    const t = new Date(p.published_at).getTime();
    return Number.isFinite(t) && t > max ? t : max;
  }, 0);
  if (!latest) return atPublishHour(now);
  const candidate = atPublishHour(new Date(latest + PUBLISH_STEP_DAYS * DAY_MS));
  return candidate.getTime() < now.getTime() ? atPublishHour(now) : candidate;
}

/**
 * Пересобрать очередь будущих публикаций с шагом в два дня,
 * сохраняя текущий порядок (по возрастанию даты).
 * Уже опубликованные статьи не трогаем.
 */
export function rebuildQueue(
  posts: Pick<BlogPost, "id" | "published_at" | "title">[]
): { id: string; title: string; from: string; to: string }[] {
  const now = Date.now();
  const future = posts
    .filter((p) => new Date(p.published_at).getTime() > now)
    .sort((a, b) => +new Date(a.published_at) - +new Date(b.published_at));
  if (future.length === 0) return [];

  const past = posts.filter((p) => new Date(p.published_at).getTime() <= now);
  const anchor = past.length
    ? Math.max(...past.map((p) => +new Date(p.published_at)))
    : now;

  return future.map((p, i) => {
    const target = atPublishHour(new Date(anchor + (i + 1) * PUBLISH_STEP_DAYS * DAY_MS));
    const to = target.getTime() < now ? atPublishHour(new Date(now)).toISOString() : target.toISOString();
    return { id: p.id, title: p.title, from: p.published_at, to };
  });
}

/** Значение для <input type="datetime-local"> из ISO-строки. */
export function toLocalInput(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Заполнены ли SEO-поля на обоих языках. */
export function seoCompleteness(p: BlogPost): { ru: boolean; en: boolean; missing: string[] } {
  const missing: string[] = [];
  const ru = Boolean((p.seo_title || p.title) && (p.seo_description || p.excerpt));
  if (!p.seo_title) missing.push("seo_title");
  if (!p.seo_description) missing.push("seo_description");
  const hasEnContent = Boolean(p.title_en || p.content_en);
  const en = hasEnContent && Boolean(p.seo_title_en && p.seo_description_en);
  if (hasEnContent) {
    if (!p.seo_title_en) missing.push("seo_title_en");
    if (!p.seo_description_en) missing.push("seo_description_en");
  } else {
    missing.push("EN-версия");
  }
  return { ru, en, missing };
}

const SITE = "https://unvrsm.ru";

const STATIC_ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/home", priority: "1.0", changefreq: "weekly" },
  { path: "/landing", priority: "0.9", changefreq: "weekly" },
  { path: "/for-organizations", priority: "0.9", changefreq: "monthly" },
  { path: "/for-specialists", priority: "0.9", changefreq: "monthly" },
  { path: "/for-parents", priority: "0.9", changefreq: "monthly" },
  { path: "/features", priority: "0.8", changefreq: "monthly" },
  { path: "/pricing", priority: "0.8", changefreq: "monthly" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/legal", priority: "0.7", changefreq: "monthly" },
  { path: "/documents", priority: "0.5", changefreq: "monthly" },
  { path: "/guides/pmpk-preparation", priority: "0.8", changefreq: "monthly" },
];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));

/**
 * Полный sitemap.xml: статические маршруты + все опубликованные статьи
 * с двуязычными alternate-ссылками (ru/en).
 */
export function buildSitemap(
  posts: Pick<BlogPost, "slug" | "updated_at" | "published_at" | "title_en" | "content_en">[]
): string {
  const staticUrls = STATIC_ROUTES.map(
    (r) => `  <url>
    <loc>${SITE}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  );

  const postUrls = posts.map((p) => {
    const loc = `${SITE}/blog/${esc(p.slug)}`;
    const lastmod = (p.updated_at || p.published_at || "").slice(0, 10);
    const bilingual = Boolean(p.title_en || p.content_en);
    const alternates = bilingual
      ? `
    <xhtml:link rel="alternate" hreflang="ru" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />`
      : "";
    return `  <url>
    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}${alternates}
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticUrls, ...postUrls].join("\n")}
</urlset>
`;
}

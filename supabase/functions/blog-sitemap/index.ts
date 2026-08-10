// Public sitemap.xml for the site: static routes + all published blog posts
// with bilingual (ru/en) alternates. No auth required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SITE = "https://unvrsm.ru";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATIC_ROUTES: [string, string, string][] = [
  ["/", "1.0", "weekly"],
  ["/home", "1.0", "weekly"],
  ["/landing", "0.9", "weekly"],
  ["/for-organizations", "0.9", "monthly"],
  ["/for-specialists", "0.9", "monthly"],
  ["/for-parents", "0.9", "monthly"],
  ["/features", "0.8", "monthly"],
  ["/pricing", "0.8", "monthly"],
  ["/about", "0.6", "monthly"],
  ["/blog", "0.9", "daily"],
  ["/legal", "0.7", "monthly"],
  ["/documents", "0.5", "monthly"],
  ["/guides/pmpk-preparation", "0.8", "monthly"],
];

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c] as string));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug,updated_at,published_at,title_en,content_en")
      .eq("published", true)
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false })
      .limit(1000);

    if (error) throw error;

    const staticUrls = STATIC_ROUTES.map(([path, priority, changefreq]) => `  <url>
    <loc>${SITE}${path}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`);

    const postUrls = (posts ?? []).map((p) => {
      const loc = `${SITE}/blog/${esc(p.slug)}`;
      const lastmod = String(p.updated_at || p.published_at || "").slice(0, 10);
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

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...staticUrls, ...postUrls].join("\n")}
</urlset>
`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e) {
    return new Response(`Sitemap error: ${e instanceof Error ? e.message : String(e)}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

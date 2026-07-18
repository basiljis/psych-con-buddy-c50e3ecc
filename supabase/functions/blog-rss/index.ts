// Public RSS 2.0 feed for the blog. No auth required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SITE_URL = "https://unvrsm.ru";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
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
      .select("slug,title,excerpt,content,category,author,published_at,cover_url")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    const items = (posts ?? [])
      .map((p) => {
        const url = `${SITE_URL}/blog/${p.slug}`;
        const pubDate = new Date(p.published_at).toUTCString();
        const description = escapeXml(p.excerpt || stripHtml(p.content).slice(0, 300));
        return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>editor@unvrsm.ru (${escapeXml(p.author || "universum.")})</author>
      <category>${escapeXml(p.category)}</category>
      <description>${description}</description>
      <content:encoded><![CDATA[${p.content}]]></content:encoded>
    </item>`;
      })
      .join("\n");

    const lastBuild = posts && posts[0]
      ? new Date(posts[0].published_at).toUTCString()
      : new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>universum. — Блог</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Статьи для педагогов-психологов, логопедов, дефектологов, администраторов ППМС и родителей.</description>
    <language>ru</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  } catch (e) {
    return new Response(`RSS error: ${e instanceof Error ? e.message : String(e)}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

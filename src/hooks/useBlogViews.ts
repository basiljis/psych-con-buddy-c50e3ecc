import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BlogViewStat = {
  post_slug: string;
  total_views: number;
  unique_views: number;
};

const VISITOR_KEY = "blog_visitor_id";
const THROTTLE_PREFIX = "blog_view_ts_";
const THROTTLE_MS = 60 * 60 * 1000; // 1 hour per slug

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function classifySource(referrer: string): string {
  if (!referrer) return "direct";
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    if (h.includes("google.")) return "google";
    if (h.includes("yandex.") || h.includes("ya.ru")) return "yandex";
    if (h.includes("dzen.ru") || h.includes("zen.yandex")) return "dzen";
    if (h.includes("t.me") || h.includes("telegram")) return "telegram";
    if (h.includes("vk.com") || h.includes("vk.ru")) return "vk";
    if (h.includes("mail.ru")) return "mail";
    if (h.includes("bing.")) return "bing";
    if (h.includes("duckduckgo.")) return "duckduckgo";
    if (h.includes("facebook.") || h.includes("fb.com")) return "facebook";
    if (h.includes("twitter.") || h.includes("x.com")) return "twitter";
    if (h.includes("linkedin.")) return "linkedin";
    if (h.includes("youtube.") || h.includes("youtu.be")) return "youtube";
    if (h.includes("unvrsm.ru") || h.includes("lovable.app")) return "internal";
    return h;
  } catch {
    return "other";
  }
}

export function useBlogViewStats() {
  const [stats, setStats] = useState<Record<string, BlogViewStat>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_blog_view_stats");
      const map: Record<string, BlogViewStat> = {};
      for (const row of (data ?? []) as BlogViewStat[]) {
        map[row.post_slug] = row;
      }
      setStats(map);
      setLoading(false);
    })();
  }, []);

  return { stats, loading };
}

export function useLogBlogView(slug: string | undefined) {
  useEffect(() => {
    if (!slug) return;
    try {
      const key = THROTTLE_PREFIX + slug;
      const last = Number(localStorage.getItem(key) ?? "0");
      if (Date.now() - last < THROTTLE_MS) return;
      localStorage.setItem(key, String(Date.now()));
    } catch {
      // ignore
    }
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    supabase
      .from("blog_views")
      .insert({
        post_slug: slug,
        visitor_id: getVisitorId(),
        referrer: referrer || null,
        source: classifySource(referrer),
        path: path || null,
      })
      .then(() => {});
  }, [slug]);
}

export function useLogBlogClick(slug: string | undefined) {
  return useCallback(
    (url: string, linkType: "external" | "cta" | "related" | "internal" = "external") => {
      if (!slug || !url) return;
      const referrer = typeof document !== "undefined" ? document.referrer : "";
      supabase
        .from("blog_link_clicks")
        .insert({
          post_slug: slug,
          url,
          link_type: linkType,
          visitor_id: getVisitorId(),
          referrer: referrer || null,
          source: classifySource(referrer),
        })
        .then(() => {});
    },
    [slug],
  );
}

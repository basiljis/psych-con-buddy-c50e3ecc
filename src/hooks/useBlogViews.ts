import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BlogViewStat = {
  post_slug: string;
  total_views: number;
  unique_views: number;
};

const VISITOR_KEY = "blog_visitor_id";
const THROTTLE_PREFIX = "blog_view_ts_";
const THROTTLE_MS = 60 * 60 * 1000; // 1 hour per slug

function getVisitorId(): string {
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
    supabase
      .from("blog_views")
      .insert({ post_slug: slug, visitor_id: getVisitorId() })
      .then(() => {});
  }, [slug]);
}

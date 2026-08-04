import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getVisitorId } from "@/hooks/useBlogViews";

/** Aggregated "helpful" votes per post slug. */
export function useBlogPostLikeStats() {
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any).rpc("get_blog_post_like_stats");
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as { post_slug: string; likes: number }[]) {
        map[row.post_slug] = Number(row.likes) || 0;
      }
      setLikes(map);
      setLoading(false);
    })();
  }, []);

  return { likes, loading };
}

/** "Was this article helpful?" vote for a single post. */
export function useBlogPostRating(slug: string | undefined) {
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      setLoading(true);
      const visitor = getVisitorId();
      const [{ count: total }, { data: mine }] = await Promise.all([
        (supabase as any)
          .from("blog_post_likes")
          .select("*", { count: "exact", head: true })
          .eq("post_slug", slug),
        (supabase as any)
          .from("blog_post_likes")
          .select("id")
          .eq("post_slug", slug)
          .eq("visitor_id", visitor)
          .maybeSingle(),
      ]);
      if (!active) return;
      setCount(total ?? 0);
      setLiked(!!mine);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const toggle = useCallback(async () => {
    if (!slug || saving) return;
    const visitor = getVisitorId();
    const next = !liked;
    setSaving(true);
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    const { error } = next
      ? await (supabase as any)
          .from("blog_post_likes")
          .insert({ post_slug: slug, visitor_id: visitor })
      : await (supabase as any)
          .from("blog_post_likes")
          .delete()
          .eq("post_slug", slug)
          .eq("visitor_id", visitor);
    if (error) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
    setSaving(false);
  }, [slug, liked, saving]);

  return { count, liked, loading, saving, toggle };
}

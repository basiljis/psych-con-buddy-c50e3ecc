CREATE OR REPLACE FUNCTION public.get_blog_totals()
RETURNS TABLE(total_views bigint, unique_visitors bigint, views_7d bigint, clicks_total bigint, post_likes bigint, comment_likes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.blog_views)::bigint,
    (SELECT COUNT(DISTINCT visitor_id) FROM public.blog_views WHERE visitor_id IS NOT NULL)::bigint,
    (SELECT COUNT(*) FROM public.blog_views WHERE created_at >= now() - INTERVAL '7 days')::bigint,
    (SELECT COUNT(*) FROM public.blog_link_clicks)::bigint,
    (SELECT COUNT(*) FROM public.blog_post_likes)::bigint,
    (SELECT COUNT(*) FROM public.blog_comment_likes)::bigint;
$$;

GRANT EXECUTE ON FUNCTION public.get_blog_totals() TO anon, authenticated;

CREATE TABLE public.blog_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug text NOT NULL,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX blog_views_post_slug_idx ON public.blog_views(post_slug);
CREATE INDEX blog_views_visitor_idx ON public.blog_views(visitor_id);

GRANT SELECT, INSERT ON public.blog_views TO anon, authenticated;
GRANT ALL ON public.blog_views TO service_role;

ALTER TABLE public.blog_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a blog view"
  ON public.blog_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read blog views"
  ON public.blog_views FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.get_blog_view_stats()
RETURNS TABLE(post_slug text, total_views bigint, unique_views bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    post_slug,
    COUNT(*)::bigint AS total_views,
    COUNT(DISTINCT visitor_id)::bigint AS unique_views
  FROM public.blog_views
  GROUP BY post_slug;
$$;


ALTER TABLE public.blog_views
  ADD COLUMN IF NOT EXISTS referrer TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS path TEXT;

CREATE INDEX IF NOT EXISTS idx_blog_views_created_at ON public.blog_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_views_slug ON public.blog_views(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_views_source ON public.blog_views(source);

CREATE TABLE IF NOT EXISTS public.blog_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'external',
  visitor_id TEXT,
  referrer TEXT,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.blog_link_clicks TO anon;
GRANT SELECT, INSERT ON public.blog_link_clicks TO authenticated;
GRANT ALL ON public.blog_link_clicks TO service_role;

ALTER TABLE public.blog_link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert clicks" ON public.blog_link_clicks;
CREATE POLICY "Anyone can insert clicks"
  ON public.blog_link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read clicks" ON public.blog_link_clicks;
CREATE POLICY "Admins can read clicks"
  ON public.blog_link_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_blog_clicks_slug ON public.blog_link_clicks(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_clicks_created_at ON public.blog_link_clicks(created_at DESC);

CREATE OR REPLACE FUNCTION public.get_blog_analytics()
RETURNS TABLE(
  post_slug TEXT,
  total_views BIGINT,
  unique_views BIGINT,
  views_7d BIGINT,
  views_30d BIGINT,
  clicks_total BIGINT,
  ctr NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH v AS (
    SELECT
      post_slug,
      COUNT(*)::BIGINT AS total_views,
      COUNT(DISTINCT visitor_id)::BIGINT AS unique_views,
      COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days')::BIGINT AS views_7d,
      COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '30 days')::BIGINT AS views_30d
    FROM public.blog_views
    GROUP BY post_slug
  ),
  c AS (
    SELECT post_slug, COUNT(*)::BIGINT AS clicks_total
    FROM public.blog_link_clicks
    GROUP BY post_slug
  )
  SELECT
    COALESCE(v.post_slug, c.post_slug) AS post_slug,
    COALESCE(v.total_views, 0),
    COALESCE(v.unique_views, 0),
    COALESCE(v.views_7d, 0),
    COALESCE(v.views_30d, 0),
    COALESCE(c.clicks_total, 0),
    CASE WHEN COALESCE(v.total_views,0) > 0
      THEN ROUND((COALESCE(c.clicks_total,0)::NUMERIC / v.total_views) * 100, 2)
      ELSE 0
    END AS ctr
  FROM v
  FULL OUTER JOIN c ON v.post_slug = c.post_slug;
$$;

CREATE OR REPLACE FUNCTION public.get_blog_sources(_slug TEXT DEFAULT NULL)
RETURNS TABLE(source TEXT, views BIGINT, unique_views BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    COALESCE(NULLIF(source, ''), 'direct') AS source,
    COUNT(*)::BIGINT AS views,
    COUNT(DISTINCT visitor_id)::BIGINT AS unique_views
  FROM public.blog_views
  WHERE _slug IS NULL OR post_slug = _slug
  GROUP BY 1
  ORDER BY views DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_blog_views_timeseries(_days INT DEFAULT 30, _slug TEXT DEFAULT NULL)
RETURNS TABLE(day DATE, views BIGINT, unique_views BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH days AS (
    SELECT generate_series(
      (CURRENT_DATE - (_days - 1) * INTERVAL '1 day')::DATE,
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE AS day
  )
  SELECT
    d.day,
    COALESCE(COUNT(bv.id), 0)::BIGINT AS views,
    COALESCE(COUNT(DISTINCT bv.visitor_id), 0)::BIGINT AS unique_views
  FROM days d
  LEFT JOIN public.blog_views bv
    ON bv.created_at::DATE = d.day
    AND (_slug IS NULL OR bv.post_slug = _slug)
  GROUP BY d.day
  ORDER BY d.day;
$$;

CREATE OR REPLACE FUNCTION public.get_blog_top_links(_limit INT DEFAULT 20, _slug TEXT DEFAULT NULL)
RETURNS TABLE(url TEXT, link_type TEXT, clicks BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT url, link_type, COUNT(*)::BIGINT AS clicks
  FROM public.blog_link_clicks
  WHERE _slug IS NULL OR post_slug = _slug
  GROUP BY url, link_type
  ORDER BY clicks DESC
  LIMIT _limit;
$$;

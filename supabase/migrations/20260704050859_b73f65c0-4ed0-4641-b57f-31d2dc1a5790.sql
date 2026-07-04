
CREATE TABLE public.legal_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id text,
  visitor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_views_section ON public.legal_views(section_id);
CREATE INDEX idx_legal_views_visitor ON public.legal_views(visitor_id);

GRANT SELECT, INSERT ON public.legal_views TO anon, authenticated;
GRANT ALL ON public.legal_views TO service_role;

ALTER TABLE public.legal_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert legal views"
  ON public.legal_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read legal views"
  ON public.legal_views FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.get_legal_view_stats()
RETURNS TABLE(section_id text, total_views bigint, unique_views bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    section_id,
    COUNT(*)::bigint AS total_views,
    COUNT(DISTINCT visitor_id)::bigint AS unique_views
  FROM public.legal_views
  GROUP BY section_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_legal_view_stats() TO anon, authenticated;

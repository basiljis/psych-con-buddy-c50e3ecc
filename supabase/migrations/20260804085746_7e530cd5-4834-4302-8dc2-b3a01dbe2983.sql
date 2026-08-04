CREATE TABLE public.blog_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_slug, visitor_id)
);

GRANT SELECT, INSERT, DELETE ON public.blog_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.blog_post_likes TO authenticated;
GRANT ALL ON public.blog_post_likes TO service_role;

ALTER TABLE public.blog_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post likes"
ON public.blog_post_likes FOR SELECT USING (true);

CREATE POLICY "Anyone can add post likes"
ON public.blog_post_likes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can remove post likes"
ON public.blog_post_likes FOR DELETE USING (true);

CREATE INDEX idx_blog_post_likes_slug ON public.blog_post_likes(post_slug);

CREATE OR REPLACE FUNCTION public.get_blog_post_like_stats()
RETURNS TABLE(post_slug TEXT, likes BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT post_slug, COUNT(*)::BIGINT AS likes
  FROM public.blog_post_likes
  GROUP BY post_slug;
$$;
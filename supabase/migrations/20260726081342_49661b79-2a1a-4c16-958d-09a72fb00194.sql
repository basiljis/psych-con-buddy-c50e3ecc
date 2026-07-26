
CREATE TABLE public.blog_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX blog_comment_likes_unique ON public.blog_comment_likes(comment_id, visitor_id);
CREATE INDEX blog_comment_likes_comment_idx ON public.blog_comment_likes(comment_id);

GRANT SELECT, INSERT, DELETE ON public.blog_comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.blog_comment_likes TO authenticated;
GRANT ALL ON public.blog_comment_likes TO service_role;

ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes"
  ON public.blog_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can add a like"
  ON public.blog_comment_likes FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "Owner can remove own like"
  ON public.blog_comment_likes FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

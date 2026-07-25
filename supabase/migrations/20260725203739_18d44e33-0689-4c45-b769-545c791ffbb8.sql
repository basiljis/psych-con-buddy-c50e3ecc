-- Enum for moderation status
DO $$ BEGIN
  CREATE TYPE public.blog_comment_status AS ENUM ('pending', 'approved', 'rejected', 'spam');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_email text,
  content text NOT NULL,
  status public.blog_comment_status NOT NULL DEFAULT 'pending',
  is_author_reply boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_comments_content_len CHECK (char_length(content) BETWEEN 2 AND 4000),
  CONSTRAINT blog_comments_name_len CHECK (char_length(author_name) BETWEEN 1 AND 100)
);

GRANT SELECT, INSERT ON public.blog_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone (guest or logged in) can read approved comments
CREATE POLICY "Anyone can read approved comments"
  ON public.blog_comments
  FOR SELECT
  USING (status = 'approved');

-- Admins can read every comment (pending, rejected, spam)
CREATE POLICY "Admins can read all comments"
  ON public.blog_comments
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Guests may submit comments only as pending, without impersonating a user
CREATE POLICY "Guests can submit pending comments"
  ON public.blog_comments
  FOR INSERT
  TO anon
  WITH CHECK (
    status = 'pending'
    AND user_id IS NULL
    AND is_author_reply = false
  );

-- Authenticated users may submit their own pending comments (never an author reply)
CREATE POLICY "Users can submit pending comments"
  ON public.blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending'
    AND is_author_reply = false
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Admins can insert anything (used for author replies with status='approved' and is_author_reply=true)
CREATE POLICY "Admins can insert any comment"
  ON public.blog_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update comments"
  ON public.blog_comments
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete comments"
  ON public.blog_comments
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX blog_comments_post_status_idx ON public.blog_comments (post_id, status, created_at DESC);
CREATE INDEX blog_comments_status_idx ON public.blog_comments (status, created_at DESC);
CREATE INDEX blog_comments_parent_idx ON public.blog_comments (parent_id);

CREATE TRIGGER blog_comments_updated_at
  BEFORE UPDATE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
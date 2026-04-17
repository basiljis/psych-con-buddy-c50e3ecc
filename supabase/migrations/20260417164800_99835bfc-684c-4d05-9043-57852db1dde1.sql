-- 1. Telegram bot polling state (singleton)
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access bot state"
ON public.telegram_bot_state
FOR ALL
USING (false);

-- 2. Telegram chat links (binding Telegram chat to platform user)
CREATE TABLE public.telegram_chat_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  parent_user_id UUID,
  chat_id BIGINT NOT NULL,
  username TEXT,
  first_name TEXT,
  link_code TEXT NOT NULL UNIQUE,
  link_type TEXT NOT NULL DEFAULT 'specialist' CHECK (link_type IN ('specialist', 'parent', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chat_link_user_check CHECK (user_id IS NOT NULL OR parent_user_id IS NOT NULL OR linked_at IS NULL)
);

CREATE INDEX idx_telegram_chat_links_chat_id ON public.telegram_chat_links(chat_id);
CREATE INDEX idx_telegram_chat_links_user_id ON public.telegram_chat_links(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_telegram_chat_links_parent ON public.telegram_chat_links(parent_user_id) WHERE parent_user_id IS NOT NULL;

ALTER TABLE public.telegram_chat_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own chat links"
ON public.telegram_chat_links
FOR SELECT
USING (
  auth.uid() = user_id 
  OR auth.uid() = parent_user_id 
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users insert their own chat links"
ON public.telegram_chat_links
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = parent_user_id);

CREATE POLICY "Users update their own chat links"
ON public.telegram_chat_links
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = parent_user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users delete their own chat links"
ON public.telegram_chat_links
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = parent_user_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_telegram_chat_links_updated_at
BEFORE UPDATE ON public.telegram_chat_links
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Incoming messages from Telegram
CREATE TABLE public.telegram_messages (
  update_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  username TEXT,
  text TEXT,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_result TEXT,
  raw_update JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages(chat_id);
CREATE INDEX idx_telegram_messages_processed ON public.telegram_messages(processed) WHERE processed = false;

ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view all telegram messages"
ON public.telegram_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 4. Outgoing notifications queue
CREATE TABLE public.telegram_notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID,
  recipient_parent_id UUID,
  recipient_chat_id BIGINT,
  message_text TEXT NOT NULL,
  parse_mode TEXT DEFAULT 'HTML',
  notification_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_notif_status ON public.telegram_notifications_queue(status) WHERE status = 'pending';
CREATE INDEX idx_telegram_notif_recipient ON public.telegram_notifications_queue(recipient_user_id) WHERE recipient_user_id IS NOT NULL;

ALTER TABLE public.telegram_notifications_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own notifications"
ON public.telegram_notifications_queue
FOR SELECT
USING (
  auth.uid() = recipient_user_id 
  OR auth.uid() = recipient_parent_id 
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can queue notifications"
ON public.telegram_notifications_queue
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_telegram_notif_updated_at
BEFORE UPDATE ON public.telegram_notifications_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Marketing posts (drafts for cross-posting)
CREATE TABLE public.marketing_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  target_channels TEXT[] NOT NULL DEFAULT ARRAY['telegram']::TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  publish_results JSONB DEFAULT '{}'::jsonb,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_posts_org ON public.marketing_posts(organization_id);
CREATE INDEX idx_marketing_posts_status ON public.marketing_posts(status);
CREATE INDEX idx_marketing_posts_creator ON public.marketing_posts(created_by);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published or own posts"
ON public.marketing_posts
FOR SELECT
USING (
  status = 'published'
  OR created_by = auth.uid()
  OR has_role(auth.uid(), 'admin')
  OR (organization_id IS NOT NULL AND organization_id = get_user_organization(auth.uid()))
);

CREATE POLICY "Authenticated users can create posts"
ON public.marketing_posts
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update posts"
ON public.marketing_posts
FOR UPDATE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators and admins can delete posts"
ON public.marketing_posts
FOR DELETE
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_marketing_posts_updated_at
BEFORE UPDATE ON public.marketing_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Helper function to generate Telegram link codes
CREATE OR REPLACE FUNCTION public.generate_telegram_link_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := 'TG-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;
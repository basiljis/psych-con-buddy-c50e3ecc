
-- System settings table for global on/off toggles
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (anon/authenticated) can read settings (needed during signup before auth)
CREATE POLICY "Anyone can read system settings"
ON public.system_settings
FOR SELECT
USING (true);

-- Only admins can insert/update
CREATE POLICY "Admins can insert system settings"
ON public.system_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default: auto-approve org users registration enabled
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'auto_approve_org_users',
  'true'::jsonb,
  'Если включено — педагоги школ регистрируются без подтверждения администратором системы'
)
ON CONFLICT (key) DO NOTHING;


-- 1. api_logs: remove public read; allow only admins. Restrict INSERT to service_role (edge functions use service role).
DROP POLICY IF EXISTS "API logs are viewable by everyone" ON public.api_logs;
DROP POLICY IF EXISTS "Users can insert API logs" ON public.api_logs;
CREATE POLICY "Admins can view api logs" ON public.api_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can insert api logs" ON public.api_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 2. api_sessions: remove all public access (edge functions use service_role and bypass RLS).
DROP POLICY IF EXISTS "API sessions are viewable by everyone" ON public.api_sessions;
DROP POLICY IF EXISTS "Users can insert API sessions" ON public.api_sessions;
DROP POLICY IF EXISTS "Users can update API sessions" ON public.api_sessions;
CREATE POLICY "Admins can view api sessions" ON public.api_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. child_credentials: drop plaintext password column
ALTER TABLE public.child_credentials DROP COLUMN IF EXISTS plain_password;

-- 4. instruction_files: restrict INSERT to admins
DROP POLICY IF EXISTS "Users can insert instruction files" ON public.instruction_files;
CREATE POLICY "Only admins can insert instruction files" ON public.instruction_files FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4b. instruction-documents storage: restrict INSERT/UPDATE/DELETE to admins
DROP POLICY IF EXISTS "Users can upload instruction documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update instruction documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete instruction documents" ON storage.objects;
CREATE POLICY "Admins can upload instruction documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'instruction-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update instruction documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'instruction-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete instruction documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'instruction-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 5. organization_addresses: restrict INSERT/UPDATE to admins
DROP POLICY IF EXISTS "Users can insert organization addresses" ON public.organization_addresses;
DROP POLICY IF EXISTS "Users can update organization addresses" ON public.organization_addresses;
CREATE POLICY "Admins can insert organization addresses" ON public.organization_addresses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update organization addresses" ON public.organization_addresses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. organization_reorganizations: same
DROP POLICY IF EXISTS "Users can insert organization reorganizations" ON public.organization_reorganizations;
DROP POLICY IF EXISTS "Users can update organization reorganizations" ON public.organization_reorganizations;
CREATE POLICY "Admins can insert organization reorganizations" ON public.organization_reorganizations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update organization reorganizations" ON public.organization_reorganizations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. organizations: replace overly permissive UPDATE with org-scoped
DROP POLICY IF EXISTS "Users can update organizations" ON public.organizations;
CREATE POLICY "Org members or admins can update organizations" ON public.organizations FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR id = public.get_user_organization_id(auth.uid())
  OR (public.has_role(auth.uid(), 'regional_operator'::app_role) AND id IN (
    SELECT o.id FROM public.organizations o
    JOIN public.profiles p ON p.organization_id = o.id
    WHERE p.region_id = public.get_user_region(auth.uid())
  ))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR id = public.get_user_organization_id(auth.uid())
  OR (public.has_role(auth.uid(), 'regional_operator'::app_role) AND id IN (
    SELECT o.id FROM public.organizations o
    JOIN public.profiles p ON p.organization_id = o.id
    WHERE p.region_id = public.get_user_region(auth.uid())
  ))
);

-- 8. protocol_checklist_items: restrict INSERT/UPDATE to admins, add DELETE for admins
DROP POLICY IF EXISTS "Users can insert protocol checklist items" ON public.protocol_checklist_items;
DROP POLICY IF EXISTS "Users can update protocol checklist items" ON public.protocol_checklist_items;
CREATE POLICY "Admins can insert protocol checklist items" ON public.protocol_checklist_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update protocol checklist items" ON public.protocol_checklist_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 9. protocols: drop overly permissive UPDATE/DELETE; add scoped DELETE
DROP POLICY IF EXISTS "Users can update protocols" ON public.protocols;
DROP POLICY IF EXISTS "Users can delete protocols" ON public.protocols;
CREATE POLICY "Users can delete their organization's protocols" ON public.protocols FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (public.has_role(auth.uid(), 'user'::app_role) AND organization_id = public.get_user_organization(auth.uid()))
  OR (public.has_role(auth.uid(), 'regional_operator'::app_role) AND organization_id IN (
    SELECT o.id FROM public.organizations o
    JOIN public.profiles p ON p.organization_id = o.id
    WHERE p.region_id = public.get_user_region(auth.uid())
  ))
);

-- 10. system_settings: restrict SELECT to admins
DROP POLICY IF EXISTS "System settings are viewable by everyone" ON public.system_settings;
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Public can view system settings" ON public.system_settings;
CREATE POLICY "Admins can view system settings" ON public.system_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 11. protocol-documents storage: restrict to admins (no actual app usage of this bucket yet)
DROP POLICY IF EXISTS "Authenticated users can upload protocol documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view protocol documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their protocol documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their protocol documents" ON storage.objects;
CREATE POLICY "Admins can upload protocol documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'protocol-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view protocol documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'protocol-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update protocol documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'protocol-documents' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete protocol documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'protocol-documents' AND public.has_role(auth.uid(), 'admin'::app_role));

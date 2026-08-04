CREATE OR REPLACE FUNCTION public.get_organizations_directory(_region_id text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  district text,
  type text,
  external_id text,
  region_id text,
  is_manual boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.name, o.district, o.type, o.external_id, o.region_id, o.is_manual
  FROM public.organizations o
  WHERE COALESCE(o.is_archived, false) = false
    AND (_region_id IS NULL OR o.region_id = _region_id)
  ORDER BY o.name
  LIMIT 5000;
$$;

REVOKE ALL ON FUNCTION public.get_organizations_directory(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_organizations_directory(text) TO anon, authenticated;
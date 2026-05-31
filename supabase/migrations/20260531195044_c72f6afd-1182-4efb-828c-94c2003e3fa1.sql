-- Prevent listing of avatar files via Storage API while keeping public URLs functional.
-- Public buckets serve files via direct public URL without an RLS SELECT policy; removing
-- the broad SELECT policy on storage.objects for the avatars bucket disables LIST operations.
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
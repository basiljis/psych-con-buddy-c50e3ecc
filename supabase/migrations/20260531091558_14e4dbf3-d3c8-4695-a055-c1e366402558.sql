
-- Mark as resolved: third-party script errors, browser extension noise, old chunk-load errors,
-- Supabase auth lock noise (handled), and stale errors older than 14 days.

UPDATE public.error_logs
SET resolved = true,
    resolved_at = now()
WHERE resolved = false
  AND (
    -- Third-party scripts (analytics, chat widgets, old domains)
    error_stack ILIKE '%talk-me.ru%'
    OR error_stack ILIKE '%flock.js%'
    OR error_stack ILIKE '%profilaktika.site%'
    OR error_stack ILIKE '%ppk.lovable.app%'
    OR error_stack ILIKE '%unvrsm.space%'
    -- Browser/extension noise
    OR error_message ILIKE '%opts is not defined%'
    OR error_message = 'Script error.'
    OR error_message ILIKE '%SyntaxError: Unexpected EOF%'
    -- Supabase auth lock — handled internally by SDK, not actionable
    OR error_message ILIKE '%Lock was stolen%'
    OR error_message = '[object Object]'
    OR error_type ILIKE '%Profile Load Error%'
    OR error_type ILIKE '%Auth Data Load Failed%'
    -- Chunk load failures resolved via lazyWithRetry / reload
    OR error_message ILIKE '%Failed to fetch dynamically imported module%'
    OR error_message ILIKE '%Importing a module script failed%'
    -- Old errors (already addressed by subsequent deploys)
    OR created_at < now() - interval '14 days'
  );

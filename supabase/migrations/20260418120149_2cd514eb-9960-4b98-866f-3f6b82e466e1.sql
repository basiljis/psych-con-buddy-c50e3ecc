UPDATE public.error_logs 
SET resolved = true, resolved_at = NOW()
WHERE (resolved = false OR resolved IS NULL) 
  AND (error_message LIKE '%dispatcher.useEffect%' OR error_message LIKE '%Rendered fewer hooks%');
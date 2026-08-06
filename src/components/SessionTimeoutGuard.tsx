import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

/**
 * Держит правила бездействия (15 минут) активными на любой странице,
 * включая публичный сайт — чтобы пользователь мог уйти «на сайт»
 * из личного кабинета, не теряя доступ, но с тем же контролем сессии.
 */
function TimeoutRunner() {
  useSessionTimeout();
  return null;
}

export function SessionTimeoutGuard() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setHasSession(!!data?.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!hasSession) return null;
  return <TimeoutRunner />;
}

export default SessionTimeoutGuard;

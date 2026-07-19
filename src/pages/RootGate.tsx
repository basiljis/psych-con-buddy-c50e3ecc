import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Preloader from "@/components/Preloader";

// Lightweight auth gate. Uses getSession() (reads from localStorage, no network)
// instead of getUser() to avoid blocking on Supabase requests when the API is slow
// or unreachable. Falls back to landing after a short timeout in any case.
const RootGate = () => {
  const [checked, setChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Hard cap: never keep the preloader longer than 1.5s.
    const timeout = setTimeout(() => {
      if (mounted) {
        setIsAuthed(false);
        setChecked(true);
      }
    }, 1500);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        clearTimeout(timeout);
        setIsAuthed(!!data?.session?.user);
        setChecked(true);
      })
      .catch(() => {
        if (!mounted) return;
        clearTimeout(timeout);
        setIsAuthed(false);
        setChecked(true);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  if (!checked) return <Preloader />;

  if (isAuthed) return <Navigate to="/app" replace />;
  return <Navigate to="/home" replace />;
};

export default RootGate;


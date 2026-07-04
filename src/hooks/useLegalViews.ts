import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "unvrsm_visitor_id";
const SESSION_KEY_PREFIX = "unvrsm_legal_view_";

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export interface LegalViewStat {
  section_id: string | null;
  total_views: number;
  unique_views: number;
}

/**
 * Логирует просмотр раздела (или общей страницы, если sectionId === null)
 * не чаще одного раза в час на одного посетителя на раздел.
 */
export function useLogLegalView(sectionId: string | null) {
  useEffect(() => {
    const key = SESSION_KEY_PREFIX + (sectionId ?? "__index__");
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 60 * 60 * 1000) return;
    sessionStorage.setItem(key, String(Date.now()));

    const visitor_id = getVisitorId();
    supabase
      .from("legal_views")
      .insert({ section_id: sectionId, visitor_id })
      .then(({ error }) => {
        if (error) console.warn("legal_views insert failed", error);
      });
  }, [sectionId]);
}

/**
 * Возвращает статистику по всем разделам (и общей странице).
 */
export function useLegalViewStats() {
  const [stats, setStats] = useState<Record<string, LegalViewStat>>({});
  const [totals, setTotals] = useState<{ total: number; unique: number }>({
    total: 0,
    unique: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.rpc("get_legal_view_stats");
      if (cancelled) return;
      if (error || !data) {
        setLoading(false);
        return;
      }
      const map: Record<string, LegalViewStat> = {};
      let totalAll = 0;
      let uniqueSet = 0;
      for (const row of data as LegalViewStat[]) {
        const key = row.section_id ?? "__index__";
        map[key] = row;
        totalAll += Number(row.total_views) || 0;
        // approximate: sum of unique per section (visitors могут пересекаться,
        // но для наглядной сводки достаточно)
        uniqueSet += Number(row.unique_views) || 0;
      }
      setStats(map);
      setTotals({ total: totalAll, unique: uniqueSet });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, totals, loading };
}

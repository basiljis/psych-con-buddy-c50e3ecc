import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FastOrganization {
  id: string;
  name: string;
  district?: string | null;
  type?: string | null;
  external_id?: string | null;
  region_id?: string | null;
  is_manual?: boolean;
}

const CACHE_VERSION = 'v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const cacheKey = (regionId?: string) =>
  `orgs_cache_${CACHE_VERSION}_${regionId || 'all'}`;

const readCache = (regionId?: string): FastOrganization[] | null => {
  try {
    const raw = sessionStorage.getItem(cacheKey(regionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data as FastOrganization[];
  } catch {
    return null;
  }
};

const writeCache = (regionId: string | undefined, data: FastOrganization[]) => {
  try {
    sessionStorage.setItem(
      cacheKey(regionId),
      JSON.stringify({ ts: Date.now(), data })
    );
  } catch {
    // quota — ignore
  }
};

/**
 * Lightweight organization loader optimized for the registration form.
 * - Selects only the columns needed for the selector (no joins).
 * - Filters by region server-side when provided (uses idx_organizations_region_id).
 * - Caches by region in sessionStorage for instant re-opens.
 */
export const useOrganizationsFast = (regionId?: string) => {
  const [organizations, setOrganizations] = useState<FastOrganization[]>(
    () => readCache(regionId) || []
  );
  const [loading, setLoading] = useState<boolean>(() => !readCache(regionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = readCache(regionId);
    if (cached) {
      setOrganizations(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const load = async () => {
      try {
        let query = supabase
          .from('organizations')
          .select('id, name, district, type, external_id, region_id, is_manual')
          .eq('is_archived', false)
          .order('name')
          .limit(2000);

        if (regionId) {
          query = query.eq('region_id', regionId);
        }

        const { data, error } = await query;
        if (cancelled) return;
        if (error) throw error;

        const orgs = (data || []) as FastOrganization[];
        setOrganizations(orgs);
        writeCache(regionId, orgs);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('[useOrganizationsFast] load error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  return { organizations, loading, error };
};

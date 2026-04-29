import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSystemSetting = <T = unknown>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (!error && data && data.value !== null && data.value !== undefined) {
      setValue(data.value as T);
    }
    setLoading(false);
  }, [key]);

  useEffect(() => {
    reload();
  }, [reload]);

  const update = useCallback(
    async (newValue: T) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value: newValue as any }, { onConflict: 'key' });
      if (!error) setValue(newValue);
      return !error;
    },
    [key]
  );

  return { value, loading, update, reload };
};

/** One-shot read (no subscription). Useful during signup before login. */
export const fetchSystemSetting = async <T = unknown>(
  key: string,
  defaultValue: T
): Promise<T> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error || !data || data.value === null || data.value === undefined) {
    return defaultValue;
  }
  return data.value as T;
};

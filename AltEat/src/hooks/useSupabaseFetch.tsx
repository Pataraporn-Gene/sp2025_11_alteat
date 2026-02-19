import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FetchOptions {
  enabled?: boolean;
}

export function useSupabaseFetch<T>(
  table: string, 
  id?: string | number,
  options: FetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        let query = supabase.from(table).select('*');
        
        if (id) {
          const { data, error } = await query.eq('id', id).single();
          if (error) throw error;
          setData(data as T);
        } else {
          const { data, error } = await query;
          if (error) throw error;
          setData(data as T);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [table, id, enabled]);

  return { data, loading, error };
}
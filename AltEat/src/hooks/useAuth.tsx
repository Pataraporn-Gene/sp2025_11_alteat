import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = async (
    email: string,
    password: string,
    username: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username, 
          },
        },
      });

      if (error) throw error;

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
}

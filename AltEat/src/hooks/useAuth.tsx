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
      if (err instanceof Error) {
        if (err.message.includes('already registered')) {
          setError("An account with this email already exists");
        } else if (err.message.includes('Password should be')) {
          setError("Password must be at least 6 characters");
        } else {
          setError("Sign up failed. Please try again");
        }
      } else {
        setError("Sign up failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return { signUp, loading, error };
}

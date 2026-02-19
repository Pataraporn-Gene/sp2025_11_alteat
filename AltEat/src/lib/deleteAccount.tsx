import { supabase } from "./supabase";

export async function deleteAccount(userId: string) {
  return supabase.functions.invoke("delete-user", {
    body: { user_id: userId },
  });
}
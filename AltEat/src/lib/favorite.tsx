import { supabase } from "./supabase";

export async function addFavorite(recipeId: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("favorite").upsert(
    {
      user_id: user.id,
      recipe_id: recipeId,
    },
    {
      onConflict: "user_id,recipe_id",
    },
  );

  if (error) throw error;
}

export async function removeFavorite(recipeId: number) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("favorite")
    .delete()
    .eq("user_id", user.id)
    .eq("recipe_id", recipeId);

  if (error) throw error;
}

export async function getFavoriteIds(): Promise<number[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("favorite")
    .select("recipe_id")
    .eq("user_id", user.id);

  if (error) throw error;

  return data.map((row) => row.recipe_id);
}

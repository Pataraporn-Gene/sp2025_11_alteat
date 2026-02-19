import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Recipe {
  id: number;
  title: string;
  image: string;
  tags: string[];
  rating?: number;
}

interface UserPreferences {
  cuisine_preferences: string[];
  skill_level: string;
  avoid_ingredients: string[];
}

export function usePersonalizedRecommendations(limit: number = 6) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalizedRecipes();
  }, []);

  const fetchPersonalizedRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get current user and their preferences
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let userPreferences: UserPreferences | null = null;

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("cuisine_preferences, skill_level, avoid_ingredients")
          .eq("id", user.id)
          .single();

        if (profileData) {
          userPreferences = {
            cuisine_preferences: profileData.cuisine_preferences || [],
            skill_level: profileData.skill_level || "beginner",
            avoid_ingredients: profileData.avoid_ingredients || [],
          };
        }
      }

      // 2. Fetch recipes
      let allRecipes: any[] = [];

      // If user has cuisine preferences, try to fetch matching recipes first
      if (userPreferences?.cuisine_preferences?.length) {
        const cuisineFilters = userPreferences.cuisine_preferences
          .map((pref) => `cuisine_path.ilike.%${pref}%`)
          .join(",");

        const { data: preferredRecipes } = await supabase
          .from("recipes")
          .select("*")
          .or(cuisineFilters)
          .limit(50);

        if (preferredRecipes) {
          allRecipes = [...allRecipes, ...preferredRecipes];
        }
      }

      // Always fetch some general recipes to ensure variety or fallback
      const { data: generalRecipe, error: fetchError } = await supabase.rpc(
        "get_random_recipes",
        {
          n: 50,
        },
      );

      if (generalRecipe) {
        allRecipes = [...allRecipes, ...generalRecipe];
      }

      // Deduplicate recipes by ID
      allRecipes = Array.from(
        new Map(allRecipes.map((item) => [item.id, item])).values(),
      );

      if (allRecipes.length === 0) {
        throw new Error(fetchError?.message || "Failed to fetch recipes");
      }

      // 3. Filter and score recipes
      let scoredRecipes = allRecipes.map((recipe) => ({
        recipe,
        score:
          calculateRecipeScore(recipe, userPreferences) + Math.random() * 50,
      }));

      // 4. Filter out recipes with avoided ingredients
      if (userPreferences && userPreferences.avoid_ingredients.length > 0) {
        scoredRecipes = scoredRecipes.filter(({ recipe }) => {
          const ingredientsLower = (recipe.ingredients || "").toLowerCase();
          return !userPreferences.avoid_ingredients.some((avoid) =>
            ingredientsLower.includes(avoid.toLowerCase()),
          );
        });
      }

      // 5. Sort by score (highest first)
      scoredRecipes.sort((a, b) => b.score - a.score);

      // 6. Take top N recipes
      const topRecipes = scoredRecipes.slice(0, limit);

      // 7. Normalize to frontend format
      const normalized = topRecipes.map(({ recipe }) => ({
        id: recipe.id,
        title: recipe.recipe_name,
        image: recipe.img_src || "/placeholder.svg",
        tags: recipe.cuisine_path
          ? recipe.cuisine_path.split("/").filter(Boolean).slice(0, 3)
          : [],
        rating: recipe.rating,
      }));

      setRecipes(normalized);
    } catch (err) {
      console.error("Error fetching personalized recipes:", err);
      setError(err instanceof Error ? err.message : "Unknown error");

      // Fallback to random recipes
      await fetchRandomRecipes(limit);
    } finally {
      setLoading(false);
    }
  };

  const fetchRandomRecipes = async (limit: number) => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .limit(30);

      if (error || !data) {
        console.error("Failed to fetch random recipes:", error);
        return;
      }

      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, limit);

      const normalized = selected.map((r) => ({
        id: r.id,
        title: r.recipe_name,
        image: r.img_src || "/placeholder.svg",
        tags: r.cuisine_path
          ? r.cuisine_path.split("/").filter(Boolean).slice(0, 3)
          : [],
      }));

      setRecipes(normalized);
    } catch (err) {
      console.error("Error fetching random recipes:", err);
    }
  };

  return { recipes, loading, error, refresh: fetchPersonalizedRecipes };
}

// Helper function to calculate recipe score
function calculateRecipeScore(
  recipe: any,
  preferences: UserPreferences | null,
): number {
  let score = 0;

  // If no preferences, return random score
  if (!preferences) {
    return Math.random() * 100;
  }

  // 1. Cuisine matching (0-50 points)
  if (preferences.cuisine_preferences.length > 0 && recipe.cuisine_path) {
    const cuisinePathLower = recipe.cuisine_path.toLowerCase();
    for (const pref of preferences.cuisine_preferences) {
      if (cuisinePathLower.includes(pref.toLowerCase())) {
        score += 1000; // Significantly boost score to ensure cuisine priority
        break;
      }
    }
  }

  // 2. Skill level matching (0-30 points)
  const skillDifficultyMap: { [key: string]: string[] } = {
    beginner: ["easy", "simple", "quick", "basic"],
    intermediate: ["medium", "moderate"],
    advanced: ["hard", "complex", "challenging"],
    expert: ["gourmet", "professional", "advanced"],
  };

  const recipeNameLower = (recipe.recipe_name || "").toLowerCase();
  const directionsLower = (recipe.directions || "").toLowerCase();

  const skillKeywords = skillDifficultyMap[preferences.skill_level] || [];

  for (const keyword of skillKeywords) {
    if (
      recipeNameLower.includes(keyword) ||
      directionsLower.includes(keyword)
    ) {
      score += 30;
      break;
    }
  }

  // 3. Rating boost (0-20 points)
  if (recipe.rating) {
    try {
      const rating = parseFloat(recipe.rating);
      score += (rating / 5.0) * 20;
    } catch (e) {
      // Invalid rating, skip
    }
  }

  return score;
}

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Recipe {
  id: number;
  title: string;
  image: string;
  tags: string[];
  rating?: number;
}

interface RecipeRecord {
  id: number;
  recipe_name?: string;
  img_src?: string;
  cuisine_path?: string;
  ingredients?: string;
  directions?: string;
  rating?: number | string;
}

interface UserPreferences {
  cuisine_preferences: string[];
  skill_level: string;
  avoid_ingredients: string[];
}

const SCORE_WEIGHTS = {
  cuisine: 300,
  skill: 100,
  rating: 100,
  jitter: 20,
};

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
          .eq("user_id", user.id)
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
      let allRecipes: RecipeRecord[] = [];

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

      let candidateRecipes = allRecipes;

      // 3. Filter out recipes with avoided ingredients before scoring
      if (userPreferences && userPreferences.avoid_ingredients.length > 0) {
        candidateRecipes = candidateRecipes.filter((recipe) => {
          const ingredientsLower = (recipe.ingredients || "").toLowerCase();
          return !userPreferences.avoid_ingredients.some((avoid) =>
            ingredientsLower.includes(avoid.toLowerCase()),
          );
        });
      }

      // 4. Score with deterministic daily jitter for continuity
      const seedBase = `${user?.id ?? "anonymous"}:${getDailyBucket()}`;
      let scoredRecipes = candidateRecipes.map((recipe) => ({
        recipe,
        score:
          calculateRecipeScore(recipe, userPreferences) +
          deterministicJitter(seedBase, recipe.id, SCORE_WEIGHTS.jitter),
      }));

      // 5. Sort by score (highest first)
      scoredRecipes.sort((a, b) => b.score - a.score);

      // 6. Take top N recipes
      const topRecipes = scoredRecipes.slice(0, limit);

      // 7. Normalize to frontend format
      const normalized = topRecipes.map(({ recipe }) => ({
        id: recipe.id,
        title: recipe.recipe_name || "Untitled recipe",
        image: recipe.img_src || "/placeholder.svg",
        tags: recipe.cuisine_path
          ? recipe.cuisine_path.split("/").filter(Boolean).slice(0, 3)
          : [],
        rating: normalizeDisplayRating(recipe.rating),
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
  recipe: RecipeRecord,
  preferences: UserPreferences | null,
): number {
  let score = 0;

  // If no preferences, rank primarily by rating.
  if (!preferences) {
    const rating = normalizeRating(recipe.rating);
    return rating * SCORE_WEIGHTS.rating;
  }

  // 1. Cuisine matching
  if (preferences.cuisine_preferences.length > 0 && recipe.cuisine_path) {
    const cuisinePathLower = recipe.cuisine_path.toLowerCase();
    for (const pref of preferences.cuisine_preferences) {
      if (cuisinePathLower.includes(pref.toLowerCase())) {
        score += SCORE_WEIGHTS.cuisine;
        break;
      }
    }
  }

  // 2. Skill level matching (keyword-based)
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
      score += SCORE_WEIGHTS.skill;
      break;
    }
  }

  // 3. Rating boost
  const rating = normalizeRating(recipe.rating);
  score += rating * SCORE_WEIGHTS.rating;

  return score;
}

function normalizeRating(value: number | string | undefined): number {
  if (value === undefined || value === null) {
    return 0;
  }

  const rating = Number.parseFloat(String(value));
  if (Number.isNaN(rating)) {
    return 0;
  }

  return Math.max(0, Math.min(1, rating / 5.0));
}

function normalizeDisplayRating(
  value: number | string | undefined,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const rating = Number.parseFloat(String(value));
  return Number.isNaN(rating) ? undefined : rating;
}

function getDailyBucket(): number {
  return Math.floor(Date.now() / 86_400_000);
}

function deterministicJitter(
  seedBase: string,
  recipeId: number,
  maxJitter: number,
): number {
  const hash = fnv1aHash(`${seedBase}:${recipeId}`);
  return (hash / 0xffffffff) * maxJitter;
}

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

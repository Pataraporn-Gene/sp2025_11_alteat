import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Recipe {
  id: number;
  recipe_name: string;
  cuisine_path: string;
  img_src: string;
  rating: number;
}

export function useRecommendedRecipes(currentRecipeId: number, cuisinePath: string) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecommendedRecipes() {
      try {
        setLoading(true);
        setError(null);

        // Extract cuisine categories from current recipe
        const categories = cuisinePath
          .split('/')
          .filter(cat => cat.trim())
          .slice(0, 2); // Take first 2 categories for matching

        // Fetch recipes with similar cuisine_path
        const { data, error } = await supabase
          .from('recipes')
          .select('id, recipe_name, cuisine_path, img_src, rating')
          .neq('id', currentRecipeId) // Exclude current recipe
          .order('rating', { ascending: false }) // Prioritize higher rated recipes
          .limit(20); // Get more to filter from

        if (error) throw error;

        // Filter and rank by similarity
        const scoredRecipes = (data || []).map(recipe => {
          let score = 0;
          
          // Check how many categories match
          categories.forEach(category => {
            if (recipe.cuisine_path.includes(category)) {
              score += 1;
            }
          });

          // Boost score with rating
          score += (recipe.rating || 0) / 10;

          return { ...recipe, score };
        });

        // Sort by score and take top 5
        const recommended = scoredRecipes
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setRecipes(recommended);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    }

    if (currentRecipeId && cuisinePath) {
      fetchRecommendedRecipes();
    }
  }, [currentRecipeId, cuisinePath]);

  return { recipes, loading, error };
}
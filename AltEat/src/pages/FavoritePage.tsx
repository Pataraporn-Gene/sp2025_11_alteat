import Navbar from "../component/Navbar";
import RecipeCard from "../component/RecipeCard";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useTranslation } from 'react-i18next';

function FavoritePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation('favorite');
  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch favorite recipes
  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Get favorite recipe IDs
      const { data: favoriteRecipes, error: favError } = await supabase
        .from("favorite")
        .select("recipe_id")
        .eq("user_id", user.id);

      if (favError || !favoriteRecipes || favoriteRecipes.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const recipeIds = favoriteRecipes.map((row) => row.recipe_id);

      // Fetch recipes
      const { data: recipes, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .in("id", recipeIds);

      if (recipeError || !recipes) {
        console.error(recipeError);
        setFavorites([]);
        setLoading(false);
        return;
      }

      const normalizedRecipes = recipes.map((r) => ({
        id: r.id,
        title: r.recipe_name,
        image: r.img_src, 
        tags: r.cuisine_path ? r.cuisine_path.split("/").filter(Boolean) : [],
      }));

      setFavorites(normalizedRecipes);
      console.log("Favorite Reecipe: ", normalizedRecipes)
      setLoading(false);
    };

    if (isLoggedIn) {
      fetchFavorites();
    }
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-[#FFEDDD]">
      <Navbar />

      <div className="mt-2 flex flex-col max-w-7xl m-auto w-[60%]">
        {isLoggedIn && <h1 className="p-8 text-5xl">{t('title')}</h1>}

        <div className="mt-3 mb-20">
          {!isLoggedIn ? (
            <div className="mt-10 flex flex-col items-center justify-center text-center bg-white/50 p-12 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm">
              <Heart className="w-16 h-16 text-red-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('saveFavoritesTitle', 'Save Your Favorite Recipes!')}</h2>
              <p className="text-gray-600 mb-8 max-w-md">
                {t('saveFavoritesMessage', 'Log in or create an account to keep track of all the recipes you love, and access them anytime, anywhere.')}
              </p>
              <div className="flex gap-4">
                <Link to="/login" className="px-8 py-3 bg-[#e48f75] text-white font-semibold rounded-lg hover:bg-[#E6896D] transition-colors shadow-md">
                  {t('login')}
                </Link>
                <Link to="/signup" className="px-8 py-3 bg-white text-[#e48f75] border border-[#e48f75] font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-md">
                  {t('signup')}
                </Link>
              </div>
            </div>
          ) : loading ? (
            <p className="mt-5 text-center text-2xl">{t('loadingFavorites')}</p>
          ) : favorites.length > 0 ? (
            <RecipeCard recipes={favorites} />
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center text-center bg-white/50 p-10 rounded-2xl shadow-lg border border-gray-200 backdrop-blur-sm">
              <Heart className="w-12 h-12 text-red-300 mb-3" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t('noFavorites')}</h2>
              <p className="text-gray-600 max-w-md">
                {t('noFavoritesMessage', 'Start exploring recipes and click the heart icon to save your favorites here.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FavoritePage;

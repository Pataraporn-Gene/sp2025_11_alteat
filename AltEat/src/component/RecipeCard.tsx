import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { addFavorite, removeFavorite, getFavoriteIds } from "../lib/favorite";
import FavoriteButton from "./FavoriteButton";
import { useTranslation } from 'react-i18next';


export interface Recipe {
  id: number;
  title: string;
  image: string;
  tags: string[];
}

interface RecipeCardProps {
  recipes: Recipe[];
}

function RecipeCard({ recipes }: RecipeCardProps) {
  const navigate = useNavigate();
  const [favoriteRecipe, setFavoriteRecipe] = useState<number[]>([]);
  const {t} = useTranslation('common');

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const ids = await getFavoriteIds(); // from favorite table
        setFavoriteRecipe(ids);
      } catch (err) {
        console.error(err);
      }
    };

    loadFavorites();
  }, []);

  const toggleFavorite = async (recipe: { id: number; title: string }) => {
    const isFav = favoriteRecipe.includes(recipe.id);

    try {
      if (isFav) {
        await removeFavorite(recipe.id);
        setFavoriteRecipe((prev) => prev.filter((id) => id !== recipe.id));
        console.log(`Remove ${recipe.title} from Favorite`);
      } else {
        await addFavorite(recipe.id);
        setFavoriteRecipe((prev) => [...prev, recipe.id]);
        console.log(`Add ${recipe.title} to Favorite`);
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const isFavorite = (id: number) => favoriteRecipe.includes(id);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 w-full items-start">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="bg-white rounded-2xl shadow-[0_3px_2px_rgba(0,0,0,0.25)]"
          >
            {/* Recipe Image */}
            <div className="relative">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-48 sm:h-56 object-cover rounded-tl-2xl rounded-tr-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
              {/* Favorite Button */}
              <div className="absolute top-2 right-2">
                <FavoriteButton
                  recipeId={recipe.id}
                  isFavorite={isFavorite(recipe.id)}
                  onToggle={() => toggleFavorite(recipe)}
                />
              </div>
            </div>

            <div className="flex flex-col items-center mt-4">
              {/* Recipe Name */}
              <h3 className="text-[#562C0C] text-center font-medium text-xl sm:text-2xl">
                {recipe.title}
              </h3>
              {/* Tags */}
              <div className="flex flex-wrap mt-3 gap-2 justify-center">
                {recipe.tags.map((tag) => (
                  <p
                    key={tag}
                    className="px-5 py-2 bg-[#FFCB69] rounded-[20px] text-[#694900] text-[14px]"
                  >
                    {tag}
                  </p>
                ))}
              </div>
              {/* More Button */}
              <button
                onClick={() => navigate(`/recipe/${recipe.id}`)}
                className="my-4 px-6 py-2 bg-[#562C0C] text-white rounded-full text-sm hover:bg-[#3d1f08] transition-colors cursor-pointer"
              >
                {t('more')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default RecipeCard;

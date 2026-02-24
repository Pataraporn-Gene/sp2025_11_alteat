import { useState } from "react";
import IngredientDetailPopup, {
  type IngredientDetail,
} from "./IngredientDetailPopup";
import { useTranslation } from "react-i18next";

interface IngredientCardProps {
  ingredients: IngredientDetail[]
}

function IngredientCard({ ingredients }: IngredientCardProps) {
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientDetail | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { t } = useTranslation("ingredient");

  const handleMoreDetail = (ingredient: IngredientDetail) => {
    setSelectedIngredient(ingredient)
    setSelectedTags(getTags(ingredient))
    setIsPopupOpen(true)
  }

  const handleClosePopup = () => {
    setIsPopupOpen(false)
    setSelectedTags([])
    setSelectedIngredient(null)
  }

  // Helper to get display tags from ingredient
  const getTags = (ingredient: IngredientDetail): string[] => {
    const tags: string[] = [];
    if (ingredient.has_flavor) tags.push(...ingredient.has_flavor.slice(0, 2));
    if (ingredient.has_texture)
      tags.push(...ingredient.has_texture.slice(0, 1));
    if (ingredient.has_color) tags.push(...ingredient.has_color.slice(0, 1));
    return tags.slice(0, 4);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-12 w-full items-start">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.ingredient_id}
            className="bg-white rounded-2xl overflow-hidden shadow-[0_3px_2px_rgba(0,0,0,0.25)]"
          >
            {/* Ingredient Image  */}
            <div className="relative">
              {!imageErrors[ingredient.ingredient_id] ? (
                <img
                  src={`https://yrpoikxovgaplilgwfys.supabase.co/storage/v1/object/public/ingredients_img/${ingredient.ingredient_id}.jpg` || "invalid-image"}
                  alt={ingredient.ingredient_name}
                  className="w-full h-full rounded-tl-2xl rounded-tr-2xl object-cover"
                  onError={() =>
                    setImageErrors((prev) => ({
                      ...prev,
                      [ingredient.ingredient_id]: true,
                    }))
                  }
                />
              ) : (
                <div className="w-full h-[180px] bg-gradient-to-br from-[#FFEDDD] to-[#FFCB69] flex items-center justify-center rounded-tl-2xl rounded-tr-2xl">
                  <span className="text-6xl font-semibold">
                    {ingredient.ingredient_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center mt-4 px-4">
              {/* Ingredient Name */}
              <h3 className="text-[#562C0C] font-medium text-2xl text-center">
                {ingredient.ingredient_name}
              </h3>
              {/* Type */}
              <span className="text-gray-500 text-sm mt-1">{ingredient.type}</span>
              {/* Tags */}
              <div className="flex flex-wrap mt-3 gap-2 justify-center">
                {getTags(ingredient).map((tag, index) => (
                  <p
                    key={`${tag}-${index}`}
                    className="px-5 py-2 bg-[#FFCB69] rounded-[20px] text-[#694900] text-[14px]"
                  >
                    {tag}
                  </p>
                ))}
              </div>
              {/* More Detail Button */}
              <button
                onClick={() => handleMoreDetail(ingredient)}
                className="my-4 px-6 py-2 bg-[#562C0C] text-white rounded-full text-sm hover:bg-[#3d1f08] transition-colors cursor-pointer"
              >
                {t('detail.moreDetail')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Popup */}
      <IngredientDetailPopup
        ingredient={selectedIngredient}
        tags={selectedTags}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />
    </>



  )
}

export default IngredientCard;

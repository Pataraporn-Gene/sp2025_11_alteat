import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import IngredientDetailPopup, { type IngredientDetail } from "./IngredientDetailPopup";
import { useTranslation } from "react-i18next";

interface IngredientCarouselProps {
  ingredients: IngredientDetail[];
}

// 👇 Add this hook
function useCardsPerView() {
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return cardsPerView;
}

function IngredientCarousel({ ingredients }: IngredientCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientDetail | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { t } = useTranslation('ingredient');

  const cardsPerView = useCardsPerView(); // 👈 replaces the hardcoded 3
  const maxIndex = Math.max(0, ingredients.length - cardsPerView);

  // 👇 Reset index when cardsPerView changes to avoid getting stuck
  useEffect(() => {
    setCurrentIndex(0);
  }, [cardsPerView]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleViewDetail = (ingredient: IngredientDetail) => {
    setSelectedIngredient(ingredient);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedIngredient(null);
  };

  const getTags = (ingredient: IngredientDetail): string[] => {
    const tags: string[] = []
    if (ingredient.has_flavor) tags.push(...ingredient.has_flavor.slice(0, 2))
    if (ingredient.has_texture) tags.push(...ingredient.has_texture.slice(0, 1))
    if (ingredient.has_color) tags.push(...ingredient.has_color.slice(0, 1))
    return tags.slice(0, 4)
  }

  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl px-4 sm:px-0"> {/* 👈 added px-4 on mobile */}
      <div className="relative">
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 sm:-translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors" // 👈 smaller offset on mobile
            aria-label="Previous ingredients"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        <div className="overflow-hidden p-1">
          <div
            className="flex gap-3 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
            }}
          >
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.ingredient_id}
                className="flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                style={{ width: `calc(${100 / cardsPerView}% - ${(cardsPerView - 1) * 12 / cardsPerView}px)` }}
              >
                <div className="relative h-30 bg-gradient-to-br from-[#FFEDDD] to-[#FFCB69] flex items-center justify-center">
                  <span className="text-4xl text-[#562C0C]">{ingredient.ingredient_name.charAt(0).toUpperCase()}</span>
                </div>

                <div className="p-2 flex flex-col items-center">
                  <h3 className="text-sm font-semibold mb-3 line-clamp-2 min-h-[2.5rem] text-center">
                    {ingredient.ingredient_name}
                  </h3>
                  <button
                    onClick={() => handleViewDetail(ingredient)}
                    className="w-full py-1.5 px-2 bg-[#562C0C] text-white text-sm rounded-full hover:bg-[#3d1f08] transition-colors"
                  >
                    {t('detail.moreDetail')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {currentIndex < maxIndex && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 sm:translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors" // 👈 smaller offset on mobile
            aria-label="Next ingredients"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {ingredients.length > cardsPerView && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentIndex === index ? "bg-[#FFCB69]" : "bg-gray-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <IngredientDetailPopup
        ingredient={selectedIngredient}
        tags={selectedIngredient ? getTags(selectedIngredient) : []}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
      />
    </div>
  );
}

export default IngredientCarousel;
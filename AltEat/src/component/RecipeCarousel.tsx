import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Recipe {
  name: string;
  id: number;
  image: string;
  ingredients?: string;
}

interface RecipeCarouselProps {
  recipes: Recipe[];
}

function RecipeCarousel({ recipes }: RecipeCarouselProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Calculate how many cards to show based on screen size
  const cardsPerView = 3;
  const maxIndex = Math.max(0, recipes.length - cardsPerView);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleViewDetail = (recipeId: number) => {
    navigate(`/recipe/${recipeId}`);
  };

  if (!recipes || recipes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Previous recipes"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Carousel Container */}
        <div className="overflow-hidden p-1">
          <div
            className="flex gap-3 transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
            }}
          >
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                style={{ width: `calc(${100 / cardsPerView}% - ${(cardsPerView - 1) * 12 / cardsPerView}px)` }}
              >
                {/* Recipe Image */}
                <div className="relative h-40 bg-gray-200">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>

                {/* Recipe Info */}
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {recipe.name}
                  </h3>
                  
                  <button
                    onClick={() => handleViewDetail(recipe.id)}
                    className="w-full py-2 px-3 bg-[#562C0C] text-white text-sm rounded-full hover:bg-[#3d1f08] transition-colors"
                  >
                    View Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Button */}
        {currentIndex < maxIndex && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="Next recipes"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Indicator Dots */}
      {recipes.length > cardsPerView && (
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
    </div>
  );
}

export default RecipeCarousel;
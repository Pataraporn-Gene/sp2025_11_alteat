import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  recipeId: number;
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
}

export default function FavoriteButton({
  isFavorite,
  onToggle,
  size = 8,
}: FavoriteButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-label="Toggle favorite"
      className="z-10"
    >
      <Heart
        className={`w-${size} h-${size} transition-colors cursor-pointer hover:scale-110 ${
          isFavorite
            ? "fill-red-500 text-red-500"
            : "text-gray-400 fill-white"
        }`}
      />
    </button>
  );
}

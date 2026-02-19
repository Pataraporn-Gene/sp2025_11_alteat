import Popup from "reactjs-popup"
import { useTranslation } from "react-i18next"

export interface IngredientDetail {
  ingredient_id: number
  ingredient_name: string
  type: string
  has_benefit: string[] | null
  has_texture: string[] | null
  has_color: string[] | null
  has_shape: string[] | null
  has_other_names: string[] | null
  can_cook: string[] | null
  has_mineral: string[] | null
  has_flavor: string[] | null
  has_vitamin: string[] | null
  has_nutrient: string[] | null
}

interface IngredientDetailPopupProps {
  ingredient: IngredientDetail | null
  tags: string[] | null
  isOpen: boolean
  onClose: () => void
}

function IngredientDetailPopup({ ingredient, tags, isOpen, onClose }: IngredientDetailPopupProps) {
  const { t } = useTranslation('ingredient')

  if (!ingredient) return null

  const renderArrayField = (label: String, values:string[] | null) => {
    if (!values || values.length === 0) return null;
    if (label === "Other Names") {
      label = t('detail.otherNames')
    } else if (label === "Cooking Methods") {
      label = t('detail.cookingMethods')
    } else {
      label = t(`detail.${label.replace(/ /g, "_").toLowerCase()}`);
    }
    return (
      <div className="text-gray-700">
        <span className="font-semibold text-[#562C0C]">{label}:</span>{" "}
        <span>{values.join(", ")}</span>
      </div>
    );
  };


  return (
    <Popup
      open={isOpen}
      onClose={onClose}
      modal
      overlayStyle={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}
      contentStyle={{
        background: "transparent",
        border: "none",
        width: "auto",
        padding: 0,
      }}
    >
      <div className="bg-white border-5 border-[#EDAE9B] rounded-2xl p-13  overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-10 text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            &times;
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-black">
              {ingredient.ingredient_name}
            </h2>
            
            {/* Tags */}
            <div className="mt-5 flex justify-center flex-wrap gap-2">
              {tags?.map((tag) => (
                <span className="px-4 py-1 bg-[#FFCB69] rounded-full text-[#694900] text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

        {/* Content */}
        <div className="space-y-2">
          {renderArrayField("Other Names", ingredient.has_other_names)}
          {renderArrayField("Flavors", ingredient.has_flavor)}
          {renderArrayField("Textures", ingredient.has_texture)}
          {renderArrayField("Colors", ingredient.has_color)}
          {renderArrayField("Shapes", ingredient.has_shape)}
          {renderArrayField("Cooking Methods", ingredient.can_cook)}
          {renderArrayField("Benefits", ingredient.has_benefit)}
          {renderArrayField("Vitamins", ingredient.has_vitamin)}
          {renderArrayField("Minerals", ingredient.has_mineral)}
          {renderArrayField("Nutrients", ingredient.has_nutrient)}
        </div>

      </div>
    </Popup>
  )
}

export default IngredientDetailPopup

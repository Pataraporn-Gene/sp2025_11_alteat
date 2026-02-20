import { useState } from "react";
import { useTranslation } from "react-i18next";

interface FilterProps {
  title: string;
  category: string;
  items: string[];
  onFilterChange: (filterType: string, selectedItems: string[]) => void;
}

function Filter({ title, category, items, onFilterChange }: FilterProps) {
  const { t } = useTranslation(["common", "filter"]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const firstItems = items.slice(0, 6);
  const remainingItems = items.slice(6);

  const toggleItem = (item: string) => {
    const newSelected = selectedItems.includes(item)
      ? selectedItems.filter((i) => i !== item)
      : [...selectedItems, item];

    setSelectedItems(newSelected);
    onFilterChange(title, newSelected);
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <div className="w-[85%] mb-8 flex flex-col">
          {/* Title */}
          <h3 className="mt-5 text-xl sm:text-2xl">{title}</h3>
          <hr className="mt-2 border-t-2 border-[#CDCDCD] " />
          {/* Filter Item */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-3.5 gap-y-5 items-center">
            {firstItems.map((item) => (
              <p
                key={item}
                onClick={() => toggleItem(item)}
                className={`p-2 rounded-3xl text-center text-[14px] shadow-[0_2px_2px_rgba(0,0,0,0.25)] cursor-pointer transition-colors ${
                  selectedItems.includes(item)
                    ? "bg-[#FFCB69] text-[#694900]"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {t(`filter:${category}.${item}`)}
              </p>
            ))}
          </div>

          {remainingItems.length > 0 && (
            <div
              aria-hidden={!expanded}
              className={`
              grid transition-[grid-template-rows] duration-300 ease-in-out
              ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
            `}
            >
              <div className="overflow-hidden">
                <div className="mt-5 mb-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3.5 gap-y-5 items-center">
                  {remainingItems.map((item) => (
                    <p
                      key={item}
                      onClick={() => toggleItem(item)}
                      className={`p-2 rounded-3xl text-center text-[14px]
                      shadow-[0_2px_2px_rgba(0,0,0,0.25)]
                      cursor-pointer transition-colors
                      ${
                        selectedItems.includes(item)
                          ? "bg-[#FFCB69] text-[#694900]"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {t(`filter:${category}.${item}`)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expand / Collapse Button */}
          {items.length > 6 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-5 m-auto px-4 py-2 bg-[#562C0C] rounded-3xl text-white cursor-pointer"
            >
              {expanded ? t("showLess") : t("showMore")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default Filter;

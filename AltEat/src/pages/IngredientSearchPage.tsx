import type React from "react";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../component/Navbar";
import SearchSideBar from "../component/SearchSideBar";
import { ingredientFilter } from "../data/ingredientFilter";
import IngredientCard from "../component/IngredientCard";
import { supabase } from "../lib/supabase";
import type { IngredientDetail } from "../component/IngredientDetailPopup";
import search from "../assets/search.png";
import context from "../assets/context.png";
import { useTranslation } from "react-i18next";
import { translateToEnglish } from "../lib/translateQuery";

interface Filters {
  taste: string[];
  texture: string[];
  color: string[];
  shape: string[];
}

function IngredientSearchpage() {
  const { t } = useTranslation(["ingredient", "common"]);
  const [ingredients, setIngredients] = useState<IngredientDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    taste: [],
    texture: [],
    color: [],
    shape: [],
  });
  const [hasSearched, setHasSearched] = useState(false);

  const filterSection = [
    {
      title: t("ingredient:filters.taste"),
      category: "taste",
      items: ingredientFilter[0].taste,
    },
    {
      title: t("ingredient:filters.texture"),
      category: "texture",
      items: ingredientFilter[0].texture,
    },
    {
      title: t("ingredient:filters.color"),
      category: "color",
      items: ingredientFilter[0].color,
    },
    {
      title: t("ingredient:filters.shape"),
      category: "shape",
      items: ingredientFilter[0].shape,
    },
  ];

  // Check if any filters are selected
  const hasActiveFilters =
    filters.taste.length > 0 ||
    filters.texture.length > 0 ||
    filters.color.length > 0 ||
    filters.shape.length > 0;

  // Fetch ingredients from Supabase
  const fetchIngredients = useCallback(async () => {
    if (!hasActiveFilters && !searchQuery.trim()) {
      setIngredients([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase.from("ingredients").select("*");

      // Apply filter conditions
      if (filters.taste.length > 0) {
        query = query.contains("has_flavor", filters.taste);
      }
      if (filters.texture.length > 0) {
        query = query.contains("has_texture", filters.texture);
      }
      if (filters.color.length > 0) {
        query = query.contains("has_color", filters.color);
      }
      if (filters.shape.length > 0) {
        query = query.contains("has_shape", filters.shape);
      }

      const { data, error } = await query;
      console.log(query);
      if (error) {
        console.error("Error fetching ingredients:", error);
        setIngredients([]);
        return;
      }

      setIngredients(data || []);
    } catch (err) {
      console.error("Error:", err);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  }, [filters, hasActiveFilters, searchQuery]);

  // Fetch when filters change
  useEffect(() => {
    if (hasActiveFilters) {
      fetchIngredients();
    } else if (!searchQuery.trim()) {
      setIngredients([]);
      setHasSearched(false);
    }
  }, [filters, hasActiveFilters]);

  // Handle filter changes from sidebar
  const handleFilterChange = (filterType: string, selectedItems: string[]) => {
    console.log("Filter changed:", filterType, selectedItems); // Debug log

    let key = filterType.toLowerCase();

    if (key === t("ingredient:filters.taste").toLowerCase()) {
      key = "taste";
    } else if (key === t("ingredient:filters.texture").toLowerCase()) {
      key = "texture";
    } else if (key === t("ingredient:filters.color").toLowerCase()) {
      key = "color";
    } else if (key === t("ingredient:filters.shape").toLowerCase()) {
      key = "shape";
    }

    setFilters((prev) => ({
      ...prev,
      [key]: selectedItems,
    }));
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim() && !hasActiveFilters) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const translatedQuery = await translateToEnglish(searchQuery);
      const terms = translatedQuery.split(" ").filter(Boolean);

      let data: any[] | null = null;
      let error: any = null;

      // If searching text/traits — use RPC
      if (terms.length > 0) {
        console.log("Searching with terms:", terms);
        const res = await supabase.rpc("search_context_ingredients", { terms });
        data = res.data;
        error = res.error;
      }

      if (error) {
        console.error(error);
        setIngredients([]);
        return;
      }

      let filtered = data || [];

      // Apply filter checkboxes AFTER RPC
      if (filters.taste.length)
        filtered = filtered.filter((i) =>
          filters.taste.every((f) => i.has_flavor?.includes(f)),
        );

      if (filters.texture.length)
        filtered = filtered.filter((i) =>
          filters.texture.every((t) => i.has_texture?.includes(t)),
        );

      if (filters.color.length)
        filtered = filtered.filter((i) =>
          filters.color.every((c) => i.has_color?.includes(c)),
        );

      if (filters.shape.length)
        filtered = filtered.filter((i) =>
          filters.shape.every((s) => i.has_shape?.includes(s)),
        );

      setIngredients(filtered);
    } catch (err) {
      console.error(err);
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#FFEDDD]">
        <div>
          <Navbar />
        </div>

        <div className="flex">
          <SearchSideBar
            filter={filterSection}
            onFilterChange={handleFilterChange}
          />
          <div className="flex-1 flex justify-center">
            {/* Main Content */}
            <div className="flex flex-col items-center mb-20 max-w-7xl w-full px-4 sm:px-8">
              <div className="flex items-center mb-5 w-full">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-5xl mb-3 sm:mb-4">{t("ingredient:search.title")}</h1>
                  <p className="text-[15px] sm:text-[16px]">{t("ingredient:search.subtitle")}</p>
                </div>
                <img src={context || "/placeholder.svg"} className="hidden sm:block w-32 shrink-0" />
              </div>

              {/* Text Input */}
              <div className="w-full relative">
                <img
                  src={search || "/placeholder.svg"}
                  className="absolute right-4 top-3 cursor-pointer"
                  onClick={handleSearch}
                />
                <input
                  type="text"
                  placeholder={t("ingredient:search.searchPlaceholder")}
                  className="px-6 py-3 bg-white w-full rounded-[20px] outline-[1.5px] shadow-[0_8px_4px_rgba(0,0,0,0.25)]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyPress}
                />
              </div>

              {/* Card Item */}
              <div className="w-full">
                <div className="flex flex-col items-start mt-8 sm:mt-14">
                  {loading ? (
                    <div className="w-full flex justify-center py-12">
                      <div className="text-xl text-[#562C0C]">
                        {t("ingredient:search.loadingIngredients")}
                      </div>
                    </div>
                  ) : !hasSearched ? (
                    <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-xl sm:text-2xl text-[#562C0C] mb-2">
                        {t("ingredient:search.selectFilters")}
                      </div>
                      <p className="text-gray-500">
                        {t("ingredient:search.useFilters")}
                      </p>
                    </div>
                  ) : ingredients.length === 0 ? (
                    <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="text-xl sm:text-2xl text-[#562C0C] mb-2">
                        {t("ingredient:search.noIngredientsFound")}
                      </div>
                      <p className="text-gray-500">
                        {t("ingredient:search.adjustingFilters")}
                      </p>
                    </div>
                  ) : (
                    <IngredientCard ingredients={ingredients} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default IngredientSearchpage;

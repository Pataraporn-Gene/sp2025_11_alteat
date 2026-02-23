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

  const activeFilterCount =
    filters.taste.length +
    filters.texture.length +
    filters.color.length +
    filters.shape.length;

  const openMobileFilters = () => {
    const btn = document.querySelector<HTMLButtonElement>('[aria-label="Open filters"]');
    btn?.click();
  };

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

  const hasActiveFilters =
    filters.taste.length > 0 ||
    filters.texture.length > 0 ||
    filters.color.length > 0 ||
    filters.shape.length > 0;

  const fetchIngredients = useCallback(async () => {
    if (!hasActiveFilters && !searchQuery.trim()) {
      setIngredients([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase.from("ingredients").select("*");

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

  useEffect(() => {
    if (hasActiveFilters) {
      fetchIngredients();
    } else if (!searchQuery.trim()) {
      setIngredients([]);
      setHasSearched(false);
    }
  }, [filters, hasActiveFilters]);

  const handleFilterChange = (filterType: string, selectedItems: string[]) => {
    console.log("Filter changed:", filterType, selectedItems);

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

  const handleSearch = async () => {
    if (!searchQuery.trim() && !hasActiveFilters) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const translatedQuery = await translateToEnglish(searchQuery);
      const terms = translatedQuery.split(" ").filter(Boolean);

      let data: any[] | null = null;
      let error: any = null;

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFEDDD]">
      <Navbar />
      <div className="flex">
        {/* Hide SearchSideBar's own floating button — we use our custom one instead */}
        <div className="[&>button]:hidden sticky top-0 h-screen overflow-y-auto">
          <SearchSideBar
            filter={filterSection}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Main content — takes full width on mobile, remaining width on desktop */}
        <div className="flex-1 flex justify-center">
          <div className="flex flex-col items-center mb-20 max-w-7xl w-full px-5 md:w-[85%] md:px-0">

            {/* Header */}
            <div className="flex items-center mb-5 w-full mt-4 md:mt-0">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl mb-2 md:mb-4 leading-tight">
                  {t("ingredient:search.title")}
                </h1>
                <p className="text-[14px] md:text-[16px]">
                  {t("ingredient:search.subtitle")}
                </p>
              </div>
              <img
                src={context || "/placeholder.svg"}
                className="w-24 h-24 object-contain md:w-auto md:h-auto"
              />
            </div>

            {/* Search bar */}
            <div className="w-full relative">
              <img
                src={search || "/placeholder.svg"}
                className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer w-5 h-5 md:w-auto md:h-auto object-contain"
                onClick={handleSearch}
              />
              <input
                type="text"
                placeholder={t("ingredient:search.searchPlaceholder")}
                className="px-6 py-3 bg-white w-full rounded-[20px] outline-[1.5px] shadow-[0_8px_4px_rgba(0,0,0,0.25)] text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>

            {/* Mobile: Filter button + active pills — hidden on desktop */}
            <div className="md:hidden w-full mt-4">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={openMobileFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-[#562C0C] text-white rounded-full text-sm font-medium shadow-md active:scale-95 transition-transform"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                    />
                  </svg>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-white text-[#562C0C] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => setFilters({ taste: [], texture: [], color: [], shape: [] })}
                    className="text-sm text-[#562C0C]/60 underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Active filter pills */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {[...filters.taste, ...filters.texture, ...filters.color, ...filters.shape].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-[#562C0C]/10 text-[#562C0C] rounded-full text-xs font-medium border border-[#562C0C]/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Results */}
            <div className="w-full">
              <div className="flex flex-col items-start mt-8 md:mt-14">
                {loading ? (
                  <div className="w-full flex justify-center py-12">
                    <div className="text-xl text-[#562C0C]">
                      {t("ingredient:search.loadingIngredients")}
                    </div>
                  </div>
                ) : !hasSearched ? (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <svg
                      className="w-14 h-14 text-[#562C0C]/20 mb-4 md:hidden"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <div className="text-xl md:text-2xl text-[#562C0C] mb-2">
                      {t("ingredient:search.selectFilters")}
                    </div>
                    <p className="text-gray-500 text-sm md:text-base">
                      {t("ingredient:search.useFilters")}
                    </p>
                  </div>
                ) : ingredients.length === 0 ? (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <svg
                      className="w-14 h-14 text-[#562C0C]/20 mb-4 md:hidden"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-xl md:text-2xl text-[#562C0C] mb-2">
                      {t("ingredient:search.noIngredientsFound")}
                    </div>
                    <p className="text-gray-500 text-sm md:text-base">
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
  );
}

export default IngredientSearchpage;
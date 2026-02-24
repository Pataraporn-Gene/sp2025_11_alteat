import type React from "react";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../component/Navbar";
import SearchSideBar from "../component/SearchSideBar";
import { recipeFilter } from "../data/recipeFilter";
import recipe_img from "../assets/recipe.png";
import search from "../assets/search.png";
import RecipeCard from "../component/RecipeCard";
import type { Recipe } from "../component/RecipeCard";
import { supabase } from "../lib/supabase";
import { useTranslation } from 'react-i18next';
import { translateToEnglish } from "../lib/translateQuery";  

interface Filters {
  ingredient: string[];
  method: string[];
  cuisine: string[];
}

function RecipeSearchPage() {
  const { t } = useTranslation(["recipe", "common"]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({
    ingredient: [],
    method: [],
    cuisine: [],
  })
  const [hasSearched, setHasSearched] = useState(false);

  const PAGE_SIZE = 20;

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const activeFilterCount =
    filters.ingredient.length + filters.method.length + filters.cuisine.length

  const openMobileFilters = () => {
    const btn = document.querySelector<HTMLButtonElement>('[aria-label="Open filters"]')
    btn?.click()
  }

  const normalizeRecipes = (data: any[]): Recipe[] => {
     console.log(data);
    return data.map((r) => ({
      id: r.id,
      title: r.recipe_name,
      image: r.img_src || ".",
      tags: [
        ...(r.cuisine_path
          ? r.cuisine_path
              .split("/")
              .filter((tag: string) => tag.trim())
              .slice(1, 3)
          : []),
      ],
      isFavorite: false,
    }));
  };

  // Keep filter items as strings
  const filterSection = [
    {
      title: t("recipe:filters.ingredient"),
      category: "ingredient",
      items: recipeFilter[0].ingredient,
    },
    {
      title: t("recipe:filters.method"),
      category: "method",
      items: recipeFilter[0].method,
    },
    {
      title: t("recipe:filters.cuisine"),
      category: "cuisine",
      items: recipeFilter[0].cuisine,
    },
  ];

  const hasActiveFilters = filters.ingredient.length > 0 || filters.method.length > 0 || filters.cuisine.length > 0

  const fetchRecipes = useCallback(async (pageNum: number) => {
    if (!hasActiveFilters && !searchQuery.trim()) {
      setRecipes([])
      setHasMore(false)
      setHasSearched(false)
      return;
    }

    setLoading(true)
    setHasSearched(true)

    try {
      let query = supabase
        .from("recipes")
        .select("*", { count: "exact" })

      // Apply search query
      if (searchQuery.trim()) {
          const translatedQuery = await translateToEnglish(searchQuery);
          const searchTerm = translatedQuery.trim();
          query = query.or(
            `recipe_name.ilike.%${searchTerm}%,ingredients.ilike.%${searchTerm}%,cuisine_path.ilike.%${searchTerm}%`,
          );
      }

      // Apply cuisine filter
      if (filters.cuisine.length > 0) {
        const cuisineConditions = filters.cuisine
          .map((c) => `cuisine_path.ilike.%${c}%`)
          .join(",")
        query = query.or(cuisineConditions)
      }

      // Apply ingredient filter
      if (filters.ingredient.length > 0) {
        const ingredientConditions = filters.ingredient
          .map((i) => `ingredients.ilike.%${i}%`)
          .join(",")
        query = query.or(ingredientConditions)
      }

      // Apply method filter
      if (filters.method.length > 0) {
        const methodConditions = filters.method
          .map((m) => `directions.ilike.%${m}%,recipe_name.ilike.%${m}%`)
          .join(",")
        query = query.or(methodConditions)
      }

      // Pagination
      const from = pageNum * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      console.log("Query:", query)
      const { data, error, count } = await query.range(from, to)

      if (error) {
        console.error("Error fetching recipes:", error)
        setRecipes([])
        setHasMore(false)
        return
      }

      setRecipes((prev) =>
        pageNum === 0 ? data || [] : [...prev, ...(data || [])],
      );
   
      const totalFetched = (pageNum + 1) * PAGE_SIZE
      setHasMore(totalFetched < (count || 0))

    } catch (err) {
      console.error(err)
      setRecipes([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }

  }, [filters, hasActiveFilters, searchQuery]);

  // Reset page when filters or search change
  useEffect(() => {
    setPage(0)
    setHasMore(false)
  }, [filters, searchQuery])

  // Fetch when page, filters, or search changes
  useEffect(() => {
    fetchRecipes(page)
  }, [page, fetchRecipes])

  // Handle filter changes from sidebar
  const handleFilterChange = (filterType: string, selectedItems: string[]) => {
    console.log("Filter changed:", filterType, selectedItems)
    
    let key = filterType.toLowerCase()
    
    // Map the translated filter titles back to the filter keys
    if (key === t("recipe:filters.ingredient").toLowerCase()) {
      key = "ingredient";
    } else if (
      key === t("recipe:filters.method").toLowerCase() ||
      key === "cooking method"
    ) {
      key = "method";
    } else if (key === t("recipe:filters.cuisine").toLowerCase()) {
      key = "cuisine";
    }

    setFilters((prev) => ({
      ...prev,
      [key]: selectedItems,
    }))
  }

  // Handle search submission
  const handleSearch = async () => {
    setPage(0)
    fetchRecipes(0)
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#FFEDDD]">
        <div className="relative">
          <Navbar />
          <div className="flex">
            {/* Hide SearchSideBar's own floating button — we use our custom one instead */}
            <div className="[&>button]:hidden sticky top-0 h-screen overflow-y-auto">
              <SearchSideBar filter={filterSection} onFilterChange={handleFilterChange} />
            </div>

            <div className="flex-1 flex justify-center">
              {/* Main Content */}
              <div className="flex flex-col items-center mb-20 max-w-7xl w-full px-5 md:w-[85%] md:px-0">

                {/* Header */}
                <div className="flex items-center mb-5 w-full mt-4 md:mt-0">
                  <div className="flex-1">
                    <h1 className="text-3xl md:text-5xl mb-2 md:mb-4 leading-tight">
                      {t('recipe:search.title')}
                    </h1>
                    <p className="text-[14px] md:text-[16px]">{t('recipe:search.subtitle')}</p>
                  </div>
                  <img src={recipe_img} alt="Recipe" className="w-24 h-24 object-contain md:w-auto md:h-auto" />
                </div>

                {/* Search bar */}
                <div className="w-full relative">
                  <img
                    src={search || "/placeholder.svg"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer w-5 h-5 md:w-auto md:h-auto object-contain"
                    onClick={handleSearch}
                    alt="Search"
                  />
                  <input
                    type="text"
                    placeholder={t('recipe:search.searchPlaceholder')}
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
                        onClick={() => setFilters({ ingredient: [], method: [], cuisine: [] })}
                        className="text-sm text-[#562C0C]/60 underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Active filter pills */}
                  {activeFilterCount > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {[...filters.ingredient, ...filters.method, ...filters.cuisine].map((tag) => (
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

                {/* Card Item */}
                <div className="w-full">
                  <h3 className="my-5 sm:my-7 text-xl sm:text-2xl">
                    {hasSearched
                      ? t('recipe:search.youCanMake', { count: recipes.length })
                      : ""}
                  </h3>
                  <div className="flex flex-col items-start">
                    {loading && page === 0 ? (
                      <div className="w-full flex justify-center py-12">
                        <div className="text-xl text-[#562C0C]">{t('recipe:search.loadingRecipes')}</div>
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
                        <div className="text-xl sm:text-2xl text-[#562C0C] mb-2">{t('recipe:search.selectFilters')}</div>
                        <p className="text-gray-500 text-sm md:text-base">{t('recipe:search.useFilters')}</p>
                      </div>
                    ) : recipes.length === 0 ? (
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
                        <div className="text-xl sm:text-2xl text-[#562C0C] mb-2">{t('recipe:search.noRecipesFound')}</div>
                        <p className="text-gray-500 text-sm md:text-base">{t('recipe:search.adjustFilters')}</p>
                      </div>
                    ) : (
                      <RecipeCard recipes={normalizeRecipes(recipes)} />
                    )}
                  </div>
                </div>

                {/* View More */}
                {hasMore && !loading && recipes.length > 0 && (
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="mt-4 px-6 py-2 bg-[#562C0C] text-white rounded-full hover:bg-[#6d3810] transition-colors"
                  >
                    {t('common:viewMore')}
                  </button>
                )}

                {/* Loading more indicator */}
                {loading && page > 0 && (
                  <div className="mt-4 text-[#562C0C]">{t('recipe:search.loadingMore')}</div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default RecipeSearchPage
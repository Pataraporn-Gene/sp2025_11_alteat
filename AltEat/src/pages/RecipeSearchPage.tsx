import type React from "react"

import { useState, useEffect, useCallback } from "react"
import Navbar from "../component/Navbar"
import SearchSideBar from "../component/SearchSideBar"
import { recipeFilter } from "../data/recipeFilter"
import recipe_img from "../assets/recipe.png"
import search from "../assets/search.png"
import RecipeCard from "../component/RecipeCard"
import type { Recipe } from "../component/RecipeCard"
import { supabase } from "../lib/supabase"
import { useTranslation } from 'react-i18next'
import { translateToEnglish } from "../lib/translateQuery"  

interface Filters {
  ingredient: string[]
  method: string[]
  cuisine: string[]
}

function RecipeSearchPage() {
  const { t } = useTranslation(['recipe', 'common'])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({
    ingredient: [],
    method: [],
    cuisine: [],
  })
  const [hasSearched, setHasSearched] = useState(false)

  const PAGE_SIZE = 20

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const normalizeRecipes = (data: any[]): Recipe[] => {
    console.log(data)
    return data.map((r) => ({
      id: r.id,
      title: r.recipe_name,
      image: r.img_src || ".",
      tags: [
        ...(r.cuisine_path ? r.cuisine_path.split("/").filter((tag: string) => tag.trim()).slice(1, 3) : []),
      ],
      isFavorite: false,
    }))
  }

  // Keep filter items as strings
  const filterSection = [
    {
      title: t('recipe:filters.ingredient'),
      category: 'ingredient',
      items: recipeFilter[0].ingredient,
    },
    {
      title: t('recipe:filters.method'),
      category: 'method',
      items: recipeFilter[0].method,
    },
    {
      title: t('recipe:filters.cuisine'),
      category: 'cuisine',
      items: recipeFilter[0].cuisine,
    },
  ]

  const hasActiveFilters = filters.ingredient.length > 0 || filters.method.length > 0 || filters.cuisine.length > 0

  const fetchRecipes = useCallback(async (pageNum: number) => {
    if (!hasActiveFilters && !searchQuery.trim()) {
      setRecipes([])
      setHasMore(false)
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      let query = supabase
        .from("recipes")
        .select("*", { count: "exact" })

      // Apply search query
      if (searchQuery.trim()) {
        const translatedQuery = await translateToEnglish(searchQuery)
        const searchTerm = translatedQuery.trim()
        query = query.or(`recipe_name.ilike.%${searchTerm}%,ingredients.ilike.%${searchTerm}%,cuisine_path.ilike.%${searchTerm}%`)
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

      setRecipes(prev => pageNum === 0 ? (data || []) : [...prev, ...(data || [])])
      
      const totalFetched = (pageNum + 1) * PAGE_SIZE
      setHasMore(totalFetched < (count || 0))

    } catch (err) {
      console.error(err)
      setRecipes([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }

  }, [filters, hasActiveFilters, searchQuery])

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
    console.log("Filter changed:", filterType, selectedItems); // Debug log
    
    let key = filterType.toLowerCase()
    
    // Map the translated filter titles back to the filter keys
    if (key === t('recipe:filters.ingredient').toLowerCase()) {
      key = "ingredient"
    } else if (key === t('recipe:filters.method').toLowerCase() || key === "cooking method") {
      key = "method"
    } else if (key === t('recipe:filters.cuisine').toLowerCase()) {
      key = "cuisine"
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
            {/* Side Bar */}
            <SearchSideBar filter={filterSection} onFilterChange={handleFilterChange} />

            <div className="flex-1 flex justify-center">
              {/* Main Content */}
              <div className="flex flex-col items-center mb-20 max-w-7xl w-full px-4 sm:px-8">
                <div className="flex items-center mb-5 w-full">
                  <div className="flex-1">
                    <h1 className="text-3xl sm:text-5xl mb-3 sm:mb-4">{t('recipe:search.title')}</h1>
                    <p className="text-[15px] sm:text-[16px]">{t('recipe:search.subtitle')}</p>
                  </div>
                  <img src={recipe_img} alt="Recipe" className="hidden sm:block w-32 shrink-0" />
                </div>

                {/* Text Input */}
                <div className="w-full relative">
                  <img
                    src={search || "/placeholder.svg"}
                    className="absolute right-4 top-3 cursor-pointer"
                    onClick={handleSearch}
                    alt="Search"
                  />
                  <input
                    type="text"
                    placeholder={t('recipe:search.searchPlaceholder')}
                    className="px-6 py-3 bg-white w-full rounded-[20px] outline-[1.5px] shadow-[0_8px_4px_rgba(0,0,0,0.25)]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
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
                        <div className="text-xl sm:text-2xl text-[#562C0C] mb-2">{t('recipe:search.selectFilters')}</div>
                        <p className="text-gray-500">{t('recipe:search.useFilters')}</p>
                      </div>
                    ) : recipes.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="text-xl sm:text-2xl text-[#562C0C] mb-2">{t('recipe:search.noRecipesFound')}</div>
                        <p className="text-gray-500">{t('recipe:search.adjustFilters')}</p>
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
  );
}

export default RecipeSearchPage;
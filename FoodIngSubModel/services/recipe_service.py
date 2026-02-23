#!/usr/bin/env python3
"""
Recipe Service for Recipe Suggestion System

Service for recipe-related operations, delegating to OpenAI service for recipe suggestions.
"""

import os
from typing import List, Optional, Tuple

from config import Config
from models import RecipeSuggestion
from services.openai_service import OpenAIService
from utils import logger


class RecipeService:
    """Service for recipe-related operations."""
    
    def __init__(self, config: Config):
        self.config = config
        self.openai_service = OpenAIService(config)
        self._supabase = None
        self._initialize_supabase()
    
    def _initialize_supabase(self):
        """Initialize the Supabase client."""
        url = os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("VITE_SUPABASE_ANON_KEY")
        
        if not url or not key:
            return
            
        try:
            from supabase import create_client
            self._supabase = create_client(url, key)
            logger.info("Supabase client initialized successfully")
        except ImportError:
            logger.warning("Supabase package not installed. Run `pip install supabase`.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")

    def _get_supabase_suggestions(self, ingredients: List[str], limit: int) -> List[RecipeSuggestion]:
        if not self._supabase or not ingredients:
            return []
            
        try:
            search_ingredients = [ing.strip().lower() for ing in ingredients if ing.strip()]
            if not search_ingredients:
                return []

            logger.info(f"Searching for recipes with ingredients: {search_ingredients}")

            response = self._supabase.rpc(
                "search_recipes_by_ingredients",
                {"search_terms": search_ingredients, "result_limit": limit}
            ).execute()

            logger.info(f"Supabase RPC returned {len(response.data)} recipes")

            results = []
            for record in response.data:
                recipe_name = record.get("recipe_name") or "Unknown Recipe"
                match_count = record.get("match_count", 0)
                logger.info(f"Recipe '{recipe_name}' matches {match_count}/{len(search_ingredients)} ingredients")

                results.append(RecipeSuggestion(
                    name=recipe_name,
                    ingredients="",
                    id=record.get("id"),
                    image=record.get("img_src")
                ))

            return results

        except Exception as e:
            logger.error(f"Error querying Supabase: {e}")
            return []
    
    def get_suggestions(self, ingredients: List[str],
                       max_results: Optional[int] = None) -> Tuple[List[RecipeSuggestion], str]:
        """Get recipe suggestions based on available ingredients."""
        max_results = max_results or self.config.max_recipes
        
        # Try Supabase first
        if self._supabase:
            db_results = self._get_supabase_suggestions(ingredients, max_results)
            if db_results:
                print(f"Returning {len(db_results)} recipes from Supabase.")
                print(db_results)
                return db_results, "dataset"
        
        if not self.openai_service.is_available:
            return [], "none"
        
        return self.openai_service.get_recipe_suggestions(ingredients, max_results), "gpt"
    
    def get_similar_recipes(self, original_recipe: str, max_results: int = 4) -> List[RecipeSuggestion]:
        """Get recipes similar to the original recipe."""
        if not self.openai_service.is_available:
            return []
        
        return self.openai_service.get_similar_recipes(original_recipe, max_results)
    
    def get_recipe_with_ingredients(self, recipe_name: str, substitute_ingredients: List[str]) -> Optional[RecipeSuggestion]:
        """Get the original recipe with detailed ingredients, incorporating substitutes."""
        if not self.openai_service.is_available:
            return None
        
        return self.openai_service.get_recipe_with_ingredients(recipe_name, substitute_ingredients)
    
    def get_recipes_with_specific_ingredients(self, required_ingredients: List[str], 
                                            recipe_context: str = "", max_results: int = 5) -> List[RecipeSuggestion]:
        """Get recipe suggestions that MUST include the specified ingredients."""
        if not self.openai_service.is_available:
            return []
        
        return self.openai_service.get_recipes_with_specific_ingredients(required_ingredients, recipe_context, max_results)

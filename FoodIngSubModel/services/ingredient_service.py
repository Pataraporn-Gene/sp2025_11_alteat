#!/usr/bin/env python3
"""
Ingredient Service for Recipe Suggestion System

Main service for ingredient-related operations, combining OpenAI and dataset services.
"""

from typing import Optional

from config import Config
from models import SuggestionResult
from services.openai_service import OpenAIService
from services.dataset_service import DatasetService


class IngredientService:
    """Main service for ingredient-related operations."""
    
    def __init__(self, config: Config):
        self.config = config
        self.openai_service = OpenAIService(config)
        self.dataset_service = DatasetService(config)
    
    def get_substitutes(self, ingredient: str, recipe: str = "General Recipe",
                       max_results: Optional[int] = None,
                       include_reasoning: bool = False) -> SuggestionResult:
        """Get ingredient substitutes with fallback strategy."""
        max_results = max_results or self.config.max_substitutes
        
        # Try OpenAI first
        if self.openai_service.is_available:
            result = self.openai_service.get_substitute_ingredients(
                ingredient, recipe, max_results, include_reasoning
            )
            if result.items:
                return result
        
        # Fallback to context-based suggestions
        if self.openai_service.is_available:
            result = self.openai_service.get_context_based_ingredients(
                recipe_title=recipe, max_results=max_results
            )
            if result.items:
                result.source = "gpt_context"
                return result
        
        return SuggestionResult([], "none")
    
    def get_context_suggestions(self, taste: Optional[str] = None,
                              texture: Optional[str] = None,
                              color: Optional[str] = None,
                              cooking_method: Optional[str] = None,
                              recipe_title: Optional[str] = None,
                              natural_description: Optional[str] = None,
                              max_results: Optional[int] = None) -> SuggestionResult:
        """Get ingredients based on context with hybrid approach."""
        max_results = max_results or self.config.max_ingredients
        
        # Parse natural language description if provided
        if natural_description and self.openai_service.is_available:
            parsed_context = self.openai_service.parse_natural_language_context(natural_description)
            # Use parsed values if individual attributes not provided
            taste = taste or parsed_context.get("taste")
            texture = texture or parsed_context.get("texture")
            color = color or parsed_context.get("color")
            cooking_method = cooking_method or parsed_context.get("cooking_method")
        
        # Try dataset first
        dataset_result = self.dataset_service.get_context_based_ingredients(
            taste, texture, color, cooking_method, max_results
        )
        
        if len(dataset_result.items) >= max_results:
            return dataset_result
        
        # Supplement with GPT if needed
        if not self.openai_service.is_available:
            return dataset_result
        
        gpt_result = self.openai_service.get_context_based_ingredients(
            taste, texture, color, cooking_method, recipe_title, max_results
        )
        
        if not gpt_result.items:
            return dataset_result
        
        # Merge results
        merged_items = list(dataset_result.items)
        seen = {item.strip().casefold() for item in merged_items}
        
        for item in gpt_result.items:
            key = item.strip().casefold()
            if key not in seen:
                merged_items.append(item)
                seen.add(key)
            if len(merged_items) >= max_results:
                break
        
        # Determine source
        has_dataset = bool(dataset_result.items)
        has_gpt = bool(gpt_result.items)
        
        if has_dataset and has_gpt:
            source = "dataset+gpt"
        elif has_gpt:
            source = "gpt"
        elif has_dataset:
            source = "dataset"
        else:
            source = "none"
        
        return SuggestionResult(merged_items[:max_results], source)

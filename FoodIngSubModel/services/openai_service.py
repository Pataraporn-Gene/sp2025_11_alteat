#!/usr/bin/env python3
"""
OpenAI Service for Recipe Suggestion System

Handles all OpenAI API interactions for ingredient substitution and recipe suggestions.
"""

import os
import re
import json
from typing import Dict, List, Optional

from config import Config
from models import SuggestionResult, RecipeSuggestion
from utils import parse_numbered_list, logger


class OpenAIService:
    """Handles all OpenAI API interactions."""
    
    def __init__(self, config: Config):
        self.config = config
        self._client = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize the OpenAI client."""
        api_key = self._resolve_api_key()
        if not api_key:
            logger.warning("OpenAI API key not found")
            return
        
        try:
            from openai import OpenAI
            self._client = OpenAI(api_key=api_key)
            logger.info("OpenAI client initialized successfully")
        except ImportError:
            logger.error("OpenAI package not installed")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
    
    def _resolve_api_key(self) -> Optional[str]:
        """Resolve API key from environment or .env files."""
        # Check environment variables
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OpanAI_apikey")
        if api_key and api_key.strip():
            return api_key.strip()
        
        # Check .env files
        env_files = [f"{self.config.base_dir}/.env", ".env"]
        for env_path in env_files:
            try:
                if os.path.exists(env_path):
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if not line or line.startswith("#"):
                                continue
                            if "OpanAI_apikey" in line or "OPENAI_API_KEY" in line:
                                _, _, value = line.partition("=")
                                if value:
                                    val = value.strip().strip("\"'")
                                    if val:
                                        return val
            except Exception as e:
                logger.debug(f"Error reading {env_path}: {e}")
        
        return None
    
    @property
    def is_available(self) -> bool:
        """Check if OpenAI client is available."""
        return self._client is not None
    
    def _make_request(self, system_message: str, user_message: str, 
                     max_tokens: int = 200) -> Optional[str]:
        """Make a standardized OpenAI API request."""
        if not self.is_available:
            return None
        
        try:
            response = self._client.chat.completions.create(
                model=self.config.openai_model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=max_tokens,
                temperature=self.config.temperature
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API request failed: {e}")
            return None
    
    def get_substitute_ingredients(self, ingredient: str, recipe: str, 
                                 max_results: int, include_reasoning: bool = False) -> SuggestionResult:
        """Get ingredient substitutes from OpenAI."""
        if include_reasoning:
            system = (
                f"You are a culinary expert. Provide up to {max_results} substitutes "
                f"for the ingredient with brief reasons. Format each line as: "
                f"'Ingredient - reason'. No extra text."
            )
        else:
            system = (
                f"You are a culinary expert. Provide up to {max_results} substitute "
                f"ingredients for the target ingredient in the given recipe. "
                f"Respond as a numbered list with only ingredient names."
            )
        
        user = f"Ingredient: {ingredient}\nRecipe: {recipe}"
        response_text = self._make_request(system, user, max_tokens=200)
        
        if not response_text:
            return SuggestionResult([], "none")
        
        if include_reasoning:
            items, reasons = [], []
            lines = parse_numbered_list(response_text)
            for line in lines:
                parts = [p.strip() for p in re.split(r"\s+-\s+", line, maxsplit=1)]
                if parts:
                    items.append(parts[0])
                    reasons.append(parts[1] if len(parts) > 1 else "")
            return SuggestionResult(items[:max_results], "gpt", reasons[:max_results])
        else:
            items = parse_numbered_list(response_text)
            return SuggestionResult(items[:max_results], "gpt")
    
    def get_recipe_suggestions(self, ingredients: List[str], 
                             max_results: int) -> List[RecipeSuggestion]:
        """Get recipe suggestions based on ingredients."""
        system = (
            f"You are a concise culinary assistant. Suggest up to {max_results} "
            f"recipes as a numbered list. Each item must be in the form: "
            f"Recipe: <name> | Ingredients: <comma-separated list>. No extra commentary."
        )
        user = f"Available ingredients: {', '.join(ingredients)}"
        
        response_text = self._make_request(system, user, max_tokens=400)
        if not response_text:
            return []
        
        results = []
        for line in response_text.splitlines():
            line = line.strip()
            if not line:
                continue
            line = re.sub(r"^\s*\d+\.|^[-•]", "", line).strip()
            match = re.match(r"Recipe:\s*(.+?)\s*\|\s*Ingredients:\s*(.+)$", 
                           line, flags=re.IGNORECASE)
            if match:
                results.append(RecipeSuggestion(
                    name=match.group(1).strip(),
                    ingredients=match.group(2).strip()
                ))
        
        return results[:max_results]
    
    def get_similar_recipes(self, original_recipe: str, max_results: int = 4) -> List[RecipeSuggestion]:
        """Get recipes similar to the original recipe."""
        system = (
            f"You are a concise culinary assistant. Suggest up to {max_results} "
            f"recipes that are similar to the given recipe. Each item must be in the form: "
            f"Recipe: <name> | Ingredients: <comma-separated list>. No extra commentary."
        )
        user = f"Original recipe: {original_recipe}"
        
        response_text = self._make_request(system, user, max_tokens=400)
        if not response_text:
            return []
        
        results = []
        for line in response_text.splitlines():
            line = line.strip()
            if not line:
                continue
            line = re.sub(r"^\s*\d+\.|^[-•]", "", line).strip()
            match = re.match(r"Recipe:\s*(.+?)\s*\|\s*Ingredients:\s*(.+)$", 
                           line, flags=re.IGNORECASE)
            if match:
                results.append(RecipeSuggestion(
                    name=match.group(1).strip(),
                    ingredients=match.group(2).strip()
                ))
        
        return results[:max_results]
    
    def get_recipes_with_specific_ingredients(self, required_ingredients: List[str], 
                                            recipe_context: str = "", max_results: int = 5) -> List[RecipeSuggestion]:
        """Get recipe suggestions that MUST include the specified ingredients."""
        required_text = ", ".join(required_ingredients)
        context_text = f" similar to {recipe_context}" if recipe_context else ""
        
        system = (
            f"You are a concise culinary assistant. Suggest up to {max_results} "
            f"recipes that MUST include ALL of these ingredients: {required_text}. "
            f"Each recipe suggestion must be in the form: "
            f"Recipe: <name> | Ingredients: <comma-separated list>. "
            f"Ensure every suggested recipe includes all the required ingredients. No extra commentary."
        )
        user = f"Required ingredients that MUST be in every recipe: {required_text}{context_text}"
        
        response_text = self._make_request(system, user, max_tokens=500)
        if not response_text:
            return []
        
        results = []
        for line in response_text.splitlines():
            line = line.strip()
            if not line:
                continue
            line = re.sub(r"^\s*\d+\.|^[-•]", "", line).strip()
            match = re.match(r"Recipe:\s*(.+?)\s*\|\s*Ingredients:\s*(.+)$", 
                           line, flags=re.IGNORECASE)
            if match:
                recipe_name = match.group(1).strip()
                ingredients_text = match.group(2).strip()
                
                # Verify that all required ingredients are mentioned in the recipe
                ingredients_lower = ingredients_text.lower()
                all_included = True
                for req_ingredient in required_ingredients:
                    if req_ingredient.lower() not in ingredients_lower:
                        all_included = False
                        break
                
                if all_included:
                    results.append(RecipeSuggestion(
                        name=recipe_name,
                        ingredients=ingredients_text
                    ))
        
        return results[:max_results]

    def get_recipe_with_ingredients(self, recipe_name: str, substitute_ingredients: List[str]) -> Optional[RecipeSuggestion]:
        """Get the original recipe with detailed ingredients, incorporating substitutes."""
        substitutes_text = ", ".join(substitute_ingredients) if substitute_ingredients else "none"
        
        system = (
            f"You are a culinary expert. Provide the detailed recipe with complete ingredient list. "
            f"If substitute ingredients are provided, incorporate them into the recipe. "
            f"Format as: Recipe: <name> | Ingredients: <comma-separated list>. No extra commentary."
        )
        user = f"Recipe: {recipe_name}\nSubstitute ingredients to include: {substitutes_text}"
        
        response_text = self._make_request(system, user, max_tokens=300)
        if not response_text:
            return None
        
        # Parse the response
        line = response_text.strip()
        line = re.sub(r"^\s*\d+\.|^[-•]", "", line).strip()
        match = re.match(r"Recipe:\s*(.+?)\s*\|\s*Ingredients:\s*(.+)$", 
                       line, flags=re.IGNORECASE)
        if match:
            return RecipeSuggestion(
                name=match.group(1).strip(),
                ingredients=match.group(2).strip()
            )
        
        # Fallback if parsing fails
        return RecipeSuggestion(
            name=recipe_name,
            ingredients=f"Recipe details for {recipe_name} with substitutes: {substitutes_text}"
        )
    
    def get_recipe_details(self, recipe_name: str) -> Optional[Dict[str, str]]:
        """Get detailed recipe information including ingredients and cooking method."""
        system = (
            "You are a culinary expert. Provide a detailed recipe with specific ingredients list (including quantities) and cooking method. "
            "Format your response as: 'Ingredients: <ingredient list with quantities> | Cooking Method: <detailed steps>'. "
            "Be comprehensive but concise. Use standard measurements and be specific about quantities."
        )
        user = f"Recipe name: {recipe_name}"
        
        response_text = self._make_request(system, user, max_tokens=500)
        if not response_text:
            return None
        
        # Try to parse the structured response
        match = re.match(r"Ingredients:\s*(.+?)\s*\|\s*Cooking Method:\s*(.+)$", 
                       response_text.strip(), flags=re.IGNORECASE | re.DOTALL)
        if match:
            return {    
                "ingredients": match.group(1).strip(),
                "cooking_method": match.group(2).strip()
            }
        
        # Fallback: return the whole response as cooking method
        return {
            "ingredients": f"Ingredients for {recipe_name} (see cooking method for details)",
            "cooking_method": response_text.strip()
        }
    
    def get_updated_recipe_with_substitution(self, recipe_name: str, original_ingredients: str, 
                                           original_ingredient: str, substitute_ingredient: str) -> Optional[Dict[str, str]]:
        """Get updated recipe with substituted ingredient and modified cooking method."""
        system = (
            "You are a culinary expert. Update the given recipe by making MINIMAL changes - ONLY substitute the specified ingredient. "
            "Keep ALL other ingredients exactly the same with same quantities and descriptions. "
            "IMPORTANT: Provide the COMPLETE updated ingredients list and COMPLETE cooking method, but only change the specific ingredient being substituted. "
            "Only modify cooking instructions if the substitute ingredient requires different handling (different cooking time, temperature, or preparation). "
            "Format your response as: 'Updated Ingredients: <COMPLETE updated ingredient list with all original ingredients except the substituted one> | Updated Cooking Method: <COMPLETE detailed cooking steps>'. "
            "Show the full recipe details, not just a brief summary."
        )
        user = (
            f"Recipe: {recipe_name}\n"
            f"Original ingredients: {original_ingredients}\n"
            f"Replace ONLY '{original_ingredient}' with '{substitute_ingredient}' - keep everything else identical but show the complete updated recipe"
        )
        
        response_text = self._make_request(system, user, max_tokens=800)
        if not response_text:
            return None
        
        # Try to parse the structured response
        match = re.match(r"Updated Ingredients:\s*(.+?)\s*\|\s*Updated Cooking Method:\s*(.+)$", 
                       response_text.strip(), flags=re.IGNORECASE | re.DOTALL)
        if match:
            return {
                "ingredients": match.group(1).strip(),
                "cooking_method": match.group(2).strip()
            }
        
        # Fallback: return the whole response with clarification
        return {
            "ingredients": f"Updated ingredients for {recipe_name} (substituting {original_ingredient} with {substitute_ingredient})\n{response_text.strip()}",
            "cooking_method": f"Please refer to the updated ingredients section above for the complete recipe details with {substitute_ingredient} substituted for {original_ingredient}."
        }
    
    def get_context_based_ingredients(self, taste: Optional[str] = None,
                                    texture: Optional[str] = None,
                                    color: Optional[str] = None,
                                    cooking_method: Optional[str] = None,
                                    recipe_title: Optional[str] = None,
                                    max_results: int = 10) -> SuggestionResult:
        """Get ingredients based on context attributes."""
        constraints = []
        if taste: constraints.append(f"Taste: {taste}")
        if texture: constraints.append(f"Texture: {texture}")
        if color: constraints.append(f"Color: {color}")
        if cooking_method: constraints.append(f"Cooking method: {cooking_method}")
        if recipe_title: constraints.append(f"Recipe: {recipe_title}")
        
        constraint_text = " | ".join(constraints) if constraints else "No constraints"
        
        system = (
            f"You are a concise culinary assistant. Suggest up to {max_results} "
            f"ingredient names that match the given context and optionally the recipe. "
            f"Return a numbered list of ingredient names only."
        )
        user = f"Context: {constraint_text}"
        
        response_text = self._make_request(system, user, max_tokens=300)
        if not response_text:
            return SuggestionResult([], "none")
        
        items = parse_numbered_list(response_text)
        return SuggestionResult(items[:max_results], "gpt")
    
    def parse_natural_language_context(self, description: str) -> Dict[str, Optional[str]]:
        """Parse natural language description into context categories."""
        if not description or not description.strip():
            return {"taste": None, "texture": None, "color": None, "cooking_method": None}
        
        system = (
            "You are a culinary expert that analyzes food descriptions. "
            "Parse the given description and extract taste/flavor, texture, color, and cooking method. "
            "Return ONLY a JSON object with keys: taste, texture, color, cooking_method. "
            "Use null for missing information. Be concise with single words or short phrases."
        )
        user = f"Description: {description}"
        
        response_text = self._make_request(system, user, max_tokens=150)
        if not response_text:
            return {"taste": None, "texture": None, "color": None, "cooking_method": None}
        
        try:
            # Try to parse JSON response
            # Clean up the response text to extract JSON
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            parsed = json.loads(response_text)
            return {
                "taste": parsed.get("taste"),
                "texture": parsed.get("texture"), 
                "color": parsed.get("color"),
                "cooking_method": parsed.get("cooking_method")
            }
        except (json.JSONDecodeError, Exception) as e:
            logger.debug(f"Failed to parse JSON response: {e}")
            # Fallback: try to extract manually
            response_lower = response_text.lower()
            return {
                "taste": self._extract_attribute(response_lower, ["sour", "sweet", "salty", "bitter", "umami", "spicy", "tangy", "mild"]),
                "texture": self._extract_attribute(response_lower, ["crunchy", "soft", "crispy", "creamy", "chewy", "smooth", "firm", "tender"]),
                "color": self._extract_attribute(response_lower, ["red", "green", "yellow", "orange", "white", "brown", "purple", "black"]),
                "cooking_method": self._extract_attribute(response_lower, ["fried", "boiled", "grilled", "baked", "raw", "steamed", "roasted"])
            }
    
    def _extract_attribute(self, text: str, keywords: List[str]) -> Optional[str]:
        """Extract attribute from text based on keywords."""
        for keyword in keywords:
            if keyword in text:
                return keyword
        return None

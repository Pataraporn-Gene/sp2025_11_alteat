# backend_api.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from config import Config
from services.ingredient_service import IngredientService
from services.recipe_service import RecipeService
from services.openai_service import OpenAIService

app = FastAPI(title="Recipe Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

config = Config()
ingredient_service = IngredientService(config)
recipe_service = RecipeService(config)
openai_service = OpenAIService(config)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class UnifiedRequest(BaseModel):
    """
    Unified request body sent by the n8n AI agent.

    Entities reference per classification:
      substitute   : ingredient (req), recipe, include_reasoning, max_results
      context      : attributes{taste,texture,color,cooking_method},
                     natural_description, recipe_title, max_results
      suggest      : ingredients[] (req), max_results
      similar      : recipe (req), max_results
      specific     : required_ingredients[] (req), recipe_context, max_results
      recipe_custom: recipe (req), substitutes[] (req)
      lookup       : recipe (req)
      rewrite      : recipe (req), ingredient (req), replacement (req),
                     original_ingredients (optional, auto-fetched if absent)
    """
    classification: str
    entities: Dict[str, Any]
    confidence: float


class UnifiedResponse(BaseModel):
    classification: str
    data: Any
    source: Optional[str] = None
    confidence: float
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _recipe_row(recipe, *, from_db: bool) -> Dict:
    """Serialise a RecipeSuggestion. id/image are null for non-Supabase results."""
    return {
        "id":          recipe.id    if from_db else None,
        "name":        recipe.name,
        "ingredients": recipe.ingredients or None,
        "image":       recipe.image if from_db else None,
    }


def _err(classification: str, message: str, confidence: float) -> UnifiedResponse:
    return UnifiedResponse(
        classification=classification,
        data=None,
        error=message,
        confidence=confidence,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/substitute")
def substitute(req: UnifiedRequest):
    """
    Find substitute ingredients for a given ingredient.
    entities: ingredient (required), recipe, include_reasoning, max_results
    """
    try:
        ingredient     = req.entities.get("ingredient")
        recipe         = req.entities.get("recipe", "General Recipe")
        include_reason = bool(req.entities.get("include_reasoning", False))
        max_results    = req.entities.get("max_results")

        if not ingredient:
            return _err("substitute", "Missing required field: ingredient", req.confidence)

        result = ingredient_service.get_substitutes(
            ingredient=ingredient,
            recipe=recipe,
            max_results=max_results,
            include_reasoning=include_reason,
        )

        data = {"substitutes": result.items}
        if include_reason and result.reasons:
            data["reasons"] = result.reasons

        return UnifiedResponse(
            classification="substitute",
            data=data,
            source=result.source,
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("substitute", str(e), req.confidence)


@app.post("/context")
def context(req: UnifiedRequest):
    """
    Suggest ingredients matching taste / texture / colour / cooking method.
    entities: attributes{taste, texture, color, cooking_method},
              natural_description, recipe_title, max_results
    """
    try:
        # Support both flat entity keys and a nested attributes dict
        attributes     = req.entities.get("attributes") or {}
        taste          = req.entities.get("taste")          or attributes.get("taste")
        texture        = req.entities.get("texture")        or attributes.get("texture")
        color          = req.entities.get("color")          or attributes.get("color")
        # FIX: was attributes.get("method") — key must match system prompt entity "cooking_method"
        cooking_method = req.entities.get("cooking_method") or attributes.get("cooking_method")
        natural_desc   = req.entities.get("natural_description")
        recipe_title   = req.entities.get("recipe_context") or req.entities.get("recipe")
        max_results    = req.entities.get("max_results")

        result = ingredient_service.get_context_suggestions(
            taste=taste,
            texture=texture,
            color=color,
            cooking_method=cooking_method,
            recipe_title=recipe_title,
            natural_description=natural_desc,
            max_results=max_results,
        )

        return UnifiedResponse(
            classification="context",
            data={"ingredients": result.items},
            source=result.source,
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("context", str(e), req.confidence)


@app.post("/suggest")
def suggest(req: UnifiedRequest):
    """
    Suggest recipes from a list of available ingredients (Supabase-first, GPT fallback).
    entities: ingredients[] (required), max_results
    """
    try:
        ingredients = req.entities.get("ingredients")
        max_results = req.entities.get("max_results")

        if not ingredients:
            return _err("suggest", "Missing required field: ingredients", req.confidence)

        recipes, source = recipe_service.get_suggestions(
            ingredients=ingredients,
            max_results=max_results,
        )

        # FIX: id/image exposed only when the result comes from Supabase
        from_db      = source == "dataset"
        recipes_data = [_recipe_row(r, from_db=from_db) for r in recipes]

        return UnifiedResponse(
            classification="suggest",
            data={"recipes": recipes_data},
            source=source,
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("suggest", str(e), req.confidence)


@app.post("/similar")
def similar(req: UnifiedRequest):
    """
    Find recipes similar in style to a given recipe (GPT).
    entities: recipe (required), max_results
    """
    try:
        recipe      = req.entities.get("recipe")
        max_results = req.entities.get("max_results", 4)

        if not recipe:
            return _err("similar", "Missing required field: recipe", req.confidence)

        recipes      = recipe_service.get_similar_recipes(recipe, max_results=max_results)
        # FIX: was hardcoded "dataset" — this endpoint is GPT-only
        source       = "gpt" if recipes else "none"
        recipes_data = [_recipe_row(r, from_db=False) for r in recipes]

        return UnifiedResponse(
            classification="similar",
            data={"recipes": recipes_data},
            source=source,
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("similar", str(e), req.confidence)


@app.post("/specific")
def specific(req: UnifiedRequest):
    """
    Find recipes that MUST contain all specified ingredients (GPT).
    entities: required_ingredients[] (required), recipe_context, max_results
    """
    try:
        required_ingredients = req.entities.get("required_ingredients")
        recipe_context       = req.entities.get("recipe_context", "")
        max_results          = req.entities.get("max_results", 5)

        if not required_ingredients:
            return _err("specific", "Missing required field: required_ingredients", req.confidence)

        recipes      = recipe_service.get_recipes_with_specific_ingredients(
            required_ingredients=required_ingredients,
            recipe_context=recipe_context,
            max_results=max_results,
        )
        source       = "gpt" if recipes else "none"
        recipes_data = [_recipe_row(r, from_db=False) for r in recipes]

        return UnifiedResponse(
            classification="specific",
            data={"recipes": recipes_data},
            source=source,
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("specific", str(e), req.confidence)


@app.post("/lookup")
def lookup(req: UnifiedRequest):
    """
    Get full recipe details: ingredient list + step-by-step cooking method (GPT).
    entities: recipe (required)
    """
    try:
        recipe = req.entities.get("recipe")

        if not recipe:
            return _err("lookup", "Missing required field: recipe", req.confidence)

        result = openai_service.get_recipe_details(recipe)

        if not result:
            return _err("lookup", f"Could not find details for recipe: {recipe}", req.confidence)

        return UnifiedResponse(
            classification="lookup",
            data={
                "name":           recipe,
                "ingredients":    result.get("ingredients"),
                "cooking_method": result.get("cooking_method"),
            },
            source="gpt",
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("lookup", str(e), req.confidence)


@app.post("/recipe_custom")
def recipe_custom(req: UnifiedRequest):
    """
    Rebuild a named recipe incorporating a list of substitute ingredients (GPT).
    entities: recipe (required), substitutes[] (required)
    """
    try:
        recipe      = req.entities.get("recipe")
        substitutes = req.entities.get("substitutes", [])

        if not recipe:
            return _err("recipe_custom", "Missing required field: recipe", req.confidence)
        if not substitutes:
            return _err("recipe_custom", "Missing required field: substitutes", req.confidence)

        # FIX: corrected param names to match service signature
        result = recipe_service.get_recipe_with_ingredients(
            recipe_name=recipe,
            substitute_ingredients=substitutes,
        )

        if not result:
            return _err("recipe_custom", "Could not generate recipe", req.confidence)

        return UnifiedResponse(
            classification="recipe_custom",
            data=_recipe_row(result, from_db=False),
            source="gpt",
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("recipe_custom", str(e), req.confidence)


@app.post("/rewrite")
def rewrite(req: UnifiedRequest):
    """
    Rewrite a recipe by swapping exactly one ingredient.
    entities: recipe (required), ingredient (required), replacement (required),
              original_ingredients (optional — auto-fetched via GPT if absent)
    """
    try:
        recipe         = req.entities.get("recipe")
        old_ingredient = req.entities.get("ingredient")
        new_ingredient = req.entities.get("replacement")
        # Allow the caller to supply original_ingredients to skip an extra GPT call
        original_str   = req.entities.get("original_ingredients")

        if not recipe or not old_ingredient or not new_ingredient:
            return _err(
                "rewrite",
                "Missing required fields: recipe, ingredient (old), and replacement (new)",
                req.confidence,
            )

        # Auto-fetch original ingredients when not provided by the caller
        if not original_str:
            recipe_details = openai_service.get_recipe_details(recipe)
            if not recipe_details or "ingredients" not in recipe_details:
                return _err("rewrite", f"Could not fetch ingredients for: {recipe}", req.confidence)
            ing          = recipe_details["ingredients"]
            original_str = ", ".join(ing) if isinstance(ing, list) else ing

        result = openai_service.get_updated_recipe_with_substitution(
            recipe_name=recipe,
            original_ingredients=original_str,
            original_ingredient=old_ingredient,
            substitute_ingredient=new_ingredient,
        )

        if not result:
            return _err("rewrite", "Could not rewrite recipe", req.confidence)

        return UnifiedResponse(
            classification="rewrite",
            data={
                "name":           recipe,
                "ingredients":    result.get("ingredients"),
                "cooking_method": result.get("cooking_method"),
            },
            source="gpt",
            confidence=req.confidence,
        )
    except Exception as e:
        return _err("rewrite", str(e), req.confidence)


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status":             "ok",
        "openai_available":   openai_service.is_available,
        "supabase_available": recipe_service._supabase is not None,
    }
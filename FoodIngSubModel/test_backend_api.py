"""
Comprehensive pytest tests for FoodIngSubModel backend API endpoints.

Tests cover:
1. /substitute - ingredient substitution with recipe context
2. /context - ingredient suggestions by attributes
3. /suggest - recipe suggestions from ingredients
4. /lookup - full recipe details
5. /rewrite - recipe rewriting with ingredient replacement
6. /similar - similar recipe suggestions
7. /recipe_custom - custom recipe building with substitutes
8. /health - health check with service availability
"""

import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend_api import app
from models import RecipeSuggestion, SuggestionResult


client = TestClient(app)


# =============================================================================
# Fixtures & Test Data
# =============================================================================

@pytest.fixture
def mock_ingredient_service():
    """Mock ingredient service for testing."""
    with patch("backend_api.ingredient_service") as mock:
        yield mock


@pytest.fixture
def mock_recipe_service():
    """Mock recipe service for testing."""
    with patch("backend_api.recipe_service") as mock:
        yield mock


@pytest.fixture
def mock_openai_service():
    """Mock OpenAI service for testing."""
    with patch("backend_api.openai_service") as mock:
        yield mock


# =============================================================================
# /substitute Endpoint Tests
# =============================================================================

class TestSubstituteEndpoint:
    """Test suite for /substitute endpoint."""

    def test_substitute_success_with_recipe(self, mock_ingredient_service):
        """Test successful substitution request with recipe context."""
        mock_ingredient_service.get_substitutes.return_value = SuggestionResult(
            items=["Greek yogurt", "sour cream", "crème fraîche"],
            source="dataset+gpt",
            reasons=["similar acidity", "similar fat content", "similar texture"]
        )
        
        response = client.post("/substitute", json={
            "classification": "substitute",
            "entities": {
                "ingredient": "eggs",
                "recipe": "chocolate cake"
            },
            "confidence": 0.95
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "substitute"
        assert "data" in data
        assert "substitutes" in data["data"]
        assert isinstance(data["data"]["substitutes"], list)
        assert len(data["data"]["substitutes"]) > 0
        assert "source" in data
        assert data["confidence"] == 0.95

    def test_substitute_with_reasoning(self, mock_ingredient_service):
        """Test substitution request with include_reasoning flag."""
        mock_ingredient_service.get_substitutes.return_value = SuggestionResult(
            items=["Greek yogurt", "oil"],
            source="gpt",
            reasons=["better structure", "works in cakes"]
        )
        
        response = client.post("/substitute", json={
            "classification": "substitute",
            "entities": {
                "ingredient": "butter",
                "recipe": "pound cake",
                "include_reasoning": True,
                "max_results": 5
            },
            "confidence": 0.88
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "substitutes" in data["data"]
        assert "reasons" in data["data"]
        assert len(data["data"]["reasons"]) == len(data["data"]["substitutes"])

    def test_substitute_missing_ingredient(self):
        """Test substitution fails when ingredient field is missing."""
        response = client.post("/substitute", json={
            "classification": "substitute",
            "entities": {
                "recipe": "chocolate cake"
            },
            "confidence": 0.95
        })
        
        assert response.status_code == 200  # FastAPI returns 200 with error field
        data = response.json()
        assert data["error"] is not None
        assert "ingredient" in data["error"].lower()
        assert data["data"] is None

    def test_substitute_response_has_source(self, mock_ingredient_service):
        """Verify source field is present in response."""
        mock_ingredient_service.get_substitutes.return_value = SuggestionResult(
            items=["almond milk"],
            source="dataset"
        )
        
        response = client.post("/substitute", json={
            "classification": "substitute",
            "entities": {"ingredient": "milk", "recipe": "cake"},
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["source"] is not None
        assert data["source"] in ["dataset", "gpt", "dataset+gpt", "none"]


# =============================================================================
# /context Endpoint Tests
# =============================================================================

class TestContextEndpoint:
    """Test suite for /context endpoint."""

    def test_context_with_attributes(self, mock_ingredient_service):
        """Test context search with taste and color attributes."""
        mock_ingredient_service.get_context_suggestions.return_value = SuggestionResult(
            items=["strawberry", "watermelon", "raspberry", "tomato"],
            source="dataset"
        )
        
        response = client.post("/context", json={
            "classification": "context",
            "entities": {
                "taste": "sour",
                "color": "red"
            },
            "confidence": 0.92
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "context"
        assert "ingredients" in data["data"]
        assert isinstance(data["data"]["ingredients"], list)
        assert len(data["data"]["ingredients"]) > 0

    def test_context_with_natural_description(self, mock_ingredient_service):
        """Test context with natural language description."""
        mock_ingredient_service.get_context_suggestions.return_value = SuggestionResult(
            items=["cilantro", "lime", "jalapeño"],
            source="dataset+gpt"
        )
        
        response = client.post("/context", json={
            "classification": "context",
            "entities": {
                "natural_description": "fresh and tangy with heat",
                "recipe_context": "Mexican cuisine"
            },
            "confidence": 0.88
        })
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]["ingredients"]) > 0
        assert data["source"] == "dataset+gpt"

    def test_context_blends_dataset_and_gpt(self, mock_ingredient_service):
        """Test that context blends dataset and GPT results."""
        mock_ingredient_service.get_context_suggestions.return_value = SuggestionResult(
            items=["basil", "oregano", "parsley"],
            source="dataset+gpt"
        )
        
        response = client.post("/context", json={
            "classification": "context",
            "entities": {
                "taste": "herbal",
                "texture": "leafy",
                "natural_description": "aromatic Mediterranean herbs"
            },
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        # Verify non-empty array is returned
        assert data["data"]["ingredients"]
        assert len(data["data"]["ingredients"]) > 0


# =============================================================================
# /suggest Endpoint Tests
# =============================================================================

class TestSuggestEndpoint:
    """Test suite for /suggest endpoint."""

    def test_suggest_success(self, mock_recipe_service):
        """Test successful recipe suggestion from ingredients."""
        mock_recipe_service.get_suggestions.return_value = (
            [
                RecipeSuggestion(name="Chicken Stir Fry", ingredients="chicken, rice, garlic, soy sauce"),
                RecipeSuggestion(name="Garlic Chicken Rice", ingredients="chicken, rice, garlic, butter"),
            ],
            "dataset"
        )
        
        response = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {
                "ingredients": ["chicken", "rice", "garlic"]
            },
            "confidence": 0.95
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "suggest"
        assert "recipes" in data["data"]
        assert isinstance(data["data"]["recipes"], list)
        assert len(data["data"]["recipes"]) > 0
        
        # Verify recipe structure
        for recipe in data["data"]["recipes"]:
            assert "name" in recipe
            assert "ingredients" in recipe

    def test_suggest_missing_ingredients(self):
        """Test /suggest fails when ingredients array is missing."""
        response = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {},
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None
        assert "ingredients" in data["error"].lower()

    def test_suggest_gpt_fallback(self, mock_recipe_service):
        """Test GPT fallback triggers when Supabase returns empty results."""
        # First call (Supabase) returns empty, second call (GPT) should be used
        mock_recipe_service.get_suggestions.return_value = (
            [
                RecipeSuggestion(name="Creative Recipe", ingredients="chicken, rice, garlic")
            ],
            "gpt"
        )
        
        response = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {
                "ingredients": ["chicken", "rice", "garlic"],
                "max_results": 3
            },
            "confidence": 1.0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["source"] in ["dataset", "gpt", "dataset+gpt"]
        assert len(data["data"]["recipes"]) > 0


# =============================================================================
# /lookup Endpoint Tests
# =============================================================================

class TestLookupEndpoint:
    """Test suite for /lookup endpoint."""

    def test_lookup_success(self, mock_openai_service):
        """Test successful recipe lookup with full details."""
        mock_openai_service.get_recipe_details.return_value = {
            "name": "Pad Thai",
            "ingredients": ["noodles", "shrimp", "tamarind", "lime", "peanuts"],
            "cooking_method": "1. Heat oil\n2. Fry shrimp\n3. Add noodles\n4. Toss with sauce\n5. Serve with lime"
        }
        
        response = client.post("/lookup", json={
            "classification": "lookup",
            "entities": {
                "recipe": "Pad Thai"
            },
            "confidence": 0.95
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "lookup"
        assert "name" in data["data"]
        assert "ingredients" in data["data"]
        assert "cooking_method" in data["data"]
        assert data["data"]["name"] == "Pad Thai"
        assert isinstance(data["data"]["ingredients"], list)
        assert isinstance(data["data"]["cooking_method"], str)

    def test_lookup_missing_recipe(self):
        """Test /lookup fails when recipe field is missing."""
        response = client.post("/lookup", json={
            "classification": "lookup",
            "entities": {},
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None
        assert "recipe" in data["error"].lower()
        assert data["data"] is None


# =============================================================================
# /rewrite Endpoint Tests
# =============================================================================

class TestRewriteEndpoint:
    """Test suite for /rewrite endpoint."""

    def test_rewrite_success_with_original_ingredients(self, mock_openai_service):
        """Test recipe rewriting with original ingredients provided."""
        mock_openai_service.get_updated_recipe_with_substitution.return_value = {
            "name": "Lasagna",
            "ingredients": ["lentils", "pasta sheets", "tomato sauce", "olive oil"],
            "cooking_method": "1. Layer lentils with pasta\n2. Add sauce\n3. Bake at 375F for 45 min"
        }
        
        response = client.post("/rewrite", json={
            "classification": "rewrite",
            "entities": {
                "recipe": "lasagna",
                "ingredient": "beef",
                "replacement": "lentils",
                "original_ingredients": "beef, pasta sheets, tomato sauce, olive oil"
            },
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "rewrite"
        assert "name" in data["data"]
        assert "ingredients" in data["data"]
        assert "cooking_method" in data["data"]
        assert isinstance(data["data"]["ingredients"], list)

    def test_rewrite_without_original_ingredients(self, mock_openai_service):
        """Test rewrite auto-fetches original ingredients via GPT."""
        # First mock: get_recipe_details for auto-fetch
        mock_openai_service.get_recipe_details.return_value = {
            "ingredients": ["beef", "pasta", "tomato"],
            "cooking_method": "original method"
        }
        
        # Second mock: get_updated_recipe_with_substitution
        mock_openai_service.get_updated_recipe_with_substitution.return_value = {
            "ingredients": ["chicken", "pasta", "tomato"],
            "cooking_method": "updated method"
        }
        
        response = client.post("/rewrite", json={
            "classification": "rewrite",
            "entities": {
                "recipe": "lasagna",
                "ingredient": "beef",
                "replacement": "chicken"
            },
            "confidence": 0.85
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "ingredients" in data["data"]
        # Verify GPT was called to fetch original ingredients
        assert mock_openai_service.get_recipe_details.called

    def test_rewrite_missing_required_fields(self):
        """Test /rewrite fails when required fields are missing."""
        response = client.post("/rewrite", json={
            "classification": "rewrite",
            "entities": {
                "recipe": "lasagna",
                # Missing ingredient and replacement
            },
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None
        assert "recipe" in data["error"].lower() or "ingredient" in data["error"].lower() or "replacement" in data["error"].lower()

    def test_rewrite_response_structure(self, mock_openai_service):
        """Verify data.ingredients and data.cooking_method are present."""
        mock_openai_service.get_updated_recipe_with_substitution.return_value = {
            "ingredients": ["new_ing_1", "new_ing_2"],
            "cooking_method": "step by step"
        }
        
        response = client.post("/rewrite", json={
            "classification": "rewrite",
            "entities": {
                "recipe": "recipe",
                "ingredient": "old",
                "replacement": "new",
                "original_ingredients": "ingredient list"
            },
            "confidence": 0.9
        })
        
        data = response.json()
        assert "ingredients" in data["data"]
        assert "cooking_method" in data["data"]


# =============================================================================
# /similar Endpoint Tests
# =============================================================================

class TestSimilarEndpoint:
    """Test suite for /similar endpoint."""

    def test_similar_success(self, mock_recipe_service):
        """Test successful similar recipe lookup."""
        mock_recipe_service.get_similar_recipes.return_value = [
            RecipeSuggestion(name="Carbonara Variation", ingredients="pasta, eggs, bacon, cheese"),
            RecipeSuggestion(name="Creamy Pasta", ingredients="pasta, cream, bacon, parmesan"),
        ]
        
        response = client.post("/similar", json={
            "classification": "similar",
            "entities": {
                "recipe": "Carbonara"
            },
            "confidence": 0.92
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "similar"
        assert "recipes" in data["data"]
        assert isinstance(data["data"]["recipes"], list)
        assert len(data["data"]["recipes"]) > 0
        
        # Verify each recipe has required fields
        for recipe in data["data"]["recipes"]:
            assert "name" in recipe
            assert "ingredients" in recipe

    def test_similar_source_is_gpt(self, mock_recipe_service):
        """Verify source field is 'gpt' for similar endpoint."""
        mock_recipe_service.get_similar_recipes.return_value = [
            RecipeSuggestion(name="Similar Recipe", ingredients="ingredients")
        ]
        
        response = client.post("/similar", json={
            "classification": "similar",
            "entities": {"recipe": "Carbonara"},
            "confidence": 0.9
        })
        
        data = response.json()
        assert data["source"] == "gpt"


# =============================================================================
# /recipe_custom Endpoint Tests
# =============================================================================

class TestRecipeCustomEndpoint:
    """Test suite for /recipe_custom endpoint."""

    def test_recipe_custom_success(self, mock_recipe_service):
        """Test successful custom recipe generation with substitutes."""
        mock_recipe_service.get_recipe_with_ingredients.return_value = RecipeSuggestion(
            name="Pizza",
            ingredients="dough, pineapple, ham, cheese, sauce"
        )
        
        response = client.post("/recipe_custom", json={
            "classification": "recipe_custom",
            "entities": {
                "recipe": "pizza",
                "substitutes": ["pineapple", "ham"]
            },
            "confidence": 0.88
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["classification"] == "recipe_custom"
        assert "name" in data["data"]
        assert "ingredients" in data["data"]
        assert data["data"]["name"] == "Pizza"

    def test_recipe_custom_missing_recipe(self):
        """Test /recipe_custom fails when recipe is missing."""
        response = client.post("/recipe_custom", json={
            "classification": "recipe_custom",
            "entities": {
                "substitutes": ["pineapple", "ham"]
            },
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None
        assert "recipe" in data["error"].lower()

    def test_recipe_custom_empty_substitutes_array(self):
        """Test /recipe_custom fails when substitutes array is empty."""
        response = client.post("/recipe_custom", json={
            "classification": "recipe_custom",
            "entities": {
                "recipe": "pizza",
                "substitutes": []
            },
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None
        assert "substitutes" in data["error"].lower()


# =============================================================================
# /health Endpoint Tests
# =============================================================================

class TestHealthEndpoint:
    """Test suite for /health endpoint."""

    def test_health_success(self):
        """Test health check returns expected fields."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "openai_available" in data
        assert "supabase_available" in data

    def test_health_boolean_fields(self):
        """Verify health check has boolean availability fields."""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["openai_available"], bool)
        assert isinstance(data["supabase_available"], bool)


# =============================================================================
# Integration Tests
# =============================================================================

class TestIntegration:
    """Integration tests across multiple endpoints."""

    def test_complete_workflow_suggest_then_rewrite(self, mock_recipe_service, mock_openai_service):
        """Test workflow: suggest recipes, then rewrite one."""
        # Step 1: Get suggestions
        mock_recipe_service.get_suggestions.return_value = (
            [RecipeSuggestion(name="Beef Stew", ingredients="beef, carrots, potatoes")],
            "dataset"
        )
        
        response1 = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {"ingredients": ["beef", "carrots"]},
            "confidence": 0.9
        })
        
        assert response1.status_code == 200
        assert len(response1.json()["data"]["recipes"]) > 0
        
        # Step 2: Rewrite the suggested recipe
        mock_openai_service.get_updated_recipe_with_substitution.return_value = {
            "ingredients": ["chicken", "carrots", "potatoes"],
            "cooking_method": "updated method"
        }
        
        response2 = client.post("/rewrite", json={
            "classification": "rewrite",
            "entities": {
                "recipe": "Beef Stew",
                "ingredient": "beef",
                "replacement": "chicken",
                "original_ingredients": "beef, carrots, potatoes"
            },
            "confidence": 0.85
        })
        
        assert response2.status_code == 200
        assert "ingredients" in response2.json()["data"]

    def test_context_then_suggest_workflow(self, mock_ingredient_service, mock_recipe_service):
        """Test workflow: find ingredients by context, then suggest recipes."""
        # Step 1: Get context suggestions
        mock_ingredient_service.get_context_suggestions.return_value = SuggestionResult(
            items=["cilantro", "lime", "jalapeño"],
            source="dataset"
        )
        
        response1 = client.post("/context", json={
            "classification": "context",
            "entities": {"taste": "sour", "color": "green"},
            "confidence": 0.9
        })
        
        assert response1.status_code == 200
        suggested_ingredients = response1.json()["data"]["ingredients"]
        
        # Step 2: Suggest recipes using the found ingredients
        mock_recipe_service.get_suggestions.return_value = (
            [RecipeSuggestion(name="Salsa", ingredients="tomato, cilantro, lime")],
            "dataset"
        )
        
        response2 = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {"ingredients": suggested_ingredients},
            "confidence": 0.85
        })
        
        assert response2.status_code == 200
        assert len(response2.json()["data"]["recipes"]) > 0


# =============================================================================
# Edge Case Tests
# =============================================================================

class TestEdgeCases:
    """Test edge cases and error conditions."""

    def test_empty_entity_dict(self):
        """Test endpoint with empty entities dict."""
        response = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {},
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None

    def test_null_values_in_entities(self, mock_ingredient_service):
        """Test endpoint with null values in entities."""
        response = client.post("/substitute", json={
            "classification": "substitute",
            "entities": {
                "ingredient": None,
                "recipe": "cake"
            },
            "confidence": 0.9
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["error"] is not None

    def test_very_high_confidence(self, mock_recipe_service):
        """Test endpoint with confidence value at boundary."""
        mock_recipe_service.get_suggestions.return_value = (
            [RecipeSuggestion(name="Recipe", ingredients="ing1, ing2")],
            "dataset"
        )
        
        response = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {"ingredients": ["ing1"]},
            "confidence": 1.0
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["confidence"] == 1.0

    def test_zero_confidence(self, mock_recipe_service):
        """Test endpoint with zero confidence."""
        mock_recipe_service.get_suggestions.return_value = (
            [RecipeSuggestion(name="Recipe", ingredients="ing1, ing2")],
            "dataset"
        )
        
        response = client.post("/suggest", json={
            "classification": "suggest",
            "entities": {"ingredients": ["ing1"]},
            "confidence": 0.0
        })
        
        assert response.status_code == 200
        assert response.json()["confidence"] == 0.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

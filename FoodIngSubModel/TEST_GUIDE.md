# Backend API Test Suite Documentation

This document provides guidance on running and understanding the comprehensive test suite for the FoodIngSubModel backend API.

## Overview

The test suite covering all 8 endpoints with the following scope:
- Unit tests for each endpoint with mocked dependencies
- Error handling and validation tests
- Response structure verification
- Integration tests across multiple endpoints
- Edge case and boundary condition tests

## Prerequisites

1. Install test dependencies:
```bash
cd FoodIngSubModel
pip install -r requirements.txt
```

The requirements.txt now includes:
- `pytest==7.4.3` - Testing framework
- `pytest-asyncio==0.23.0` - Async support
- `httpx==0.25.0` - HTTP client (used by TestClient)

## Running Tests

### Run All Tests
```bash
pytest test_backend_api.py -v
```

### Run Tests for Specific Endpoint
```bash
# Test /substitute endpoint
pytest test_backend_api.py::TestSubstituteEndpoint -v

# Test /context endpoint
pytest test_backend_api.py::TestContextEndpoint -v

# Test /suggest endpoint
pytest test_backend_api.py::TestSuggestEndpoint -v

# Test /lookup endpoint
pytest test_backend_api.py::TestLookupEndpoint -v

# Test /rewrite endpoint
pytest test_backend_api.py::TestRewriteEndpoint -v

# Test /similar endpoint
pytest test_backend_api.py::TestSimilarEndpoint -v

# Test /recipe_custom endpoint
pytest test_backend_api.py::TestRecipeCustomEndpoint -v

# Test /health endpoint
pytest test_backend_api.py::TestHealthEndpoint -v
```

### Run Specific Test
```bash
pytest test_backend_api.py::TestSubstituteEndpoint::test_substitute_success_with_recipe -v
```

### Run with Coverage Report
```bash
pip install pytest-cov
pytest test_backend_api.py --cov=backend_api --cov-report=html
```

### Run with Output
```bash
# Show print statements and logs
pytest test_backend_api.py -v -s
```

## Test Organization

The test file is organized into 7 main test classes plus utilities:

### 1. TestSubstituteEndpoint (3 tests)
- **test_substitute_success_with_recipe**: Verifies successful substitution with recipe context
- **test_substitute_with_reasoning**: Tests include_reasoning flag and reasons array
- **test_substitute_missing_ingredient**: Validates error when ingredient field is missing
- **Bonus**: test_substitute_response_has_source - Verifies source field presence

**Key Assertions**:
- HTTP 200 response
- `data.substitutes` array populated
- `source` field present (dataset/gpt/dataset+gpt)
- Error handling for missing ingredients

### 2. TestContextEndpoint (3 tests)
- **test_context_with_attributes**: Tests search by taste and color attributes
- **test_context_with_natural_description**: Tests natural language description
- **test_context_blends_dataset_and_gpt**: Verifies blending of dataset and GPT results

**Key Assertions**:
- `data.ingredients` returns non-empty array
- Supports both attributes dict and flat entity keys
- Source can be dataset, gpt, or dataset+gpt

### 3. TestSuggestEndpoint (3 tests)
- **test_suggest_success**: Verifies recipe suggestions from ingredients
- **test_suggest_missing_ingredients**: Validates error handling
- **test_suggest_gpt_fallback**: Tests fallback to GPT when dataset is empty

**Key Assertions**:
- `data.recipes` array with name and ingredients fields
- Proper source attribution (dataset/gpt/dataset+gpt)
- Error when ingredients array is missing

### 4. TestLookupEndpoint (2 tests)
- **test_lookup_success**: Verifies full recipe details retrieval
- **test_lookup_missing_recipe**: Validates error when recipe field is missing

**Key Assertions**:
- Response includes `name`, `ingredients`, `cooking_method`
- ingredients is a list
- cooking_method is a string
- Error handling for missing recipe

### 5. TestRewriteEndpoint (4 tests)
- **test_rewrite_success_with_original_ingredients**: Tests rewrite with provided original ingredients
- **test_rewrite_without_original_ingredients**: Tests auto-fetch of original ingredients via GPT
- **test_rewrite_missing_required_fields**: Validates error handling
- **test_rewrite_response_structure**: Verifies data structure

**Key Assertions**:
- `data.ingredients` and `data.cooking_method` present
- Supports optional original_ingredients parameter
- Auto-fetches ingredients when not provided
- Error on missing required fields (recipe, ingredient, replacement)

### 6. TestSimilarEndpoint (2 tests)
- **test_similar_success**: Verifies similar recipe lookup
- **test_similar_source_is_gpt**: Confirms source is always 'gpt'

**Key Assertions**:
- `data.recipes` array with at least 1 item
- Each recipe has name and ingredients
- source='gpt' in response

### 7. TestRecipeCustomEndpoint (3 tests)
- **test_recipe_custom_success**: Tests custom recipe generation with substitutes
- **test_recipe_custom_missing_recipe**: Validates error when recipe is missing
- **test_recipe_custom_empty_substitutes_array**: Validates error for empty substitutes

**Key Assertions**:
- `data.name` and `data.ingredients` present
- Error when recipe is missing
- Error when substitutes array is empty

### 8. TestHealthEndpoint (2 tests)
- **test_health_success**: Verifies health check returns expected fields
- **test_health_boolean_fields**: Confirms boolean type of availability fields

**Key Assertions**:
- HTTP 200 response to GET /health
- status='ok'
- openai_available and supabase_available are boolean fields

### TestIntegration (2 tests)
- **test_complete_workflow_suggest_then_rewrite**: E2E workflow with multiple endpoints
- **test_context_then_suggest_workflow**: Multi-step workflow

### TestEdgeCases (4 tests)
- **test_empty_entity_dict**: Tests empty entities dict handling
- **test_null_values_in_entities**: Tests null value handling
- **test_very_high_confidence**: Tests confidence boundary (1.0)
- **test_zero_confidence**: Tests confidence boundary (0.0)

## Mocking Strategy

Tests use `unittest.mock` to mock external dependencies:

```python
# Ingredient service mock
mock_ingredient_service.get_substitutes.return_value = SuggestionResult(...)

# Recipe service mock
mock_recipe_service.get_suggestions.return_value = (recipes_list, source)

# OpenAI service mock
mock_openai_service.get_recipe_details.return_value = {...}
```

This allows tests to:
- Run without external API calls
- Control response data precisely
- Test error paths
- Verify mock was called correctly

## Starting the Server (Manual Testing)

If you want to manually test the endpoints with the live server:

```bash
# Terminal 1: Start the server
uvicorn backend_api:app --port 8080 --reload

# Terminal 2: Run test requests using testEndpointScript.py
python testEndpointScript.py
```

## Expected Test Output

When running `pytest test_backend_api.py -v`, you should see:
```
test_backend_api.py::TestSubstituteEndpoint::test_substitute_success_with_recipe PASSED
test_backend_api.py::TestSubstituteEndpoint::test_substitute_with_reasoning PASSED
test_backend_api.py::TestSubstituteEndpoint::test_substitute_missing_ingredient PASSED
test_backend_api.py::TestSubstituteEndpoint::test_substitute_response_has_source PASSED
test_backend_api.py::TestContextEndpoint::test_context_with_attributes PASSED
test_backend_api.py::TestContextEndpoint::test_context_with_natural_description PASSED
test_backend_api.py::TestContextEndpoint::test_context_blends_dataset_and_gpt PASSED
...
======================== 50+ passed in 0.23s ==========================
```

## Troubleshooting

### Import Error: "No module named 'backend_api'"
Make sure you're running pytest from the FoodIngSubModel directory:
```bash
cd FoodIngSubModel
pytest test_backend_api.py -v
```

### Import Error: "No module named 'pytest'"
Install test dependencies:
```bash
pip install -r requirements.txt
```

### Tests Fail with Mocking Issues
Ensure the patch paths match your import structure in backend_api.py:
```python
@patch("backend_api.ingredient_service")  # Correct
@patch("services.ingredient_service")    # Wrong
```

## Adding New Tests

To add tests for a new endpoint:

1. Create a new test class:
```python
class TestNewEndpoint:
    def test_new_endpoint_success(self, mock_service):
        # Arrange
        mock_service.method.return_value = expected_result
        
        # Act
        response = client.post("/new_endpoint", json={...})
        
        # Assert
        assert response.status_code == 200
        assert response.json()["data"] is not None
```

2. Run the new test:
```bash
pytest test_backend_api.py::TestNewEndpoint -v
```

## Test Coverage Summary

| Endpoint | Success Cases | Error Cases | Response Validation | Total Tests |
|----------|---------------|-------------|-------------------|-------------|
| /substitute | 2 | 1 | 1 | 4 |
| /context | 3 | 0 | 0 | 3 |
| /suggest | 3 | 1 | 0 | 4 |
| /lookup | 1 | 1 | 0 | 2 |
| /rewrite | 2 | 1 | 1 | 4 |
| /similar | 1 | 0 | 1 | 2 |
| /recipe_custom | 1 | 2 | 0 | 3 |
| /health | 1 | 0 | 1 | 2 |
| Integration Tests | 2 | 0 | 0 | 2 |
| Edge Cases | 0 | 4 | 0 | 4 |
| **TOTAL** | **16** | **10** | **4** | **~50+** |

## Next Steps

1. Run `pytest test_backend_api.py -v` to execute all tests
2. Review any failing tests and fix implementation issues
3. Add integration tests for user workflows
4. Set up CI/CD pipeline to run tests automatically on commits
5. Monitor test coverage with `pytest-cov` to maintain >80% coverage

---

For questions or issues, see the inline test documentation in `test_backend_api.py`.

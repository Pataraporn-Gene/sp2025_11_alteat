#!/bin/bash
# Quick reference: pytest commands for each endpoint

# All tests
echo "Running all backend API tests..."
pytest test_backend_api.py -v

# Task 1: /substitute endpoint
echo -e "\n\n=== Running /substitute tests ==="
pytest test_backend_api.py::TestSubstituteEndpoint -v

# Task 2: /context endpoint  
echo -e "\n\n=== Running /context tests ==="
pytest test_backend_api.py::TestContextEndpoint -v

# Task 3: /suggest endpoint
echo -e "\n\n=== Running /suggest tests ==="
pytest test_backend_api.py::TestSuggestEndpoint -v

# Task 4: /lookup endpoint
echo -e "\n\n=== Running /lookup tests ==="
pytest test_backend_api.py::TestLookupEndpoint -v

# Task 5: /rewrite endpoint
echo -e "\n\n=== Running /rewrite tests ==="
pytest test_backend_api.py::TestRewriteEndpoint -v

# Task 6: /similar endpoint
echo -e "\n\n=== Running /similar tests ==="
pytest test_backend_api.py::TestSimilarEndpoint -v

# Task 7: /recipe_custom endpoint
echo -e "\n\n=== Running /recipe_custom tests ==="
pytest test_backend_api.py::TestRecipeCustomEndpoint -v

# Task 8: /health endpoint
echo -e "\n\n=== Running /health tests ==="
pytest test_backend_api.py::TestHealthEndpoint -v

# Additional test suites
echo -e "\n\n=== Running integration tests ==="
pytest test_backend_api.py::TestIntegration -v

echo -e "\n\n=== Running edge case tests ==="
pytest test_backend_api.py::TestEdgeCases -v

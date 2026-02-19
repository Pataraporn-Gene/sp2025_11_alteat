import requests
import json

BASE_URL = "http://127.0.0.1:8080"

def test_endpoint(path, payload):
    print(f"--- Testing {path} ---")
    try:
        response = requests.post(f"{BASE_URL}{path}", json=payload)
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"Error: {e}")
    print("\n")

# 1. Substitute Test (Ingredient replacement with reasoning)
test_endpoint("/substitute", {
    "classification": "substitute",
    "entities": {
        "ingredient": "heavy cream",
        "recipe": "Pasta Carbonara",
        "include_reasoning": True
    },
    "confidence": 0.99
})

# 2. Context Test (Search by attributes)
test_endpoint("/context", {
    "classification": "context",
    "entities": {
        "taste": "sour",
        "cooking_method": "boil"
    },
    "confidence": 0.95
})

# 3. Suggest Test (Recipes from specific ingredients)
test_endpoint("/suggest", {
    "classification": "suggest",
    "entities": {
        "ingredients": ["pork", "basil", "garlic"],
        "max_results": 3
    },
    "confidence": 1.0
})

# 4. Lookup Test (Step-by-step instructions)
test_endpoint("/lookup", {
    "classification": "lookup",
    "entities": {
        "recipe": "Pad Gaprao"
    },
    "confidence": 1.0
})

# 5. Rewrite Test (Swapping one specific ingredient)
test_endpoint("/rewrite", {
    "classification": "rewrite",
    "entities": {
        "recipe": "Beef Stew",
        "ingredient": "beef",
        "replacement": "tofu"
    },
    "confidence": 0.98
})

# 6. Health Check (GET request)
print("--- Testing /health ---")
print(requests.get(f"{BASE_URL}/health").json())
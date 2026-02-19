#!/usr/bin/env python3
"""
Data Models for Recipe Suggestion System

Contains all data classes and model definitions used throughout the system.
"""

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class IngredientEntry:
    """Represents an ingredient with its properties."""
    canonical_name: str
    other_names: List[str]
    flavors: List[str]
    textures: List[str]
    colors: List[str]
    cook_methods: List[str]


@dataclass
class RecipeSuggestion:
    """Represents a recipe suggestion with ingredients."""
    name: str
    ingredients: str
    id: Optional[int] = None
    image: Optional[str] = None


@dataclass
class SuggestionResult:
    """Container for suggestion results with metadata."""
    items: List[str]
    source: str  # "dataset", "gpt", "dataset+gpt", "none"
    reasons: Optional[List[str]] = None

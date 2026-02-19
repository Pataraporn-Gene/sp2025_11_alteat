#!/usr/bin/env python3
"""
Dataset Service for Recipe Suggestion System

Handles ingredient dataset operations and local ingredient data management.
"""

import os
import json
from functools import lru_cache
from typing import List, Optional

from config import Config
from models import IngredientEntry, SuggestionResult
from utils import to_casefold_set, logger


class DatasetService:
    """Handles ingredient dataset operations."""
    
    def __init__(self, config: Config):
        self.config = config
        self._entries = None
    
    @lru_cache(maxsize=1)
    def _load_entries(self) -> List[IngredientEntry]:
        """Load ingredient entries from the dataset."""
        entries = []
        try:
            if not os.path.exists(self.config.dataset_path):
                logger.warning(f"Dataset file not found: {self.config.dataset_path}")
                return entries
            
            with open(self.config.dataset_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            if not isinstance(data, dict):
                logger.error("Invalid dataset format")
                return entries
            
            for category, submap in data.items():
                if not isinstance(submap, dict):
                    continue
                
                for name, props in submap.items():
                    if not isinstance(props, dict):
                        continue
                    
                    entries.append(IngredientEntry(
                        canonical_name=str(name).strip(),
                        other_names=[str(n).strip() for n in props.get("hasOtherNames", [])],
                        flavors=[str(v).strip() for v in props.get("hasFlavor", [])],
                        textures=[str(v).strip() for v in props.get("hasTexture", [])],
                        colors=[str(v).strip() for v in props.get("hasColor", [])],
                        cook_methods=[str(v).strip() for v in props.get("canCook", [])]
                    ))
            
            logger.info(f"Loaded {len(entries)} ingredient entries from dataset")
            return entries
            
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            return entries
    
    def get_context_based_ingredients(self, taste: Optional[str] = None,
                                    texture: Optional[str] = None,
                                    color: Optional[str] = None,
                                    cooking_method: Optional[str] = None,
                                    max_results: int = 10) -> SuggestionResult:
        """Get ingredients from dataset based on context."""
        entries = self._load_entries()
        if not entries:
            return SuggestionResult([], "none")
        
        # Normalize query parameters
        taste_q = taste.strip().casefold() if taste else None
        texture_q = texture.strip().casefold() if texture else None
        color_q = color.strip().casefold() if color else None
        method_q = cooking_method.strip().casefold() if cooking_method else None
        
        scored = []
        seen = set()
        
        for entry in entries:
            score = 0
            if taste_q and taste_q in to_casefold_set(entry.flavors):
                score += 1
            if texture_q and texture_q in to_casefold_set(entry.textures):
                score += 1
            if color_q and color_q in to_casefold_set(entry.colors):
                score += 1
            if method_q and method_q in to_casefold_set(entry.cook_methods):
                score += 1
            
            if score == 0:
                continue
            
            name = entry.canonical_name.strip()
            if name and name not in seen:
                scored.append((score, name))
                seen.add(name)
        
        # Sort by score (desc) then name (asc) for stability
        scored.sort(key=lambda t: (-t[0], t[1]))
        items = [name for _, name in scored[:max_results]]
        
        return SuggestionResult(items, "dataset" if items else "none")

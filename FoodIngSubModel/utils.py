#!/usr/bin/env python3
"""
Utility Functions for Recipe Suggestion System

Common utility functions used throughout the application.
"""

import re
import logging
from typing import List, Any


# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def normalize_text(text: str) -> str:
    """Normalize text for comparison purposes."""
    return re.sub(r"\s+", " ", (text or "").strip()).lower()


def to_casefold_set(values: Any) -> List[str]:
    """Convert various value types to a normalized string list."""
    if not values:
        return []
    if isinstance(values, list):
        return [str(v).strip().casefold() for v in values if str(v).strip()]
    return [str(values).strip().casefold()]


def parse_numbered_list(text: str) -> List[str]:
    """Parse a numbered or bulleted list from text."""
    lines = [re.sub(r"^\s*\d+\.|^[-•]", "", ln).strip() 
             for ln in text.splitlines() if ln.strip()]
    items = [ln for ln in lines if ln]
    if not items:
        # Fallback to comma-separated
        items = [p.strip() for p in text.split(",") if p.strip()]
    return items

"""Utility functions for HTML normalization and processing."""
import re
import hashlib
from typing import Tuple


def normalize_html(html: str) -> str:
    """
    Normalize HTML to reduce false positives in change detection.

    Removes:
    - Script and style tags
    - HTML comments
    - Dynamic timestamps and dates
    - UUIDs and session IDs
    - Excessive whitespace
    """
    if not html:
        return ""

    # Extract body content only (if present)
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    if body_match:
        html = body_match.group(1)

    # Remove script tags and their content
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove style tags and their content
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove HTML comments
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)

    # Remove common timestamp patterns
    # ISO 8601: 2024-01-15T12:34:56Z
    html = re.sub(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?', 'TIMESTAMP', html)

    # Date patterns: 15.01.2024, 01/15/2024, etc.
    html = re.sub(r'\d{1,2}[./]\d{1,2}[./]\d{2,4}', 'DATE', html)

    # Time patterns: 12:34:56, 12:34
    html = re.sub(r'\d{1,2}:\d{2}(:\d{2})?', 'TIME', html)

    # Remove UUIDs (8-4-4-4-12 format)
    html = re.sub(
        r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
        'UUID',
        html,
        flags=re.IGNORECASE
    )

    # Remove session IDs and tokens (common patterns)
    html = re.sub(r'\b[A-Za-z0-9]{32,}\b', 'TOKEN', html)

    # Remove data-* attributes (often dynamic)
    html = re.sub(r'\s+data-[a-z0-9-]+="[^"]*"', '', html, flags=re.IGNORECASE)

    # Normalize whitespace (collapse multiple spaces/newlines)
    html = re.sub(r'\s+', ' ', html)

    # Trim
    html = html.strip()

    return html


def calculate_hash(content: str) -> str:
    """Calculate SHA-256 hash of content."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()


def extract_body_text(html: str) -> str:
    """Extract visible text from HTML (strip all tags)."""
    # Remove script and style first
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)

    # Remove all HTML tags
    text = re.sub(r'<[^>]+>', '', text)

    # Decode HTML entities
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)

    return text.strip()


def process_html(html: str) -> Tuple[str, str]:
    """
    Process HTML for storage and comparison.

    Returns:
        Tuple of (normalized_html, hash)
    """
    normalized = normalize_html(html)
    html_hash = calculate_hash(normalized)
    return normalized, html_hash

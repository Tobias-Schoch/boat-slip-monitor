"""Utility functions for HTML normalization and processing."""
import re
import hashlib
from typing import Tuple


def clean_html_for_diff(html: str) -> str:
    """
    Clean HTML for diff comparison by removing noise elements.

    Removes:
    - <head> section entirely
    - <style> tags and content
    - <link> tags
    - <script> tags and content
    - CCM19 cookie consent manager elements
    - HTML comments
    - Empty/dynamic attributes
    - Excessive whitespace
    """
    if not html:
        return ""

    # Remove entire <head> section
    html = re.sub(r'<head[^>]*>.*?</head>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove script tags and their content
    html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove style tags and their content
    html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove ALL link tags (stylesheets, preload, prefetch, etc.)
    html = re.sub(r'<link\s[^>]*>', '', html, flags=re.IGNORECASE)
    html = re.sub(r'<link\s*/>', '', html, flags=re.IGNORECASE)
    html = re.sub(r'<link>', '', html, flags=re.IGNORECASE)
    # Also catch malformed/partial link tags
    html = re.sub(r'link\s+rel="[^"]*"[^>]*>', '', html, flags=re.IGNORECASE)

    # Remove noscript tags and their content
    html = re.sub(r'<noscript[^>]*>.*?</noscript>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove CCM19 cookie consent elements - be very aggressive
    # Remove ANY element with ccm anywhere in class, id, or href
    html = re.sub(r'<[^>]*ccm[^>]*>.*?</[^>]+>', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'<[^>]*ccm[^>]*/?\s*>', '', html, flags=re.IGNORECASE)
    # Remove ccm URLs
    html = re.sub(r'https?://[^"\'>\s]*ccm[^"\'>\s]*', '', html, flags=re.IGNORECASE)
    # Remove data-ccm attributes
    html = re.sub(r'\s+data-ccm[a-z0-9-]*="[^"]*"', '', html, flags=re.IGNORECASE)
    # Remove ccm script/config blocks
    html = re.sub(r'CCM19\s*[=:]\s*\{[^}]*\}', '', html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r'window\.CCM19[^;]*;', '', html, flags=re.IGNORECASE)

    # Remove HTML comments
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)

    # Remove meta tags
    html = re.sub(r'<meta[^>]*/?>', '', html, flags=re.IGNORECASE)

    # Remove ALL style attributes (often change dynamically)
    html = re.sub(r'\s+style="[^"]*"', '', html, flags=re.IGNORECASE)

    # Remove ALL class attributes (CSS classes change dynamically)
    html = re.sub(r'\s+class="[^"]*"', '', html, flags=re.IGNORECASE)

    # Remove id attributes (often dynamic)
    html = re.sub(r'\s+id="[^"]*"', '', html, flags=re.IGNORECASE)

    # Remove data-* attributes (often dynamic)
    html = re.sub(r'\s+data-[a-z0-9-]+="[^"]*"', '', html, flags=re.IGNORECASE)

    # Remove other common dynamic attributes
    html = re.sub(r'\s+crossorigin="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+rel="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+aria-[a-z-]+="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+role="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+tabindex="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+onclick="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+onload="[^"]*"', '', html, flags=re.IGNORECASE)
    html = re.sub(r'\s+target="[^"]*"', '', html, flags=re.IGNORECASE)

    # Normalize whitespace (collapse multiple spaces/newlines)
    html = re.sub(r'\s+', ' ', html)

    # Trim
    html = html.strip()

    return html


def normalize_html(html: str) -> str:
    """
    Normalize HTML to reduce false positives in change detection.

    Uses the same aggressive cleaning as clean_html_for_diff, plus
    additional normalization for timestamps/UUIDs.
    """
    if not html:
        return ""

    # First, apply aggressive cleaning to remove noise
    html = clean_html_for_diff(html)

    # Then normalize dynamic content that might still be present

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

    # Normalize whitespace again after replacements
    html = re.sub(r'\s+', ' ', html)
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

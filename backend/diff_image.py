"""Generate diff images that match the web UI style."""
import asyncio
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# HTML template matching the web UI diff style
DIFF_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
            font-size: 14px;
            background: #0f172a;
            padding: 16px;
        }
        .diff-container {
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
        }
        .diff-header {
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8;
            font-size: 12px;
            font-weight: 500;
        }
        .diff-content {
            overflow-x: auto;
        }
        .diff-line {
            display: flex;
            min-height: 28px;
        }
        .line-indicator {
            width: 32px;
            flex-shrink: 0;
            text-align: center;
            padding: 6px 0;
            font-size: 12px;
            font-weight: bold;
            user-select: none;
        }
        .line-content {
            flex: 1;
            padding: 6px 12px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        /* Addition */
        .diff-line.addition {
            background: rgba(34, 197, 94, 0.3);
            border-left: 4px solid #22c55e;
        }
        .diff-line.addition .line-indicator {
            color: #4ade80;
            background: rgba(34, 197, 94, 0.2);
        }
        .diff-line.addition .line-content {
            color: #bbf7d0;
        }
        /* Deletion */
        .diff-line.deletion {
            background: rgba(239, 68, 68, 0.3);
            border-left: 4px solid #ef4444;
        }
        .diff-line.deletion .line-indicator {
            color: #f87171;
            background: rgba(239, 68, 68, 0.2);
        }
        .diff-line.deletion .line-content {
            color: #fecaca;
        }
        /* Context */
        .diff-line.context {
            background: rgba(255, 255, 255, 0.05);
            border-left: 4px solid transparent;
        }
        .diff-line.context .line-indicator {
            color: rgba(148, 163, 184, 0.5);
            background: rgba(255, 255, 255, 0.05);
        }
        .diff-line.context .line-content {
            color: #94a3b8;
        }
        /* Separator */
        .diff-separator {
            display: flex;
            align-items: center;
            padding: 8px 0;
            background: rgba(255, 255, 255, 0.05);
        }
        .diff-separator .line {
            flex: 1;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
        }
        .diff-separator .text {
            padding: 0 12px;
            color: #64748b;
            font-size: 12px;
        }
        /* Title bar */
        .title-bar {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1));
            border: 2px solid rgba(239, 68, 68, 0.5);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .title-bar.critical {
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.1));
            border-color: rgba(239, 68, 68, 0.5);
        }
        .title-bar.important {
            background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.1));
            border-color: rgba(245, 158, 11, 0.4);
        }
        .title-bar.info {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05));
            border-color: rgba(59, 130, 246, 0.3);
        }
        .title-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        .title-bar.critical .title-icon {
            background: rgba(239, 68, 68, 0.2);
        }
        .title-bar.important .title-icon {
            background: rgba(245, 158, 11, 0.2);
        }
        .title-bar.info .title-icon {
            background: rgba(59, 130, 246, 0.2);
        }
        .title-text h1 {
            color: #f8fafc;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .title-text p {
            color: #94a3b8;
            font-size: 13px;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .badge {
            margin-left: auto;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: bold;
            font-family: system-ui, -apple-system, sans-serif;
        }
        .title-bar.critical .badge {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        .title-bar.important .badge {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }
        .title-bar.info .badge {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
        }
    </style>
</head>
<body>
    {title_bar}
    <div class="diff-container">
        <div class="diff-header">Änderungen</div>
        <div class="diff-content">
            {diff_lines}
        </div>
    </div>
</body>
</html>
"""

PRIORITY_ICONS = {
    'CRITICAL': '🚨',
    'IMPORTANT': '⚠️',
    'INFO': 'ℹ️'
}


def _generate_diff_html(
    diff_text: str,
    url_name: str,
    description: str,
    priority: str
) -> str:
    """Generate HTML for the diff image."""
    lines_html = []

    for line in diff_text.split('\n'):
        if not line.strip():
            continue

        if line == '···':
            # Separator between hunks
            lines_html.append('''
                <div class="diff-separator">
                    <div class="line"></div>
                    <span class="text">···</span>
                    <div class="line"></div>
                </div>
            ''')
            continue

        is_addition = line.startswith('+ ')
        is_deletion = line.startswith('- ')
        is_context = line.startswith('  ')

        if is_addition:
            line_class = 'addition'
            indicator = '+'
            content = line[2:]
        elif is_deletion:
            line_class = 'deletion'
            indicator = '−'
            content = line[2:]
        elif is_context:
            line_class = 'context'
            indicator = ' '
            content = line[2:]
        else:
            line_class = 'context'
            indicator = ' '
            content = line

        # Escape HTML
        content = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

        lines_html.append(f'''
            <div class="diff-line {line_class}">
                <div class="line-indicator">{indicator}</div>
                <div class="line-content">{content}</div>
            </div>
        ''')

    # Generate title bar
    priority_lower = priority.lower()
    icon = PRIORITY_ICONS.get(priority, 'ℹ️')

    title_bar = f'''
        <div class="title-bar {priority_lower}">
            <div class="title-icon">{icon}</div>
            <div class="title-text">
                <h1>{url_name}</h1>
                <p>{description}</p>
            </div>
            <div class="badge">{priority}</div>
        </div>
    '''

    return DIFF_HTML_TEMPLATE.format(
        title_bar=title_bar,
        diff_lines='\n'.join(lines_html)
    )


def _convert_html_diff_to_plain(html_diff: str) -> str:
    """Convert HTML diff to plain text diff format."""
    import re
    from html import unescape

    lines = []

    # Split by lines and process each
    for line in html_diff.split('\n'):
        line = line.strip()
        if not line:
            continue

        # Remove HTML tags but preserve the text
        text = re.sub(r'<[^>]+>', '', line)
        text = unescape(text).strip()

        if not text:
            continue

        # Check for "removed" or "deleted" class in original HTML
        if 'class="removed"' in line or 'class="deletion"' in line:
            lines.append(f'- {text}')
        # Check for "added" or "addition" class
        elif 'class="added"' in line or 'class="addition"' in line:
            lines.append(f'+ {text}')
        # Regular context line
        else:
            lines.append(f'  {text}')

    return '\n'.join(lines)


async def generate_diff_image(
    diff_text: str,
    url_name: str,
    description: str,
    priority: str,
    output_path: Optional[Path] = None
) -> bytes:
    """
    Generate a diff image matching the web UI style.

    Args:
        diff_text: The diff text (HTML or plain text with +/- prefixes)
        url_name: Name of the monitored URL
        description: Change description
        priority: Priority level (CRITICAL, IMPORTANT, INFO)
        output_path: Optional path to save the image

    Returns:
        PNG image bytes
    """
    from playwright.async_api import async_playwright

    # Convert HTML diff to plain text if needed
    if '<' in diff_text and '>' in diff_text:
        diff_text = _convert_html_diff_to_plain(diff_text)

    html = _generate_diff_html(diff_text, url_name, description, priority)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={'width': 800, 'height': 600},
            device_scale_factor=2  # Retina quality
        )

        await page.set_content(html)

        # Wait for fonts to load
        await page.wait_for_timeout(100)

        # Get the actual content size
        body = await page.query_selector('body')
        box = await body.bounding_box()

        # Take screenshot of just the content
        screenshot_bytes = await page.screenshot(
            clip={
                'x': 0,
                'y': 0,
                'width': box['width'] + 32,  # Add padding
                'height': box['height'] + 32
            },
            type='png'
        )

        await browser.close()

    if output_path:
        output_path.write_bytes(screenshot_bytes)
        logger.info(f"Diff image saved to {output_path}")

    return screenshot_bytes

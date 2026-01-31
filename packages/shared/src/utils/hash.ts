import crypto from 'crypto';

export function hashContent(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex');
}

export function normalizeHtml(html: string): string {
  // Remove dynamic content that changes frequently
  let normalized = html;

  // Remove timestamps
  normalized = normalized.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?/g, '');
  normalized = normalized.replace(/\d{2}\.\d{2}\.\d{4}/g, '');
  normalized = normalized.replace(/\d{1,2}:\d{2}(:\d{2})?/g, '');

  // Remove session IDs and tokens
  normalized = normalized.replace(/sessionid=[a-zA-Z0-9]+/gi, '');
  normalized = normalized.replace(/csrf[_-]?token=[a-zA-Z0-9]+/gi, '');
  normalized = normalized.replace(/token=[a-zA-Z0-9]+/gi, '');

  // Remove cookie consent banners and tracking scripts
  normalized = normalized.replace(/<div[^>]*class="[^"]*cookie[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  normalized = normalized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  normalized = normalized.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove comments
  normalized = normalized.replace(/<!--[\s\S]*?-->/g, '');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

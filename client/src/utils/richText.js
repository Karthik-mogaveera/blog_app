/**
 * Utility functions for rendering and sanitizing rich text blog content.
 */

// Allowed HTML tags for blog formatting
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'mark',
  'ul', 'ol', 'li',
  'a',
  'blockquote', 'code', 'pre',
  'span', 'div',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);

/**
 * Validates a hyperlink URL to prevent XSS (e.g. javascript: schemes).
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;
  
  // Disallow javascript:, data:, vbscript: protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return false;
  }
  
  // Allow relative URLs starting with / or #
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return true;
  }
  
  // Allow mailto: and tel:
  if (/^(mailto|tel):/i.test(trimmed)) {
    return true;
  }

  // Allow standard protocols (http://, https://)
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (e) {
    // Also allow clean domains like www.example.com
    if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) {
      return true;
    }
    return false;
  }
}

/**
 * Normalizes a URL for safe embedding (e.g. prepending https:// if needed).
 */
export function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || /^(http:\/\/|https:\/\/|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Cleans and sanitizes rich HTML content, removing scripts and malicious handlers.
 */
export function sanitizeRichHtml(html) {
  if (!html || typeof html !== 'string') return '';

  // 1. Remove dangerous elements completely
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 2. Remove inline event handlers (onload, onerror, onclick, etc.)
  clean = clean.replace(/\s+on\w+="[^"]*"/gi, '');
  clean = clean.replace(/\s+on\w+='[^']*'/gi, '');
  clean = clean.replace(/\s+on\w+=[^\s>]+/gi, '');

  // 3. Remove javascript: links
  clean = clean.replace(/href=["']\s*javascript:[^"']*["']/gi, 'href="#"');

  // 4. Ensure target="_blank" and rel="noopener noreferrer" on all <a> tags
  clean = clean.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    let newAttrs = attrs;
    if (!/target=/i.test(newAttrs)) {
      newAttrs += ' target="_blank"';
    }
    if (!/rel=/i.test(newAttrs)) {
      newAttrs += ' rel="noopener noreferrer"';
    }
    return `<a${newAttrs}>`;
  });

  return clean;
}

/**
 * Renders blog content:
 * - If rich HTML: sanitizes and returns formatted HTML
 * - If legacy plaintext: wraps paragraphs in <p> and breaks in <br>
 */
export function renderRichContent(content) {
  if (!content) return '';
  const trimmed = content.trim();

  // Check if string contains HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(trimmed);

  if (hasHtml) {
    return sanitizeRichHtml(trimmed);
  }

  // Legacy plaintext formatting: convert newlines to paragraphs & breaks
  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return paragraphs || `<p>${trimmed}</p>`;
}

/**
 * Checks if content is truly empty (e.g. empty string, whitespace only, or empty HTML tags like <p><br></p>)
 */
export function isContentEmpty(content) {
  if (!content || typeof content !== 'string') return true;
  const stripped = content
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return stripped.length === 0;
}

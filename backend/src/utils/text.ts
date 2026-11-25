const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for safe use inside HTML (emails). */
export const escapeHtml = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

/** Trims and removes control characters (keeps line breaks) from free text input. */
export const cleanText = (value: string): string =>
  // eslint-disable-next-line no-control-regex
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

/** Single-line variant: also collapses line breaks and repeated spaces. */
export const cleanLine = (value: string): string => cleanText(value).replace(/\s+/g, ' ');

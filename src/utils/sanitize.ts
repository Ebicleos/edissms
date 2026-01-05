/**
 * HTML escape utility to prevent XSS attacks when rendering user data in HTML strings.
 * Use this function for all user-controlled data that will be inserted into HTML.
 */
export const escapeHtml = (unsafe: string | null | undefined): string => {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

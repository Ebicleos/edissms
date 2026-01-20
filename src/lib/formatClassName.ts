/**
 * Formats a class_id into a human-readable class name.
 * Handles formats like "jss1", "sss2", "primary3", or UUIDs (returns as-is).
 * 
 * @param classId - The class ID to format (e.g., "jss1", "primary3", or UUID)
 * @returns Formatted class name (e.g., "JSS 1", "Primary 3")
 */
export function formatClassName(classId: string | null | undefined): string {
  if (!classId) return 'N/A';
  
  // Handle common patterns like "jss1", "sss2", "primary3"
  const match = classId.match(/^(jss|sss|primary)(\d+)$/i);
  if (match) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    if (prefix === 'PRIMARY') return `Primary ${num}`;
    return `${prefix} ${num}`;
  }
  
  // Check if it looks like a UUID (common pattern: 8-4-4-4-12 hex chars)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(classId)) {
    return classId; // Return UUID as-is (should be looked up)
  }
  
  // Return capitalized version for any other format
  return classId.charAt(0).toUpperCase() + classId.slice(1);
}

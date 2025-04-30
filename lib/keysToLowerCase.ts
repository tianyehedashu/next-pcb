/**
 * Recursively convert all object keys to lower case.
 * Supports nested objects and arrays.
 */
export function keysToLowerCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(keysToLowerCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k.toLowerCase(), keysToLowerCase(v)])
    );
  }
  return obj;
} 
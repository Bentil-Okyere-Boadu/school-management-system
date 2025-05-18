const SENSITIVE_FIELDS = [
  'password',
  'invitationToken',
  'invitationExpires',
  'resetPasswordToken',
  'resetPasswordExpires',
];

/**
 * Recursively sanitize data by removing sensitive fields from objects and arrays.
 * @param data Any data structure (object, array, primitive)
 * @returns Sanitized data
 */
export function sanitize<T>(data: T): any {
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  if (data !== null && typeof data === 'object') {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        continue;
      }

      sanitized[key] = typeof value === 'object' ? sanitize(value) : value;
    }

    return sanitized;
  }

  return data;
}

/**
 * Sanitize an array of objects by removing sensitive fields recursively
 */
export const sanitizeMany = <T>(arr: T[]): T[] => arr.map(sanitize);

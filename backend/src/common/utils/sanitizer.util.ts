const SENSITIVE_FIELDS = [
  'password',
  'invitationToken',
  'invitationExpires',
  'resetPasswordToken',
  'resetPasswordExpires',
];

export function sanitize<T>(data: T): any {
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  if (data instanceof Date) {
    return data;
  }

  if (data !== null && typeof data === 'object') {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_FIELDS.includes(key)) {
        continue;
      }

      sanitized[key] = sanitize(value);
    }

    return sanitized;
  }

  return data;
}

export const sanitizeMany = <T>(arr: T[]): T[] => arr.map(sanitize);

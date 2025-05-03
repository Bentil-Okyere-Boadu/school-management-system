const SENSITIVE_FIELDS = [
  'password',
  'invitationToken',
  'invitationExpires',
  'resetPasswordToken',
  'resetPasswordExpires',
];

/**
 * Sanitize a single object by removing sensitive fields
 * @param data Object to sanitize
 * @returns Sanitized object with sensitive fields removed
 */
export function sanitize<T>(data: T): Partial<T> {
  if (!data) {
    return data;
  }

  const sanitized = { ...data } as any;

  // Remove all sensitive fields
  SENSITIVE_FIELDS.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Sanitize an array of objects by removing sensitive fields
 * @param dataArray Array of objects to sanitize
 * @returns Array of sanitized objects
 */
export function sanitizeMany<T>(dataArray: T[]): Partial<T>[] {
  if (!dataArray || !Array.isArray(dataArray)) {
    return dataArray;
  }

  return dataArray.map((item) => sanitize(item));
}

/**
 * Class decorator that automatically sanitizes response data from controller methods
 * Can be applied to a controller class to sanitize all responses
 */
export function SanitizeResponse() {
  return function (constructor: any) {
    const methods = Object.getOwnPropertyNames(constructor.prototype);

    methods.forEach((methodName) => {
      if (methodName !== 'constructor') {
        const originalMethod = constructor.prototype[methodName];

        constructor.prototype[methodName] = async function (...args: any[]) {
          const result = await originalMethod.apply(this, args);

          if (Array.isArray(result)) {
            return sanitizeMany(result);
          }

          return sanitize(result);
        };
      }
    });

    return constructor;
  };
}

/**
 * Method decorator to sanitize response data from a specific controller method
 */
export function SanitizeMethod() {
  return function (descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      if (Array.isArray(result)) {
        return sanitizeMany(result);
      }

      return sanitize(result);
    };

    return descriptor;
  };
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { sanitize, sanitizeMany } from '../utils/sanitizer.util';

interface Response<T> {
  data?: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    [key: string]: any;
  };
  [key: string]: any;
}

@Injectable()
export class DeepSanitizeResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data: unknown): unknown => {
        if (!data) {
          return data;
        }

        // Handle specifically the structure with {data: [...], meta: {...}}
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          const response = data as Response<unknown>;
          if (response.data && Array.isArray(response.data)) {
            return {
              ...response,
              data: sanitizeMany(response.data),
            };
          }
        }

        // Handle array
        if (Array.isArray(data)) {
          return sanitizeMany(data);
        }

        // Handle object
        if (typeof data === 'object') {
          return sanitize(data);
        }

        return data;
      }),
    );
  }
} 
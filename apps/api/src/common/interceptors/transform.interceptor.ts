import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseBody) => {
        if (!responseBody || typeof responseBody !== 'object') {
          return { data: responseBody };
        }

        if (responseBody?.data !== undefined && responseBody?.meta !== undefined) {
          return responseBody;
        }

        if (responseBody?.results !== undefined && responseBody?.total !== undefined) {
          return {
            data: responseBody.results,
            meta: {
              total: responseBody.total,
              page: responseBody.page,
              limit: responseBody.limit,
              totalPages: responseBody.totalPages,
            },
          };
        }

        return { data: responseBody };
      }),
    );
  }
}

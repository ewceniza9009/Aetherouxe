import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messages: string[] = ['Internal server error'];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        messages = [res];
      } else if (typeof res === 'object') {
        const body = res as ErrorBody;
        messages = Array.isArray(body.message)
          ? body.message
          : [body.message || body.error || 'Unknown error'];
      }
    }

    response.status(status).json({
      statusCode: status,
      message: messages.join(', '),
      timestamp: new Date().toISOString(),
    });
    if (status >= 500 || !(exception instanceof HttpException)) {
      console.error('[http-exception]', (exception as any)?.message, (exception as any)?.stack);
    }
  }
}

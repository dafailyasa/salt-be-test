import {
  ExceptionFilter,
  HttpException,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception.getStatus();

    console.error(JSON.stringify(exception));
    response.status(status).json({
      path: request.url,
      error: exception.message,
    });
  }
}

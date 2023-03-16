import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { LogLevel } from '@nestjs/common';

async function bootstrap() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const logLevels: LogLevel[] = isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'verbose', 'debug'];

    const app = await NestFactory.create(AppModule, {
      logger: logLevels,
    });
    app.useGlobalInterceptors(new LoggerInterceptor());
    app.setGlobalPrefix('api');
    await app.listen(process.env.PORT || 3031);
  } catch (err) {
    console.error(`Fatal error cant boot application.`, err.message);
    process.exit(1);
  }
}
bootstrap();

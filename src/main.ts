import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter } from './common/exception/http-exception';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.listen(process.env.PORT || 3031);
  } catch (err) {
    console.error(`Fatal error cant boot application.`, err.message);
    process.exit(1);
  }
}
bootstrap();

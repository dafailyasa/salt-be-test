import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductModel, ProductSchema } from './product.model';
import { CacheModule, Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    MongooseModule.forFeature([
      {
        name: ProductModel.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

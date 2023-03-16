/*
https://docs.nestjs.com/controllers#controllers
*/
import {
  Controller,
  Get,
  Param,
  Res,
  UsePipes,
  ValidationPipe,
  HttpException,
  InternalServerErrorException,
  Post,
  Body,
  Patch,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import {  ProductDto } from './product.dto';
import { ProductService } from './product.service';
import { ObjectId } from 'mongodb';
import { RedisService } from '../redis/redis.service';

@Controller('products')
export class ProductController {
  constructor(
    private redisService: RedisService,
    private readonly productService: ProductService,
  ) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('')
  async createProduct(@Body() body: ProductDto, @Res() res: Response) {
    try {
      const product = await this.productService.create(body);

      return res.status(200).json({ status: 'success', data: product });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(err);
      }
    }
  }

  @Get('/:id')
  async findProductById(@Res() res: Response, @Param('id') id: string) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid mongo object id',
          HttpStatus.BAD_REQUEST,
        );
      }

      let product,
        cache = true;
      product = await this.redisService.get(id);

      if (!product) {
        product = await this.productService.findById(id);
        await this.redisService.set(product.id, product, 300);
        cache = false;
      }

      return res.status(200).json({ status: 'success', cache, data: product });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(err);
      }
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch('/:id')
  async updateProduct(
    @Res() res: Response,
    @Body() body: ProductDto,
    @Param('id') id: string,
  ) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid mongo object id',
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.redisService.del(id);
      const product = await this.productService.FindByIdAndUpdate(id, body);

      return res.status(200).json({ status: 'success', data: product });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(err);
      }
    }
  }

  @Delete('/:id')
  async removeProduct(@Res() res: Response, @Param('id') id: string) {
    try {
      if (!ObjectId.isValid(id)) {
        throw new HttpException(
          'Invalid mongo object id',
          HttpStatus.BAD_REQUEST,
        );
      }

      const deleted = await this.productService.findByIdAndDelete(id);
      if (deleted) await this.redisService.del(id);

      return res.status(200).json({deleted: deleted || false});
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(err);
      }
    }
  }
}

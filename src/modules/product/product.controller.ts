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
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FindByIdsDto, ProductDto } from './product.dto';
import { ProductService } from './product.service';
import { ObjectId } from 'mongodb';
import { RedisService } from '../redis/redis.service';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('products')
export class ProductController {
  constructor(
    private redisService: RedisService,
    private readonly productService: ProductService,
  ) {}

  @UseGuards(ThrottlerGuard)
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

  @UseGuards(ThrottlerGuard)
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

  @UseGuards(ThrottlerGuard)
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

      const product = await this.productService.FindByIdAndUpdate(id, body);
      if (product) await this.redisService.del(id);

      return res.status(200).json({ status: 'success', data: product });
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(err);
      }
    }
  }

  @UseGuards(ThrottlerGuard)
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

      return res.status(204).json();
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      } else {
        throw new InternalServerErrorException(err);
      }
    }
  }
}

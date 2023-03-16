/*
https://docs.nestjs.com/providers#services
*/
import { InjectModel } from '@nestjs/mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ProductDocument, ProductModel, ProductProp } from './product.model';
import { Model } from 'mongoose';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductModel.name)
    private productModel: Model<ProductModel>,
  ) {}

  async create(body: ProductProp): Promise<ProductDocument> {
    const slug = body.name.split('-').join('-');
    Object.assign(body, { slug });

    return await this.productModel.create(body);
  }

  async findById(id: string): Promise<ProductDocument> {
    return await this.productModel.findById(id);
  }

  async FindByIdAndUpdate(
    id: string,
    body: ProductProp,
  ): Promise<ProductDocument> {
    if (body.name) {
      Object.assign(body, { slug: body.name.split('-').join('-') });
    }

    const existingProduct = await this.productModel
      .findByIdAndUpdate(id, body, { new: true })
      .exec();
    if (!existingProduct)
      throw new HttpException('product not found', HttpStatus.NOT_FOUND);

    return existingProduct;
  }

  async findByIdAndDelete(id: string): Promise<boolean> {
    const existingProduct = await this.findById(id);
    if (!existingProduct)
      throw new HttpException('product not found', HttpStatus.NOT_FOUND);

    await this.productModel.deleteOne({ _id: id });
    return true;
  }
}

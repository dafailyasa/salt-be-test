import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { closeInMongodConnection, rootMongooseTestModule } from '../../../test/modules/mongooseTestModule';
import { ProductModel, ProductProp, ProductSchema, Status } from './product.model';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ProductService } from './product.service'
import { HttpException } from '@nestjs/common';

const product: ProductProp = {
  name: "t-shirt bulls",
  shortDesc: 'short desc',
  longDesc: 'long desc',
  discount: 10,
  stock: 1,
  images: [
    'https://testimage.com/image-1',
    'https://testimage.com/image-2'
  ],
  status: Status.Draft,
  price: 10000,
  dimension: {
    length: 10,
    weight: 4,
    height: 1,
    width: 12,
  }
}

describe('ProductService', () => {
  let productService: ProductService;
  let productModel: Model<ProductModel>;

  afterAll(async () =>{
    await closeInMongodConnection();
  });

  afterEach(async () => {
    if (productModel) await productModel.deleteMany({});
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: ProductModel.name, schema: ProductSchema },
        ]),
      ],
      providers: [ProductService],
      exports: [ProductService],
    }).compile();

    productModel = module.get<Model<ProductModel>>(
      getModelToken('ProductModel')
    );
    productService = new ProductService(productModel);
  });

  describe('create',() => {
    it('should be create product data', async () => {
      const expectedSlug = product.name.split('-').join('-');
      const res = await productService.create(product);
      expect(res).toMatchObject(res);
      expect(res.slug).toEqual(expectedSlug);
    });
  });

  describe('findById', () => {
    it('should be return product find by id', async () => {
      const assertion = await productService.create(product);
      const res = await productService.findById(assertion._id);
      
      expect(res._id).toEqual(assertion._id);
      expect(assertion).toMatchObject(assertion);
    });

    it('should be empty if product not found', async () => {
      const assertion = await productService.create(product);

      await productService.findByIdAndDelete(assertion._id);
      const res = await productService.findById(assertion._id);
      
      expect(res).toBeNull();
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should be error if product not found', async () => {
      const assertion = await productService.create(product);
      await productService.findByIdAndDelete(assertion._id);

      await expect(
        productService.FindByIdAndUpdate(assertion._id, product)
      ).rejects.toThrowError(HttpException)
    });
    it('should be find and update product', async () => {
      const assertion = await productService.create(product);

      product.name = 't-shirt dragon';
      product.stock = 40;
      product.status = Status.Avaliable 

      const res = await productService.FindByIdAndUpdate(assertion._id, product);
      expect(res.name).toEqual(product.name);
      expect(res.stock).toEqual(product.stock);
      expect(res.status).toEqual(Status.Avaliable);
    });
  });

  describe('findByIdAndUpdate', () => {
    it('should be deleted product', async () => {
      const assertion = await productService.create(product);
      const res = await productService.findByIdAndDelete(assertion._id);
      expect(res).toBeTruthy();
    });

    it('should no deleted product if not found', async () => {
      const assertion = await productService.create(product);
      await productService.findByIdAndDelete(assertion._id);

      await expect(
        productService.findByIdAndDelete(assertion._id)
      ).rejects.toThrowError(HttpException);
    })
  })




});
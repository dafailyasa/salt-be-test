import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { ProductService } from './product.service';
import {
  ProductModel,
  ProductProp,
  ProductSchema,
  Status,
} from './product.model';
import { ProductController } from './product.controller';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '../../../test/modules/mongooseTestModule';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { RedisService } from '../redis/redis.service';
import { ProductDto } from './product.dto';
import { HttpException } from '@nestjs/common';

const response: any = {
  json: (data?: any) => data,
  status: (code: number) => response,
};

const slug = (name: string): string => {
  return name.split('-').join('-');
};

const product: ProductDto = {
  name: 't-shirt bulls',
  shortDesc: 'short desc',
  longDesc: 'long desc',
  discount: 10,
  stock: 1,
  images: ['https://testimage.com/image-1', 'https://testimage.com/image-2'],
  status: Status.Draft,
  price: 10000,
  dimension: {
    length: 10,
    weight: 4,
    height: 1,
    width: 12,
  },
};

describe('Product Controller', () => {
  let productService: ProductService;
  let productModel: Model<ProductModel>;
  let productController: ProductController;
  let redisService: RedisService;

  afterAll(async () => {
    await closeInMongodConnection();
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: ProductModel.name, schema: ProductSchema },
        ]),
      ],
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: {
            create: jest
              .fn()
              .mockImplementation(async (product: ProductProp) => {
                Object.assign(product, { slug: slug(product.name) });
                const res = await productModel.create(product);
                return res;
              }),
            findById: jest.fn().mockImplementation(async (id: string) => {
              const res = await productModel.findById(id);
              return res;
            }),
            FindByIdAndUpdate: jest
              .fn()
              .mockImplementation(async (id: string, product: ProductProp) => {
                return await productModel
                  .findByIdAndUpdate(id, product, { new: true })
                  .exec();
              }),
            findByIdAndDelete: jest
              .fn()
              .mockImplementation(async (id: string) => {
                return true;
              }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            set: jest
              .fn()
              .mockImplementation(
                async (key: string, data: any, expired: number) => {
                  expect(key).not.toBeNull();
                  expect(expired).not.toBeNull();
                  expect(data).not.toBeNull();
                  return Promise.resolve(true);
                },
              ),
            get: jest.fn().mockImplementation(async (key: string) => {
              expect(key).not.toBeNull();
              return Promise.resolve(null);
            }),
            del: jest.fn().mockImplementation(async (key: string) => {
              expect(key).not.toBeNull();
              return Promise.resolve(true);
            }),
          },
        },
      ],
    }).compile();

    productService = moduleRef.get<ProductService>(ProductService);
    redisService = moduleRef.get<RedisService>(RedisService);
    productModel = moduleRef.get<Model<ProductModel>>(
      getModelToken('ProductModel'),
    );

    productController = new ProductController(redisService, productService);
  });

  describe('createProduct', () => {
    it('should be create product', async () => {
      const res = await productController.createProduct(product, response);

      expect(res).toHaveProperty('data');
      expect(res).toHaveProperty('status', 'success');
    });

    it('should be error if failed to create product', async () => {
      jest.spyOn(productService, 'create').mockImplementation(() => {
        throw new Error('Failed crete product');
      });

      await expect(
        productController.createProduct(product, response),
      ).rejects.toThrowError(HttpException);
    });

    describe('findProductById', () => {
      it('should be find product by id on db and set to redis ', async () => {
        Object.assign(product, { slug: slug(product.name) });
        const assertion = await productModel.create(product);
        const res = await productController.findProductById(
          response,
          assertion._id,
        );
        expect(res).toHaveProperty('data._id', assertion._id);
        expect(res).toHaveProperty('cache', false);
      });

      it('should be find product by id with in redis ', async () => {
        Object.assign(product, { slug: slug(product.name) });
        const assertion = await productModel.create(product);

        jest.spyOn(redisService, 'get').mockImplementation(async (key) => {
          expect(key).not.toBeNull();
          return Promise.resolve(assertion);
        });

        const res = await productController.findProductById(
          response,
          assertion._id,
        );
        expect(res).toHaveProperty('data._id', assertion._id);
        expect(res).toHaveProperty('cache', true);
      });

      it('should be error if invalid id', async () => {
        const randomId = '6412a0aff3f9845140523613';

        await expect(
          productController.findProductById(response, randomId),
        ).rejects.toThrowError(HttpException);
      });
    });

    describe('updateProduct', () => {
      it('should be error if invalid id', async () => {
        const randomId = '1-random-id';
        await expect(
          productController.updateProduct(response, product, randomId),
        ).rejects.toThrowError(HttpException);
      });

      it('should be update products', async () => {
        Object.assign(product, { slug: slug(product.name) });
        const assertion = await productModel.create(product);

        assertion.name = 't-shirt terbaru updated';
        assertion.status = Status.Avaliable;
        assertion.longDesc = 'long desc updated';

        const res = await productController.updateProduct(
          response,
          assertion,
          assertion._id,
        );

        expect(res).toHaveProperty('data.name', slug(assertion.name));
        expect(res).toHaveProperty('data.status', Status.Avaliable);
        expect(res).toHaveProperty('data.longDesc', assertion.longDesc);
        expect(res).toHaveProperty('status', 'success');
      });

      it('should be failed to update product', async () => {
        Object.assign(product, { slug: slug(product.name) });
        const assertion = await productModel.create(product);

        assertion.name = 't-shirt terbaru updated';
        assertion.status = Status.Avaliable;
        assertion.longDesc = 'long desc updated';

        jest
          .spyOn(productService, 'FindByIdAndUpdate')
          .mockImplementation(async (id, product) => {
            expect(id).not.toBeNull();
            expect(product).not.toBeNull();
            return Promise.reject('failed update product');
          });

        await expect(
          productController.updateProduct(response, assertion, assertion._id),
        ).rejects.toThrowError(HttpException);
      });
    });

    describe('deleteProduct', () => {
      it('should be error if invalid id', async () => {
        const randomId = '1-random-id';
        await expect(
          productController.removeProduct(response, randomId),
        ).rejects.toThrowError(HttpException);
      });

      it('should be deleted product', async () => {
        Object.assign(product, { slug: slug(product.name) });
        const assertion = await productModel.create(product);

        const res = await productController.removeProduct(
          response,
          assertion._id,
        );
        expect(res).toHaveProperty('deleted', true);
      });

      it('should be failed to delete if not found product', async () => {
        Object.assign(product, { slug: slug(product.name) });
        const assertion = await productModel.create(product);

        jest
          .spyOn(productService, 'findByIdAndDelete')
          .mockImplementation(async (id) => {
            expect(id).not.toBeNull();
            return null;
          });

        await expect(
          productController.updateProduct(
            response,
            assertion,
            assertion._id + 1,
          ),
        ).rejects.toThrowError(HttpException);
      });
    });
  });
});

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Status {
  Draft = 'draft',
  Avaliable = 'avaliable',
  Sold = 'sold',
}

export class Dimension {
  @Prop({ type: Number, default: 0 })
  length: number;

  @Prop({ type: Number, default: 0 })
  width: number;

  @Prop({ type: Number, default: 0 })
  height: number;

  @Prop({ type: Number, default: 0 })
  weight: number;
}

@Schema({
  collection: 'products',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class ProductModel extends Document implements ProductProp {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  slug: string;

  @Prop({ type: String, required: true })
  shortDesc: string;

  @Prop({ type: String })
  longDesc: string;

  @Prop({ type: Number, required: true, default: 0 })
  discount: number;

  @Prop({ type: Number, required: true })
  stock: number;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(Status),
    default: Status.Draft,
  })
  status: Status;

  @Prop({ type: Dimension, required: true })
  dimension: Dimension;
}

export interface ProductProp {
  name: string;
  slug?: string;
  shortDesc: string;
  longDesc?: string;
  discount: number;
  stock: number;
  images: string[];
  status?: Status;
  price: number;
  dimension: Dimension;
}

export type ProductDocument = ProductProp & Document;
export const ProductSchema = SchemaFactory.createForClass(ProductModel);
ProductSchema.index({ name: 1 });

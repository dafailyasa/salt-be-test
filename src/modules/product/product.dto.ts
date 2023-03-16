import {
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Status } from './product.model';
import { Type } from 'class-transformer';

export class DimensionDto {
  @IsNotEmpty()
  @IsNumber()
  length: number;

  @IsNotEmpty()
  @IsNumber()
  width: number;

  @IsNotEmpty()
  @IsNumber()
  height: number;

  @IsNotEmpty()
  @IsNumber()
  weight: number;
}

export class ProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  shortDesc: string;

  @IsOptional()
  @IsString()
  longDesc?: string;

  @IsOptional()
  @IsNumber()
  discount: number;

  @IsNotEmpty()
  @IsNumber()
  stock: number;

  @IsNotEmpty()
  @IsArray()
  images: string[];

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsEnum(Status, {
    message: `Status should be a valid enum value. (${Object.values(Status)})`,
  })
  status: Status;

  @IsNotEmpty()
  @Type(() => DimensionDto)
  dimension: DimensionDto;
}

export class FindByIdsDto {
  @IsNotEmpty()
  @IsArray()
  ids: string[];
}

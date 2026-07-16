import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsInt, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsInt()
  @IsNotEmpty()
  productId: number;

  @IsInt()
  @IsNotEmpty()
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

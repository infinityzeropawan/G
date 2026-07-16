import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsInt()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

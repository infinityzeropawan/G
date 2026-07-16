import { IsInt, IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  @IsNotEmpty()
  memberId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

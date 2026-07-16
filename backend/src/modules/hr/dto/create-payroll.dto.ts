import { IsInt, IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePayrollDto {
  @IsInt()
  @IsNotEmpty()
  staffId: number;

  @IsString()
  @IsNotEmpty()
  month: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

import { IsString, IsEmail, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @IsString()
  @IsNotEmpty()
  branch: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsOptional()
  address?: string;
  
  @IsString()
  @IsNotEmpty()
  joinDate: string;
}

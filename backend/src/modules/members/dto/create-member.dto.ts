import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'rahul@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional({ example: 'Andheri, Mumbai' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Main Branch' })
  @IsNotEmpty()
  @IsString()
  branch: string;

  @ApiProperty({
    example: 1,
    description: 'Plan ID (1=Basic, 2=Gold, 3=Premium)',
  })
  @IsNotEmpty()
  @IsNumber()
  planId: number;

  @ApiProperty({
    enum: ['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS'],
  })
  @IsEnum(['ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'TWELVE_MONTHS'])
  billingCycle: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS';

  @ApiProperty({ example: '2026-01-15' })
  @IsNotEmpty()
  @IsDateString()
  joinDate: string;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  paidAmount?: number;
}

import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, IsDateString } from 'class-validator';
import { BillingCycle } from '@prisma/client';

export class RenewMemberDto {
  @IsEnum(BillingCycle)
  @IsNotEmpty()
  billingCycle: BillingCycle;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsInt()
  @IsOptional()
  planId?: number;
}

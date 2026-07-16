import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('payments')
  createPayment(@Body() dto: any) {
    return this.financeService.createPayment(dto);
  }

  @Get('payments')
  findAllPayments(@Query() query: any) {
    return this.financeService.findAllPayments(query);
  }

  @Get('summary')
  getSummary() {
    return this.financeService.getSummary();
  }

  @Get('payments/member/:memberId')
  getPaymentsByMember(@Param('memberId') memberId: string) {
    return this.financeService.getPaymentsByMember(+memberId);
  }
}

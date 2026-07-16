import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { CreatePayrollDto } from './dto/create-payroll.dto';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('staff')
  findAllStaff(@Query() query: any) {
    return this.hrService.findAllStaff(query);
  }
  @Post('staff')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.hrService.createStaff(dto);
  }
  @Get('staff/:id')
  findOneStaff(@Param('id') id: string) {
    return this.hrService.findOneStaff(+id);
  }
  @Patch('staff/:id')
  updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.hrService.updateStaff(+id, dto);
  }
  @Delete('staff/:id')
  removeStaff(@Param('id') id: string) {
    return this.hrService.removeStaff(+id);
  }

  @Get('payrolls')
  findAllPayrolls(@Query() query: any) {
    return this.hrService.findAllPayrolls(query);
  }
  @Post('payrolls')
  createPayroll(@Body() dto: CreatePayrollDto) {
    return this.hrService.createPayroll(dto);
  }
  @Patch('payrolls/:id/status')
  updatePayrollStatus(@Param('id') id: string, @Body() body: any) {
    return this.hrService.updatePayrollStatus(+id, body.status);
  }

  @Get('summary')
  getHrSummary() {
    return this.hrService.getHrSummary();
  }
}

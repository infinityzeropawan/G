import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  markAttendance(@Body() dto: any) {
    return this.attendanceService.markAttendance(dto);
  }
  @Get()
  findAll(@Query() query: any) {
    return this.attendanceService.findAll(query);
  }
  @Get('today-stats')
  getTodayStats() {
    return this.attendanceService.getTodayStats();
  }
}

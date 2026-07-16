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
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.inquiriesService.findAll(query);
  }
  @Post()
  create(@Body() dto: any) {
    return this.inquiriesService.create(dto);
  }
  @Get('stats')
  getStats() {
    return this.inquiriesService.getStats();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(+id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.inquiriesService.update(+id, dto);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inquiriesService.remove(+id);
  }
}

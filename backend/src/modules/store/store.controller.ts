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
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('products')
  findAllProducts(@Query() query: any) {
    return this.storeService.findAllProducts(query);
  }
  @Post('products')
  createProduct(@Body() dto: any) {
    return this.storeService.createProduct(dto);
  }
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: any) {
    return this.storeService.updateProduct(+id, dto);
  }
  @Delete('products/:id')
  removeProduct(@Param('id') id: string) {
    return this.storeService.removeProduct(+id);
  }

  @Get('orders')
  findAllOrders(@Query() query: any) {
    return this.storeService.findAllOrders(query);
  }
  @Post('orders')
  createOrder(@Body() dto: any) {
    return this.storeService.createOrder(dto);
  }

  @Get('summary')
  getStoreSummary() {
    return this.storeService.getStoreSummary();
  }
}

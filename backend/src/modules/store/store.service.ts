import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class StoreService {
  constructor(private prisma: PrismaService) {}

  async findAllProducts(query: any) {
    const data = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, data };
  }
  async createProduct(dto: any) {
    const data = await this.prisma.product.create({ data: dto });
    return { success: true, data };
  }
  async updateProduct(id: number, dto: any) {
    const data = await this.prisma.product.update({ where: { id }, data: dto });
    return { success: true, data };
  }
  async removeProduct(id: number) {
    const data = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true, data };
  }

  async findAllOrders(query: any) {
    const orders = await this.prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { id: 'desc' },
    });
    return { success: true, data: { orders, total: orders.length } };
  }

  async createOrder(dto: any) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // BUG-005 FIX: Validate all products and stock BEFORE creating the order
    const resolvedItems: Array<{
      productId: number;
      qty: number;
      price: number;
      name: string;
    }> = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product || !product.isActive) {
        throw new NotFoundException(`Product #${item.productId} not found`);
      }
      if (product.stock < item.qty) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.qty}`,
        );
      }
      resolvedItems.push({
        productId: product.id,
        qty: item.qty,
        price: product.price,
        name: product.name,
      });
    }

    // All checks passed — create order and decrement stock
    const total = resolvedItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const order = await this.prisma.order.create({
      data: {
        total,
        method: dto.method,
        status: 'Completed',
        notes: dto.notes,
      },
    });

    for (const item of resolvedItems) {
      await this.prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
        },
      });
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }

    const data = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { product: true } } },
    });
    return { success: true, data };
  }

  async getStoreSummary() {
    const totalProducts = await this.prisma.product.count({ where: { isActive: true } });
    const totalOrders = await this.prisma.order.count();
    const totalRevenue = (await this.prisma.order.aggregate({ _sum: { total: true } }))._sum.total || 0;
    const lowStockProducts = await this.prisma.product.findMany({ where: { stock: { lte: 10 }, isActive: true } });
    return { success: true, data: { totalProducts, totalOrders, totalRevenue, lowStockProducts } };
  }
}

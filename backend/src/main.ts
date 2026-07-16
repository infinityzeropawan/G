import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Global Prefix ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: true, // Allow all origins for now to prevent CORS issues
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  });

  // ─── Global Pipes (Validation) ────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields
      forbidNonWhitelisted: true,
      transform: true, // auto-transforms types (string → number)
    }),
  );

  // ─── Global Interceptor (Standard Response) ───────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ─── Global Exception Filter ──────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ─── Swagger API Docs ─────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('GymSmart ERP API')
    .setDescription('Complete Gym Management System REST API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Members', 'Gym member management')
    .addTag('Plans', 'Membership plans')
    .addTag('Finance', 'Payments and billing')
    .addTag('HR', 'Staff and payroll')
    .addTag('Attendance', 'Attendance tracking')
    .addTag('Store', 'Product store and POS')
    .addTag('Workout', 'Workout and diet library')
    .addTag('Dashboard', 'Analytics and KPIs')
    .addTag('Inquiries', 'Lead management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  console.log(`\n🏋️  GymSmart Backend is running!`);
  console.log(`🚀  API:     http://localhost:${port}/api`);
  console.log(`📚  Docs:    http://localhost:${port}/api/docs\n`);
}

bootstrap();

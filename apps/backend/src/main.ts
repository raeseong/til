import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  if (config.get<string>('NODE_ENV') === 'production') {
    const adminPassword = config.get<string>('ADMIN_PASSWORD');
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!adminPassword?.trim() || !jwtSecret?.trim()) {
      throw new Error('ADMIN_PASSWORD and JWT_SECRET are required in production');
    }
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = config.get<string>('CORS_ORIGINS');
  const origin = corsOrigins
    ? corsOrigins.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

  app.enableCors({
    origin,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TIL API')
    .setDescription('TIL 백엔드 API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = config.get<number>('PORT') ?? 3001;

  await app.listen(port);
  console.log(`API running at http://localhost:${port}`);
  console.log(`Swagger: http://localhost:${port}/api`);
}
bootstrap();

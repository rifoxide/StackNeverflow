import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { join } from 'path';
import { AppModule } from './app.module.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService);

  // Register fastify cookie plugin
  await app.register(fastifyCookie);

  // Register multipart for file uploads
  await app.register(import('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  // Register static file serving for uploads
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global filters (order matters: most specific last)
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseInterceptor(),
  );

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('StackNeverflow API')
    .setDescription('Developer community platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('BACKEND_PORT', 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Backend running on http://localhost:${String(port)}`);
  console.log(
    `Swagger docs available at http://localhost:${String(port)}/api/docs`,
  );
}
void bootstrap();

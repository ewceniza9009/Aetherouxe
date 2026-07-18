import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.use(helmet());

  // CORS: restrict to known portal origins (supports credentials).
  // Configure via ALLOWED_ORIGINS (comma-separated). Requests without an
  // Origin header (server-to-server, health checks, smoke tests) are allowed.
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
    'http://admin.localhost,http://owner.localhost,http://resident.localhost,http://api.localhost,http://localhost:8080')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Compare origins ignoring the port (host:port vs host), so that
  // http://admin.localhost:8080 is treated as http://admin.localhost.
  const normalizeOrigin = (o: string) => {
    try {
      const u = new URL(o);
      return `${u.protocol}//${u.hostname}`;
    } catch {
      return o;
    }
  };
  const allowedHosts = new Set(allowedOrigins.map(normalizeOrigin));

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedHosts.has(normalizeOrigin(origin))) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Elite Realty API')
    .setDescription('Property management & real estate backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();

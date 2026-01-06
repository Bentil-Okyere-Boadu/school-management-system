import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { SanitizeResponseInterceptor } from './common/interceptors/sanitize-response.interceptor';
import { Role } from './role/role.entity';
import { EventCategory } from './planner/entities/event-category.entity';
import { School } from './school/school.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function seedRoles(app: INestApplication) {
  const logger = new Logger('Seeder');
  const roleRepository = app.get(getRepositoryToken(Role)) as Repository<Role>;

  const defaultRoles = [
    { name: 'super_admin', label: 'Super Admin' },
    { name: 'school_admin', label: 'School Admin' },
    { name: 'teacher', label: 'Teacher' },
    { name: 'student', label: 'Student' },
    { name: 'parent', label: 'Parent' },
  ];

  for (const role of defaultRoles) {
    const exists = await roleRepository.findOneBy({ name: role.name });
    if (!exists) {
      await roleRepository.save(role);
      logger.log(`Seeded role: ${role.name}`);
    }
  }
}

async function seedDefaultEventCategories(app: INestApplication) {
  const logger = new Logger('EventCategorySeeder');
  const categoryRepository = app.get(
    getRepositoryToken(EventCategory),
  ) as Repository<EventCategory>;
  const schoolRepository = app.get(
    getRepositoryToken(School),
  ) as Repository<School>;

  const defaultCategories = [
    { name: 'General', color: '#6366f1', description: 'General events' },
    {
      name: 'Uncategorized',
      color: '#94a3b8',
      description: 'Uncategorized events',
    },
    {
      name: 'School Event',
      color: '#10b981',
      description: 'School-wide events and activities',
    },
  ];

  // Get all schools
  const schools = await schoolRepository.find();

  for (const school of schools) {
    for (const categoryData of defaultCategories) {
      const exists = await categoryRepository.findOne({
        where: {
          name: categoryData.name,
          school: { id: school.id },
        },
      });

      if (!exists) {
        const category = categoryRepository.create({
          ...categoryData,
          school,
        });
        await categoryRepository.save(category);
        logger.log(
          `Seeded event category "${categoryData.name}" for school: ${school.name}`,
        );
      }
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Configure Helmet for secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  // CORS configuration - get from environment variable
  // Supports comma-separated multiple origins: "https://domain1.com,https://domain2.com"
  const frontendUrl = configService.get<string>('FRONTEND_URL', '');
  const allowedOrigins = frontendUrl
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => {
      // Normalize URLs: remove trailing slashes for consistent comparison
      return url.replace(/\/+$/, '');
    });

  logger.log(
    `CORS: Allowed origins configured: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'NONE (allowing all in development)'}`,
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Normalize the incoming origin (remove trailing slash)
      const normalizedOrigin = origin.replace(/\/+$/, '');

      if (allowedOrigins.length === 0) {
        // If no origins configured, allow all (development only)
        logger.warn(
          'CORS: No FRONTEND_URL configured - allowing all origins (development mode)',
        );
        callback(null, true);
      } else if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        logger.warn(
          `CORS: Origin "${normalizedOrigin}" not allowed. Allowed: ${allowedOrigins.join(', ')}`,
        );
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new SanitizeResponseInterceptor());

  await seedRoles(app);
  await seedDefaultEventCategories(app);

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { SanitizeResponseInterceptor } from './common/interceptors/sanitize-response.interceptor';
import { Role } from './role/role.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
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

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();

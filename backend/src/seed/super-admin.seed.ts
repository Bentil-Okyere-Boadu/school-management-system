import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));

  const superAdminRole = await roleRepository.findOne({
    where: { name: 'super_admin' },
  });
  if (!superAdminRole) {
    logger.log('Super Admin Role not found, creating...');
    await roleRepository.save(roleRepository.create({ name: 'super_admin' }));
  }

  const finalRole = await roleRepository.findOne({
    where: { name: 'super_admin' },
  });

  if (!finalRole) {
    throw new Error('Super Admin role not found');
  }
  const existingSuperAdmin = await userRepository.findOne({
    where: { email: 'superadmin@example.com' },
  });

  if (!existingSuperAdmin) {
    const password = await bcrypt.hash('superadmin123', 10);

    const superAdmin = userRepository.create({
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password,
      role: finalRole,
    });

    await userRepository.save(superAdmin);
    logger.log('Super Admin created successfully ✅');
  } else {
    logger.log('Super Admin already exists ✅');
  }

  await app.close();
}

bootstrap();

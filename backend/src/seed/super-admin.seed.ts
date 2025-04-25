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

  if (superAdminRole) {
    const usersWithSuperAdminRole = await userRepository.find({
      where: { role: { id: superAdminRole.id } },
      relations: ['role'],
    });

    if (usersWithSuperAdminRole.length > 0) {
      logger.log(
        `Deleting ${usersWithSuperAdminRole.length} user(s) with Super Admin role...`,
      );
      await userRepository.remove(usersWithSuperAdminRole);
      logger.log('Deleted users with Super Admin role ✅');
    }

    logger.log('Deleting existing Super Admin role...');
    await roleRepository.remove(superAdminRole);
    logger.log('Deleted Super Admin role ✅');
  }

  logger.log('Creating roles...');
  await roleRepository.save(roleRepository.create({ name: 'super_admin' }));
  await roleRepository.save(roleRepository.create({ name: 'school_admin' }));
  await roleRepository.save(roleRepository.create({ name: 'teacher' }));
  await roleRepository.save(roleRepository.create({ name: 'student' }));
  await roleRepository.save(roleRepository.create({ name: 'parent' }));
  logger.log('Roles created successfully ✅');

  const finalRole = await roleRepository.findOne({
    where: { name: 'super_admin' },
  });

  if (!finalRole) {
    throw new Error('Super Admin role not found');
  }

  const password = await bcrypt.hash('superadmin123', 10);

  const superAdmin = userRepository.create({
    name: 'Super Admin',
    email: 'superadmin@example.com',
    password,
    role: finalRole,
  });

  await userRepository.save(superAdmin);
  logger.log('Super Admin created successfully ✅');

  await app.close();
}

bootstrap();

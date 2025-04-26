import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import { School } from 'src/school/school.entity';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

async function clearAllData(
  userRepository: Repository<User>,
  roleRepository: Repository<Role>,
  schoolRepository: Repository<School>,
  logger: Logger,
) {
  logger.log('Starting database cleanup...');

  // First, clear all users (except super admin if exists)
  const users = await userRepository.find({
    relations: ['role'],
  });
  const usersToDelete = users.filter(
    (user) => user.role?.name !== 'super_admin',
  );

  if (usersToDelete.length > 0) {
    logger.log(`Deleting ${usersToDelete.length} user(s)...`);
    await userRepository.remove(usersToDelete);
    logger.log('Users deleted ✅');
  }

  // Then clear all schools
  const schools = await schoolRepository.find();
  if (schools.length > 0) {
    logger.log(`Deleting ${schools.length} school(s)...`);
    await schoolRepository.remove(schools);
    logger.log('Schools deleted ✅');
  }

  // Finally, clear all roles (except super_admin if exists)
  const roles = await roleRepository.find();
  const rolesToDelete = roles.filter((role) => role.name !== 'super_admin');

  if (rolesToDelete.length > 0) {
    logger.log(`Deleting ${rolesToDelete.length} role(s)...`);
    await roleRepository.remove(rolesToDelete);
    logger.log('Roles deleted ✅');
  }

  logger.log('Database cleanup completed ✅');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
  const schoolRepository = app.get<Repository<School>>(
    getRepositoryToken(School),
  );

  // Clear all data first
  await clearAllData(userRepository, roleRepository, schoolRepository, logger);

  // Check if super_admin role exists
  let superAdminRole = await roleRepository.findOne({
    where: { name: 'super_admin' },
  });

  // If super_admin role doesn't exist, create it
  if (!superAdminRole) {
    logger.log('Creating Super Admin role...');
    superAdminRole = await roleRepository.save(
      roleRepository.create({ name: 'super_admin' }),
    );
    logger.log('Super Admin role created ✅');
  }

  // Create other roles
  logger.log('Creating other roles...');
  await roleRepository.save(roleRepository.create({ name: 'school_admin' }));
  await roleRepository.save(roleRepository.create({ name: 'teacher' }));
  await roleRepository.save(roleRepository.create({ name: 'student' }));
  await roleRepository.save(roleRepository.create({ name: 'parent' }));
  logger.log('Roles created successfully ✅');

  // Check if super admin user exists
  const existingSuperAdmin = await userRepository.findOne({
    where: { role: { name: 'super_admin' } },
    relations: ['role'],
  });

  if (!existingSuperAdmin) {
    const password = await bcrypt.hash('superadmin123', 10);

    const superAdmin = userRepository.create({
      name: 'Super Admin',
      email: 'superadmin@example.com',
      status: 'active',
      password,
      role: superAdminRole,
    });

    await userRepository.save(superAdmin);
    logger.log('Super Admin created successfully ✅');
  } else {
    logger.log('Super Admin already exists, skipping creation');
  }

  await app.close();
}

bootstrap();

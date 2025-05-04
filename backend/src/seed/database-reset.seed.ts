import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import { School } from 'src/school/school.entity';
import { Logger } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';

async function bootstrap() {
  const logger = new Logger('DatabaseReset');
  logger.log('Starting database reset process...');

  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
  const roleRepository = app.get<Repository<Role>>(getRepositoryToken(Role));
  const schoolRepository = app.get<Repository<School>>(
    getRepositoryToken(School),
  );
  const schoolAdminRepository = app.get<Repository<SchoolAdmin>>(
    getRepositoryToken(SchoolAdmin),
  );
  const superAdminRepository = app.get<Repository<SuperAdmin>>(
    getRepositoryToken(SuperAdmin),
  );
  const dataSource = app.get(DataSource);

  try {
    await dataSource.transaction(async (manager) => {
      logger.log('Clearing all data in correct order...');

      // Clear users
      const users = await manager.find(User);
      if (users.length) {
        logger.log(`Deleting ${users.length} user(s)...`);
        await manager.remove(users);
        logger.log('Users deleted ✓');
      }

      // Clear school admins
      const schoolAdmins = await manager.find(SchoolAdmin);
      if (schoolAdmins.length) {
        logger.log(`Deleting ${schoolAdmins.length} school admin(s)...`);
        await manager.remove(schoolAdmins);
        logger.log('School admins deleted ✓');
      }

      // Clear super admins
      const superAdmins = await manager.find(SuperAdmin);
      if (superAdmins.length) {
        logger.log(`Deleting ${superAdmins.length} super admin(s)...`);
        await manager.remove(superAdmins);
        logger.log('Super admins deleted ✓');
      }

      // Clear schools
      const schools = await manager.find(School);
      if (schools.length) {
        logger.log(`Deleting ${schools.length} school(s)...`);
        await manager.remove(schools);
        logger.log('Schools deleted ✓');
      }

      // Clear roles
      const roles = await manager.find(Role);
      if (roles.length) {
        logger.log(`Deleting ${roles.length} role(s)...`);
        await manager.remove(roles);
        logger.log('Roles deleted ✓');
      }
    });

    // Recreate roles
    logger.log('Creating roles with labels...');
    await roleRepository.save([
      roleRepository.create({ name: 'super_admin', label: 'Super Admin' }),
      roleRepository.create({ name: 'school_admin', label: 'School Admin' }),
      roleRepository.create({ name: 'teacher', label: 'Teacher' }),
      roleRepository.create({ name: 'student', label: 'Student' }),
      roleRepository.create({ name: 'parent', label: 'Parent' }),
    ]);
    logger.log('Roles created successfully ✓');
    logger.log('Database reset completed successfully ✓');
  } catch (error) {
    logger.error('Error during database reset:', error);
  } finally {
    await app.close();
  }
}

bootstrap();

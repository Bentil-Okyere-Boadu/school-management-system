import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolAdminService } from './school-admin.service';
import { SchoolAdminController } from './school-admin.controller';
import { SchoolAdmin } from './school-admin.entity';
import { School } from '../school/school.entity';
import { EmailModule } from '../common/modules/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolAdmin, School]), EmailModule],
  controllers: [SchoolAdminController],
  providers: [SchoolAdminService],
  exports: [SchoolAdminService],
})
export class SchoolAdminModule {}

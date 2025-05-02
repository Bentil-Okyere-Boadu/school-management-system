import { Module } from '@nestjs/common';
import { SchoolAdminService } from './school-admin.service';
import { SchoolAdminController } from './school-admin.controller';

@Module({
  providers: [SchoolAdminService],
  controllers: [SchoolAdminController]
})
export class SchoolAdminModule {}

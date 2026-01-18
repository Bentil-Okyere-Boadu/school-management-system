import { Module } from '@nestjs/common';
import { ObjectStorageServiceService } from './object-storage-service.service';
import { Profile } from 'src/profile/profile.entity';
import { School } from 'src/school/school.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';

@Module({
  providers: [
    ObjectStorageServiceService,
    Profile,
    School,
    SchoolAdmin,
    SuperAdmin,
  ],
})
export class ObjectStorageServiceModule {}

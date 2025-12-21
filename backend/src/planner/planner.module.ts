import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { Event } from './entities/event.entity';
import { EventCategory } from './entities/event-category.entity';
import { EventAttachment } from './entities/event-attachment.entity';
import { EventReminder } from './entities/event-reminder.entity';
import { ObjectStorageServiceModule } from '../object-storage-service/object-storage-service.module';
import { CommonModule } from '../common/common.module';
import { ClassLevel } from '../class-level/class-level.entity';
import { Student } from '../student/student.entity';
import { Parent } from '../parent/parent.entity';
import { Subject } from '../subject/subject.entity';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { PlannerScheduler } from './planner-scheduler';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventCategory,
      EventAttachment,
      EventReminder,
      ClassLevel,
      Subject,
      SubjectCatalog,
      Student,
      Parent,
    ]),
    ObjectStorageServiceModule,
    CommonModule,
  ],
  controllers: [PlannerController],
  providers: [PlannerService, PlannerScheduler, ObjectStorageServiceService],
  exports: [PlannerService],
})
export class PlannerModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassLevel } from './class-level.entity';
import { ClassLevelService } from './class-level.service';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { ClassLevelController } from './class-level.controller';
import { ClassLevelResultApproval } from './class-level-result-approval.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassLevel,
      ClassLevelResultApproval,
      Teacher,
      Student,
    ]),
  ],
  providers: [ClassLevelService],
  exports: [ClassLevelService],
  controllers: [ClassLevelController],
})
export class ClassLevelModule {}

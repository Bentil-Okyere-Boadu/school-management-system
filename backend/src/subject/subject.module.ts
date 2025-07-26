import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { Subject } from './subject.entity';
import { Teacher } from '../teacher/teacher.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { SubjectCatalog } from './subject-catalog.entity';
import { SubjectCatalogController } from './subject-catalog.controller';
import { School } from 'src/school/school.entity';
import { StudentGrade } from './student-grade.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      Teacher,
      ClassLevel,
      SubjectCatalog,
      School,
      StudentGrade,
    ]),
  ],
  providers: [SubjectService],
  controllers: [SubjectController, SubjectCatalogController],
  exports: [TypeOrmModule],
})
export class SubjectModule {}

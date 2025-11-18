import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';
import { Curriculum } from './entities/curriculum.entity';
import { Topic } from './entities/topic.entity';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { School } from '../school/school.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Curriculum,
      Topic,
      SubjectCatalog,
      School,
      AcademicTerm,
    ]),
  ],
  providers: [CurriculumService],
  controllers: [CurriculumController],
  exports: [CurriculumService],
})
export class CurriculumModule {}

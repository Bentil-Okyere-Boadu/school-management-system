import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumService } from './curriculum.service';
import { CurriculumController } from './curriculum.controller';
import { Curriculum } from './entities/curriculum.entity';
import { Topic } from './entities/topic.entity';
import { Subtopic } from './entities/subtopic.entity';
import { SubtopicCompletion } from './entities/subtopic-completion.entity';
import { CurriculumTopicNote } from './entities/curriculum-topic-note.entity';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { Subject } from '../subject/subject.entity';
import { School } from '../school/school.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    NotificationModule,
    TypeOrmModule.forFeature([
      Curriculum,
      Topic,
      Subtopic,
      SubtopicCompletion,
      CurriculumTopicNote,
      SubjectCatalog,
      Subject,
      School,
      AcademicTerm,
    ]),
  ],
  providers: [CurriculumService],
  controllers: [CurriculumController],
  exports: [CurriculumService],
})
export class CurriculumModule {}

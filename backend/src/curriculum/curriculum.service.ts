import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Curriculum } from './entities/curriculum.entity';
import { Topic } from './entities/topic.entity';
import { Subtopic } from './entities/subtopic.entity';
import { SubtopicCompletion } from './entities/subtopic-completion.entity';
import { CurriculumTopicNote } from './entities/curriculum-topic-note.entity';
import { Subject } from '../subject/subject.entity';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateSubtopicDto } from './dto/create-subtopic.dto';
import { UpdateSubtopicDto } from './dto/update-subtopic.dto';
import { CreateCurriculumTopicNoteDto } from './dto/create-curriculum-topic-note.dto';
import { SubjectCatalog } from '../subject/subject-catalog.entity';
import { School } from '../school/school.entity';
import { AcademicTerm } from '../academic-calendar/entitites/academic-term.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { QueryString } from '../common/api-features/api-features';
import { APIFeatures } from '../common/api-features/api-features';

@Injectable()
export class CurriculumService {
  constructor(
    @InjectRepository(Curriculum)
    private curriculumRepository: Repository<Curriculum>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Subtopic)
    private subtopicRepository: Repository<Subtopic>,
    @InjectRepository(SubtopicCompletion)
    private subtopicCompletionRepository: Repository<SubtopicCompletion>,
    @InjectRepository(CurriculumTopicNote)
    private curriculumTopicNoteRepository: Repository<CurriculumTopicNote>,
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(SubjectCatalog)
    private subjectCatalogRepository: Repository<SubjectCatalog>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
  ) {}

  /** Validates term belongs to school; used for subtopic completions and notes. */
  private async assertAcademicTermInSchool(
    academicTermId: string,
    schoolId: string,
  ): Promise<AcademicTerm> {
    const term = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
      relations: ['academicCalendar', 'academicCalendar.school'],
    });
    if (!term) throw new NotFoundException('Academic term not found');
    if (term.academicCalendar.school.id !== schoolId) {
      throw new ForbiddenException(
        'Academic term does not belong to your school',
      );
    }
    return term;
  }

  async create(createCurriculumDto: CreateCurriculumDto, admin: SchoolAdmin) {
    const { name, description, isActive, subjectCatalogIds, academicTermId } =
      createCurriculumDto;

    // Validate school admin has a school
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    // Validate all subject catalogs exist and belong to the school
    const subjectCatalogs = await this.subjectCatalogRepository.find({
      where: { id: In(subjectCatalogIds) },
      relations: ['school'],
    });

    if (subjectCatalogs.length !== subjectCatalogIds.length) {
      throw new NotFoundException('One or more subject catalogs not found');
    }

    // Check all subject catalogs belong to the school
    for (const subjectCatalog of subjectCatalogs) {
      if (subjectCatalog.school.id !== admin.school.id) {
        throw new ForbiddenException(
          `Subject catalog ${subjectCatalog.name} does not belong to your school`,
        );
      }
    }

    let academicTerm: AcademicTerm | null = null;
    if (academicTermId) {
      const term = await this.academicTermRepository.findOne({
        where: { id: academicTermId },
        relations: ['academicCalendar', 'academicCalendar.school'],
      });

      if (!term) {
        throw new NotFoundException('Academic term not found');
      }

      if (term.academicCalendar.school.id !== admin.school.id) {
        throw new ForbiddenException(
          'Academic term does not belong to your school',
        );
      }

      academicTerm = term;

      const existingCurriculum = await this.curriculumRepository
        .createQueryBuilder('curriculum')
        .innerJoin('curriculum.subjectCatalogs', 'subjectCatalog')
        .where('curriculum.academicTerm.id = :academicTermId', {
          academicTermId,
        })
        .andWhere('curriculum.school.id = :schoolId', {
          schoolId: admin.school.id,
        })
        .andWhere('subjectCatalog.id IN (:...subjectCatalogIds)', {
          subjectCatalogIds,
        })
        .getOne();

      if (existingCurriculum) {
        throw new BadRequestException(
          'Curriculum already exists for one or more of these subject catalogs and academic term',
        );
      }
    } else {
      const existingTermAgnostic = await this.curriculumRepository
        .createQueryBuilder('curriculum')
        .innerJoin('curriculum.subjectCatalogs', 'subjectCatalog')
        .where('curriculum.school.id = :schoolId', {
          schoolId: admin.school.id,
        })
        .andWhere('curriculum.academicTerm IS NULL')
        .andWhere('subjectCatalog.id IN (:...subjectCatalogIds)', {
          subjectCatalogIds,
        })
        .getOne();

      if (existingTermAgnostic) {
        throw new BadRequestException(
          'A term-agnostic curriculum already exists for one or more of these subject catalogs',
        );
      }
    }

    // Create curriculum
    const curriculum = this.curriculumRepository.create({
      name,
      description,
      isActive: isActive ?? true,
      subjectCatalogs,
      school: admin.school,
      academicTerm,
    });

    return await this.curriculumRepository.save(curriculum);
  }

  async findAll(schoolId: string, query: QueryString) {
    const queryBuilder = this.curriculumRepository
      .createQueryBuilder('curriculum')
      .leftJoinAndSelect('curriculum.subjectCatalogs', 'subjectCatalogs')
      .leftJoinAndSelect('subjectCatalogs.topics', 'topics')
      .leftJoinAndSelect('curriculum.academicTerm', 'academicTerm')
      .leftJoinAndSelect('academicTerm.academicCalendar', 'academicCalendar')
      .where('curriculum.school.id = :schoolId', { schoolId });

    const apiFeatures = new APIFeatures(queryBuilder, query)
      .filter()
      .search(['name', 'description'])
      .sort()
      .limitFields()
      .paginate();

    const [curricula, total] = await apiFeatures.getQuery().getManyAndCount();

    const data = curricula.map((c) => {
      const {
        id,
        name,
        description,
        isActive,
        subjectCatalogs,
        academicTerm,
        createdAt,
        updated,
      } = c as any;

      const academicCalendar =
        (academicTerm && academicTerm.academicCalendar) || null;

      return {
        id,
        name,
        description,
        isActive,
        subjectCatalogs,
        academicTerm,
        academicCalendar,
        createdAt,
        updatedAt: (c as any).updatedAt ?? updated,
      };
    });

    return {
      data,
      total,
      page: parseInt(query.page ?? '1', 10),
      limit: parseInt(query.limit ?? '20', 10),
    };
  }

  async findOne(id: string, schoolId: string) {
    const curriculum = await this.curriculumRepository.findOne({
      where: { id, school: { id: schoolId } },
      relations: [
        'subjectCatalogs',
        'subjectCatalogs.topics',
        'academicTerm',
        'academicTerm.academicCalendar',
        'school',
      ],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    return curriculum;
  }

  async update(
    id: string,
    updateCurriculumDto: UpdateCurriculumDto,
    admin: SchoolAdmin,
  ) {
    const curriculum = await this.curriculumRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['subjectCatalogs', 'academicTerm'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    // If subject catalogs are being updated, validate them
    if (updateCurriculumDto.subjectCatalogIds) {
      const subjectCatalogs = await this.subjectCatalogRepository.find({
        where: { id: In(updateCurriculumDto.subjectCatalogIds) },
        relations: ['school'],
      });

      if (
        subjectCatalogs.length !== updateCurriculumDto.subjectCatalogIds.length
      ) {
        throw new NotFoundException('One or more subject catalogs not found');
      }

      // Check all subject catalogs belong to the school
      for (const subjectCatalog of subjectCatalogs) {
        if (subjectCatalog.school.id !== admin.school.id) {
          throw new ForbiddenException(
            `Subject catalog ${subjectCatalog.name} does not belong to your school`,
          );
        }
      }

      curriculum.subjectCatalogs = subjectCatalogs;
    }

    if (updateCurriculumDto.academicTermId !== undefined) {
      if (updateCurriculumDto.academicTermId === null) {
        const subjectCatalogIds =
          updateCurriculumDto.subjectCatalogIds ||
          curriculum.subjectCatalogs.map((sc) => sc.id);
        const conflicting = await this.curriculumRepository
          .createQueryBuilder('c')
          .innerJoin('c.subjectCatalogs', 'subjectCatalog')
          .where('c.school.id = :schoolId', { schoolId: admin.school.id })
          .andWhere('c.academicTerm IS NULL')
          .andWhere('c.id != :curriculumId', { curriculumId: id })
          .andWhere('subjectCatalog.id IN (:...subjectCatalogIds)', {
            subjectCatalogIds,
          })
          .getOne();
        if (conflicting) {
          throw new BadRequestException(
            'Another term-agnostic curriculum already exists for one or more of these subject catalogs',
          );
        }
        curriculum.academicTerm = null;
      } else {
        const academicTerm = await this.academicTermRepository.findOne({
          where: { id: updateCurriculumDto.academicTermId },
          relations: ['academicCalendar', 'academicCalendar.school'],
        });

        if (!academicTerm) {
          throw new NotFoundException('Academic term not found');
        }

        if (academicTerm.academicCalendar.school.id !== admin.school.id) {
          throw new ForbiddenException(
            'Academic term does not belong to your school',
          );
        }

        const subjectCatalogIds =
          updateCurriculumDto.subjectCatalogIds ||
          curriculum.subjectCatalogs.map((sc) => sc.id);

        const existingCurriculum = await this.curriculumRepository
          .createQueryBuilder('curriculum')
          .innerJoin('curriculum.subjectCatalogs', 'subjectCatalog')
          .where('curriculum.academicTerm.id = :academicTermId', {
            academicTermId: updateCurriculumDto.academicTermId,
          })
          .andWhere('curriculum.school.id = :schoolId', {
            schoolId: admin.school.id,
          })
          .andWhere('curriculum.id != :curriculumId', { curriculumId: id })
          .andWhere('subjectCatalog.id IN (:...subjectCatalogIds)', {
            subjectCatalogIds,
          })
          .getOne();

        if (existingCurriculum) {
          throw new BadRequestException(
            'Another curriculum already exists for one or more of these subject catalogs and academic term',
          );
        }

        curriculum.academicTerm = academicTerm;
      }
    }

    // Update other fields
    if (updateCurriculumDto.name !== undefined) {
      curriculum.name = updateCurriculumDto.name;
    }
    if (updateCurriculumDto.description !== undefined) {
      curriculum.description = updateCurriculumDto.description;
    }
    if (updateCurriculumDto.isActive !== undefined) {
      curriculum.isActive = updateCurriculumDto.isActive;
    }

    return await this.curriculumRepository.save(curriculum);
  }

  async remove(id: string, admin: SchoolAdmin) {
    const curriculum = await this.curriculumRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['subjectCatalogs'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    // Topics are cascade deleted when subject catalogs are removed from curriculum
    // or when subject catalogs themselves are deleted
    await this.curriculumRepository.remove(curriculum);
    return { message: 'Curriculum deleted successfully' };
  }

  // Topic CRUD operations
  async createTopic(createTopicDto: CreateTopicDto, admin: SchoolAdmin) {
    const {
      name,
      description,
      order,
      plannedStartDate,
      plannedEndDate,
      subjectCatalogId,
      curriculumId,
    } = createTopicDto;

    // Validate curriculum exists and belongs to the school
    const curriculum = await this.curriculumRepository.findOne({
      where: { id: curriculumId },
      relations: ['school', 'subjectCatalogs'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    if (curriculum.school.id !== admin.school.id) {
      throw new ForbiddenException('Curriculum does not belong to your school');
    }

    // Validate subject catalog exists and belongs to the curriculum
    const subjectCatalog = await this.subjectCatalogRepository.findOne({
      where: { id: subjectCatalogId },
      relations: ['school'],
    });

    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog not found');
    }

    if (subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException(
        'Subject catalog does not belong to your school',
      );
    }

    // Verify subject catalog is part of the curriculum
    const isInCurriculum = curriculum.subjectCatalogs.some(
      (sc) => sc.id === subjectCatalogId,
    );

    if (!isInCurriculum) {
      throw new BadRequestException(
        'Subject catalog does not belong to this curriculum',
      );
    }

    // Create topic
    const topic = this.topicRepository.create({
      name,
      description,
      order: order ?? 0,
      plannedStartDate: plannedStartDate
        ? new Date(plannedStartDate)
        : undefined,
      plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : undefined,
      subjectCatalog,
      curriculum,
    });

    return await this.topicRepository.save(topic);
  }

  async findAllTopics(schoolId: string, query?: QueryString) {
    // Get all topics for subject catalogs in the school, with optional filters
    const queryBuilder = this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.subjectCatalog', 'subjectCatalog')
      .leftJoinAndSelect('topic.curriculum', 'curriculum')
      .leftJoinAndSelect('curriculum.academicTerm', 'academicTerm')
      .leftJoinAndSelect('academicTerm.academicCalendar', 'academicCalendar')
      .leftJoin('subjectCatalog.school', 'school')
      .where('school.id = :schoolId', { schoolId });

    // Optional filters: curriculum, subject catalog (subject), class level, teacher
    const curriculumId = query?.curriculumId;
    const subjectCatalogId = query?.subjectCatalogId;
    const teacherId = query?.teacherId;
    const classLevelId = query?.classLevelId;

    if (curriculumId) {
      queryBuilder.andWhere('curriculum.id = :curriculumId', {
        curriculumId,
      });
    }
    if (subjectCatalogId) {
      queryBuilder.andWhere('subjectCatalog.id = :subjectCatalogId', {
        subjectCatalogId,
      });
    }
    if (teacherId || classLevelId) {
      queryBuilder.innerJoin('subjectCatalog.subjects', 'subjectsFilter');
      if (teacherId) {
        queryBuilder
          .innerJoin('subjectsFilter.teacher', 'teacherFilter')
          .andWhere('teacherFilter.id = :teacherId', { teacherId });
      }
      if (classLevelId) {
        queryBuilder
          .innerJoin('subjectsFilter.classLevels', 'classLevelsFilter')
          .andWhere('classLevelsFilter.id = :classLevelId', { classLevelId });
      }
    }

    if (query) {
      const queryForFeatures = { ...query };
      delete queryForFeatures.curriculumId;
      delete queryForFeatures.subjectCatalogId;
      delete queryForFeatures.academicTermId;
      delete queryForFeatures.teacherId;
      delete queryForFeatures.classLevelId;
      const apiFeatures = new APIFeatures(queryBuilder, queryForFeatures)
        .filter()
        .search(['name', 'description'])
        .sort()
        .limitFields()
        .paginate();

      const [topics, total] = await apiFeatures.getQuery().getManyAndCount();

      return {
        data: topics,
        total,
        page: parseInt(query.page ?? '1', 10),
        limit: parseInt(query.limit ?? '20', 10),
      };
    }

    const topics = await queryBuilder
      .orderBy('topic.order', 'ASC')
      .addOrderBy('topic.createdAt', 'ASC')
      .getMany();

    return topics;
  }

  async findAllTopicsByCurriculum(curriculumId: string, schoolId: string) {
    // Verify curriculum belongs to school and get its subject catalogs
    const curriculum = await this.curriculumRepository.findOne({
      where: { id: curriculumId, school: { id: schoolId } },
      relations: ['subjectCatalogs'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    // Get all topics for all subject catalogs in this curriculum
    const subjectCatalogIds = curriculum.subjectCatalogs.map((sc) => sc.id);

    if (subjectCatalogIds.length === 0) {
      return [];
    }

    const topics = await this.topicRepository.find({
      where: { subjectCatalog: { id: In(subjectCatalogIds) } },
      relations: [
        'subjectCatalog',
        'curriculum',
        'curriculum.academicTerm',
        'curriculum.academicTerm.academicCalendar',
      ],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return topics;
  }

  async findAllTopicsBySubjectCatalog(
    subjectCatalogId: string,
    schoolId: string,
  ) {
    // Verify subject catalog belongs to school
    const subjectCatalog = await this.subjectCatalogRepository.findOne({
      where: { id: subjectCatalogId },
      relations: ['school'],
    });

    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog not found');
    }

    if (subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException(
        'Subject catalog does not belong to your school',
      );
    }

    const topics = await this.topicRepository.find({
      where: { subjectCatalog: { id: subjectCatalogId } },
      relations: [
        'subjectCatalog',
        'curriculum',
        'curriculum.academicTerm',
        'curriculum.academicTerm.academicCalendar',
      ],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return topics;
  }

  async findOneTopic(topicId: string, schoolId: string) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: [
        'subjectCatalog',
        'subjectCatalog.school',
        'curriculum',
        'curriculum.academicTerm',
        'curriculum.academicTerm.academicCalendar',
      ],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }

    return topic;
  }

  async updateTopic(
    topicId: string,
    updateTopicDto: UpdateTopicDto,
    admin: SchoolAdmin,
  ) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school', 'curriculum'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Topic does not belong to your school');
    }

    // If subject catalog is being updated, validate it
    if (updateTopicDto.subjectCatalogId) {
      const subjectCatalog = await this.subjectCatalogRepository.findOne({
        where: { id: updateTopicDto.subjectCatalogId },
        relations: ['school'],
      });

      if (!subjectCatalog) {
        throw new NotFoundException('Subject catalog not found');
      }

      if (subjectCatalog.school.id !== admin.school.id) {
        throw new ForbiddenException(
          'Subject catalog does not belong to your school',
        );
      }

      topic.subjectCatalog = subjectCatalog;
    }

    // If curriculum is being updated, validate it
    if (updateTopicDto.curriculumId) {
      const curriculum = await this.curriculumRepository.findOne({
        where: { id: updateTopicDto.curriculumId },
        relations: ['school', 'subjectCatalogs'],
      });

      if (!curriculum) {
        throw new NotFoundException('Curriculum not found');
      }

      if (curriculum.school.id !== admin.school.id) {
        throw new ForbiddenException(
          'Curriculum does not belong to your school',
        );
      }

      // If subject catalog is also being updated, validate it belongs to curriculum
      // Otherwise, validate current subject catalog belongs to new curriculum
      const subjectCatalogIdToCheck =
        updateTopicDto.subjectCatalogId || topic.subjectCatalog.id;

      const isInCurriculum = curriculum.subjectCatalogs.some(
        (sc) => sc.id === subjectCatalogIdToCheck,
      );

      if (!isInCurriculum) {
        throw new BadRequestException(
          'Subject catalog does not belong to the specified curriculum',
        );
      }

      topic.curriculum = curriculum;
    }

    // Update other fields
    if (updateTopicDto.name !== undefined) {
      topic.name = updateTopicDto.name;
    }
    if (updateTopicDto.description !== undefined) {
      topic.description = updateTopicDto.description;
    }
    if (updateTopicDto.order !== undefined) {
      topic.order = updateTopicDto.order;
    }
    if (updateTopicDto.plannedStartDate !== undefined) {
      topic.plannedStartDate = updateTopicDto.plannedStartDate
        ? new Date(updateTopicDto.plannedStartDate)
        : null;
    }
    if (updateTopicDto.plannedEndDate !== undefined) {
      topic.plannedEndDate = updateTopicDto.plannedEndDate
        ? new Date(updateTopicDto.plannedEndDate)
        : null;
    }

    return await this.topicRepository.save(topic);
  }

  async removeTopic(topicId: string, admin: SchoolAdmin) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Topic does not belong to your school');
    }

    await this.topicRepository.remove(topic);
    return { message: 'Topic deleted successfully' };
  }

  // Subtopic CRUD (admin)
  async createSubtopic(
    topicId: string,
    createSubtopicDto: CreateSubtopicDto,
    admin: SchoolAdmin,
  ): Promise<Subtopic> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    const subtopic = this.subtopicRepository.create({
      name: createSubtopicDto.name,
      description: createSubtopicDto.description,
      topic,
      createdBy: 'admin',
    });
    return await this.subtopicRepository.save(subtopic);
  }

  async findSubtopicsByTopic(
    topicId: string,
    schoolId: string,
  ): Promise<Subtopic[]> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    return this.subtopicRepository.find({
      where: { topic: { id: topicId } },
      order: { createdAt: 'ASC' },
    });
  }

  async updateSubtopic(
    subtopicId: string,
    updateSubtopicDto: UpdateSubtopicDto,
    admin: SchoolAdmin,
  ): Promise<Subtopic> {
    const subtopic = await this.subtopicRepository.findOne({
      where: { id: subtopicId },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'topic.subjectCatalog.school',
      ],
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    if (subtopic.topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Subtopic does not belong to your school');
    }
    if (updateSubtopicDto.name !== undefined)
      subtopic.name = updateSubtopicDto.name;
    if (updateSubtopicDto.description !== undefined)
      subtopic.description = updateSubtopicDto.description;
    return await this.subtopicRepository.save(subtopic);
  }

  async removeSubtopic(subtopicId: string, admin: SchoolAdmin) {
    const subtopic = await this.subtopicRepository.findOne({
      where: { id: subtopicId },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'topic.subjectCatalog.school',
      ],
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    if (subtopic.topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Subtopic does not belong to your school');
    }
    await this.subtopicRepository.remove(subtopic);
    return { message: 'Subtopic deleted successfully' };
  }

  // Progress dashboard: subjects with their topics and progress per (subject, topic)
  async getProgressDashboard(
    schoolId: string,
    filters?: {
      curriculumId?: string;
      subjectCatalogId?: string;
      classLevelId?: string;
      teacherId?: string;
      academicTermId?: string;
    },
  ) {
    const qb = this.subjectRepository
      .createQueryBuilder('subject')
      .leftJoinAndSelect('subject.teacher', 'teacher')
      .leftJoinAndSelect('subject.subjectCatalog', 'subjectCatalog')
      .leftJoinAndSelect('subject.classLevels', 'classLevels')
      .leftJoinAndSelect('teacher.profile', 'teacherProfile')
      .where('subject.school.id = :schoolId', { schoolId });

    if (filters?.teacherId) {
      qb.andWhere('teacher.id = :teacherId', { teacherId: filters.teacherId });
    }
    if (filters?.subjectCatalogId) {
      qb.andWhere('subjectCatalog.id = :subjectCatalogId', {
        subjectCatalogId: filters.subjectCatalogId,
      });
    }
    if (filters?.classLevelId) {
      qb.andWhere('classLevels.id = :classLevelId', {
        classLevelId: filters.classLevelId,
      });
    }

    const subjects = await qb.getMany();
    const curriculumId = filters?.curriculumId;
    const academicTermId = filters?.academicTermId;

    const rows: Array<{
      subjectId: string;
      teacher: {
        id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      };
      classLevels: Array<{ id: string; name: string }>;
      subjectCatalog: { id: string; name: string };
      topics: Array<{
        topicId: string;
        name: string;
        description?: string;
        plannedStartDate: string | null;
        plannedEndDate: string | null;
        progressPercent: number;
        status: 'pending' | 'completed';
        dateCompleted: string | null;
      }>;
    }> = [];

    for (const subject of subjects) {
      let topicIds: string[] = [];
      if (curriculumId) {
        const curriculum = await this.curriculumRepository.findOne({
          where: { id: curriculumId, school: { id: schoolId } },
          relations: ['subjectCatalogs'],
        });
        if (!curriculum) continue;
        const hasCatalog = curriculum.subjectCatalogs?.some(
          (sc) => sc.id === subject.subjectCatalog.id,
        );
        if (!hasCatalog) continue;
        const topicsInCurriculum = await this.topicRepository.find({
          where: {
            subjectCatalog: { id: subject.subjectCatalog.id },
            curriculum: { id: curriculum.id },
          },
          order: { order: 'ASC' },
        });
        topicIds = topicsInCurriculum.map((t) => t.id);
      } else {
        const topicsForCatalog = await this.topicRepository.find({
          where: { subjectCatalog: { id: subject.subjectCatalog.id } },
          order: { order: 'ASC' },
        });
        topicIds = topicsForCatalog.map((t) => t.id);
      }

      const topicsWithProgress: Array<{
        topicId: string;
        name: string;
        description?: string;
        plannedStartDate: string | null;
        plannedEndDate: string | null;
        progressPercent: number;
        status: 'pending' | 'completed';
        dateCompleted: string | null;
      }> = [];

      for (const topicId of topicIds) {
        const topic = await this.topicRepository.findOne({
          where: { id: topicId },
          relations: ['subtopics', 'curriculum', 'curriculum.academicTerm'],
        });
        if (!topic) continue;
        const totalSubtopics = topic.subtopics?.length ?? 0;
        const termIdForProgress =
          academicTermId ?? topic.curriculum?.academicTerm?.id;
        const completionWhereBase = {
          subtopic: { topic: { id: topicId } },
          subject: { id: subject.id },
        };
        const completedCount = termIdForProgress
          ? await this.subtopicCompletionRepository.count({
              where: {
                ...completionWhereBase,
                academicTerm: { id: termIdForProgress },
              },
            })
          : 0;
        const progressPercent =
          totalSubtopics === 0
            ? 0
            : Math.round((completedCount / totalSubtopics) * 100);
        // Default status is pending; only completed when 100%
        const status: 'pending' | 'completed' =
          progressPercent < 100 ? 'pending' : 'completed';

        let dateCompleted: string | null = null;
        if (completedCount > 0 && termIdForProgress) {
          const lastCompletion =
            await this.subtopicCompletionRepository.findOne({
              where: {
                subject: { id: subject.id },
                subtopic: { topic: { id: topicId } },
                academicTerm: { id: termIdForProgress },
              },
              order: { completedAt: 'DESC' },
            });
          if (lastCompletion) {
            dateCompleted = lastCompletion.completedAt
              .toISOString()
              .split('T')[0];
          }
        }

        topicsWithProgress.push({
          topicId: topic.id,
          name: topic.name,
          description: topic.description ?? undefined,
          plannedStartDate: topic.plannedStartDate
            ? topic.plannedStartDate.toISOString().split('T')[0]
            : null,
          plannedEndDate: topic.plannedEndDate
            ? topic.plannedEndDate.toISOString().split('T')[0]
            : null,
          progressPercent,
          status,
          dateCompleted,
        });
      }

      const teacher = subject.teacher;
      rows.push({
        subjectId: subject.id,
        teacher: teacher
          ? {
              id: teacher.id,
              firstName: (teacher as any).firstName,
              lastName: (teacher as any).lastName,
              name:
                (teacher as any).name ??
                `${(teacher as any).firstName ?? ''} ${(teacher as any).lastName ?? ''}`.trim(),
            }
          : { id: '', firstName: '', lastName: '', name: 'Unassigned' },
        classLevels: (subject.classLevels || []).map((cl) => ({
          id: cl.id,
          name: cl.name,
        })),
        subjectCatalog: {
          id: subject.subjectCatalog.id,
          name: subject.subjectCatalog.name,
        },
        topics: topicsWithProgress,
      });
    }

    const flatRows: Array<{
      subjectId: string;
      teacher: {
        id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      };
      classLevels: Array<{ id: string; name: string }>;
      subjectCatalog: { id: string; name: string };
      topicId: string;
      topicName: string;
      topicDescription?: string;
      plannedStartDate: string | null;
      plannedEndDate: string | null;
      progressPercent: number;
      status: 'pending' | 'completed';
      dateCompleted: string | null;
    }> = [];
    for (const row of rows) {
      for (const t of row.topics) {
        flatRows.push({
          subjectId: row.subjectId,
          teacher: row.teacher,
          classLevels: row.classLevels,
          subjectCatalog: row.subjectCatalog,
          topicId: t.topicId,
          topicName: t.name,
          topicDescription: t.description,
          plannedStartDate: t.plannedStartDate,
          plannedEndDate: t.plannedEndDate,
          progressPercent: t.progressPercent,
          status: t.status,
          dateCompleted: t.dateCompleted,
        });
      }
    }

    const totalTopics = flatRows.length;
    const completedCount = flatRows.filter(
      (r) => r.status === 'completed',
    ).length;
    const pendingCount = flatRows.filter((r) => r.status === 'pending').length;
    const avgProgress =
      totalTopics === 0
        ? 0
        : Math.round(
            flatRows.reduce((acc, r) => acc + r.progressPercent, 0) /
              totalTopics,
          );

    return {
      summary: {
        totalTopics,
        completed: completedCount,
        pending: pendingCount,
        avgProgress,
      },
      rows: flatRows,
    };
  }

  async getTeacherProgressDashboard(
    teacherId: string,
    schoolId: string,
    filters: {
      academicTermId: string;
      subjectId?: string;
      classLevelId?: string;
    },
  ) {
    if (!filters.academicTermId) {
      throw new BadRequestException('academicTermId is required');
    }
    const academicTerm = await this.assertAcademicTermInSchool(
      filters.academicTermId,
      schoolId,
    );

    const assignedSubjects = await this.subjectRepository.find({
      where: { teacher: { id: teacherId }, school: { id: schoolId } },
      relations: ['subjectCatalog', 'classLevels'],
      order: { createdAt: 'ASC' },
    });

    if (assignedSubjects.length === 0) {
      return this.buildTeacherProgressEmptyResponse(academicTerm.id);
    }

    const selectedSubject = this.resolveTeacherDashboardSubjectSelection(
      assignedSubjects,
      filters.subjectId,
      filters.classLevelId,
    );
    if (!selectedSubject) {
      return this.buildTeacherProgressEmptyResponse(
        academicTerm.id,
        filters.classLevelId ?? null,
      );
    }

    const selectedClassLevelId =
      filters.classLevelId ?? selectedSubject.classLevels?.[0]?.id ?? null;

    const topicCards = await this.buildTeacherProgressTopicCards(
      selectedSubject,
      academicTerm,
    );
    const overall = this.computeTeacherProgressOverall(topicCards);

    return {
      selection: {
        academicTermId: academicTerm.id,
        subjectId: selectedSubject.id,
        classLevelId: selectedClassLevelId,
      },
      overall,
      topics: topicCards,
    };
  }

  /** Empty dashboard: clients load subject/class options from other teacher endpoints. */
  private buildTeacherProgressEmptyResponse(
    academicTermId: string,
    classLevelId: string | null = null,
  ) {
    return {
      selection: {
        academicTermId,
        subjectId: null as string | null,
        classLevelId,
      },
      overall: {
        totalTopics: 0,
        completedTopics: 0,
        pendingTopics: 0,
        avgProgress: 0,
        completedLabel: '0 of 0 topics completed',
      },
      topics: [] as any[],
    };
  }

  private resolveTeacherDashboardSubjectSelection(
    assignedSubjects: Subject[],
    subjectId?: string,
    classLevelId?: string,
  ) {
    const requestedSubject = subjectId
      ? assignedSubjects.find((s) => s.id === subjectId)
      : null;
    if (subjectId && !requestedSubject) {
      throw new ForbiddenException(
        'subjectId does not belong to this teacher in your school',
      );
    }
    const subjectsAfterClassFilter = classLevelId
      ? assignedSubjects.filter((s) =>
          (s.classLevels || []).some((cl) => cl.id === classLevelId),
        )
      : assignedSubjects;
    const selectedSubject =
      requestedSubject ?? subjectsAfterClassFilter[0] ?? null;
    if (
      selectedSubject &&
      classLevelId &&
      !(selectedSubject.classLevels || []).some((cl) => cl.id === classLevelId)
    ) {
      throw new BadRequestException(
        'classLevelId is not assigned to the selected teacher subject',
      );
    }
    return selectedSubject;
  }

  private async buildTeacherProgressTopicCards(
    selectedSubject: Subject,
    academicTerm: AcademicTerm,
  ) {
    const topics = await this.topicRepository.find({
      where: { subjectCatalog: { id: selectedSubject.subjectCatalog.id } },
      relations: ['subtopics'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    const allSubtopicIds = topics.flatMap((t) =>
      (t.subtopics || []).map((s) => s.id),
    );
    const completions =
      allSubtopicIds.length > 0
        ? await this.subtopicCompletionRepository.find({
            where: {
              subject: { id: selectedSubject.id },
              academicTerm: { id: academicTerm.id },
              subtopic: { id: In(allSubtopicIds) },
            },
            relations: ['subtopic'],
          })
        : [];
    const completionBySubtopicId = new Map(
      completions.map((c) => [c.subtopic.id, c]),
    );

    const topicCards: any[] = [];
    for (const topic of topics) {
      const subtopics = [...(topic.subtopics || [])].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      const completedCount = subtopics.filter((s) =>
        completionBySubtopicId.has(s.id),
      ).length;
      const totalSubtopics = subtopics.length;
      const progressPercent =
        totalSubtopics === 0
          ? 0
          : Math.round((completedCount / totalSubtopics) * 100);
      const status: 'pending' | 'completed' =
        progressPercent >= 100 ? 'completed' : 'pending';
      const weekLabel = this.computeWeekLabel(
        topic.plannedStartDate,
        academicTerm,
      );
      const notesCount = await this.getTeacherTopicNotesCount(
        topic.id,
        selectedSubject.id,
        academicTerm.id,
      );

      topicCards.push({
        topicId: topic.id,
        name: topic.name,
        description: topic.description ?? null,
        plannedStartDate: topic.plannedStartDate
          ? topic.plannedStartDate.toISOString().split('T')[0]
          : null,
        plannedEndDate: topic.plannedEndDate
          ? topic.plannedEndDate.toISOString().split('T')[0]
          : null,
        progressPercent,
        status,
        weekLabel,
        subtopicCounts: { total: totalSubtopics, completed: completedCount },
        notesCount,
        subtopics: subtopics.map((s) => {
          const completion = completionBySubtopicId.get(s.id);
          return {
            id: s.id,
            name: s.name,
            completed: Boolean(completion),
            completedAt: completion
              ? completion.completedAt.toISOString().split('T')[0]
              : null,
          };
        }),
      });
    }
    return topicCards;
  }

  private computeWeekLabel(
    plannedStartDate: Date | null,
    academicTerm: AcademicTerm,
  ): string | null {
    if (!plannedStartDate || !academicTerm.startDate) return null;
    const start = new Date(plannedStartDate);
    const termStart = new Date(academicTerm.startDate);
    const daysFromTermStart = Math.floor(
      (start.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekNumber = Math.max(1, Math.floor(daysFromTermStart / 7) + 1);
    return `W${weekNumber}`;
  }

  private async getTeacherTopicNotesCount(
    topicId: string,
    subjectId: string,
    academicTermId: string,
  ): Promise<number> {
    return this.curriculumTopicNoteRepository
      .createQueryBuilder('note')
      .where('note.topic.id = :topicId', { topicId })
      .andWhere('note.parent IS NULL')
      .andWhere('(note.subject.id = :subjectId OR note.subject.id IS NULL)', {
        subjectId,
      })
      .andWhere(
        '(note.academicTerm.id = :academicTermId OR note.academicTerm.id IS NULL)',
        { academicTermId },
      )
      .getCount();
  }

  private computeTeacherProgressOverall(
    topicCards: Array<{
      progressPercent: number;
      status: 'pending' | 'completed';
    }>,
  ) {
    const totalTopics = topicCards.length;
    const completedTopics = topicCards.filter(
      (t) => t.status === 'completed',
    ).length;
    const pendingTopics = totalTopics - completedTopics;
    const avgProgress =
      totalTopics === 0
        ? 0
        : Math.round(
            topicCards.reduce((acc, t) => acc + t.progressPercent, 0) /
              totalTopics,
          );
    return {
      totalTopics,
      completedTopics,
      pendingTopics,
      avgProgress,
      completedLabel: `${completedTopics} of ${totalTopics} topics completed`,
    };
  }

  // Topic detail for a given subject: topic + subtopics with completion state
  async getTopicDetail(
    topicId: string,
    subjectId: string,
    schoolId: string,
    academicTermId?: string,
  ) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: [
        'subjectCatalog',
        'subjectCatalog.school',
        'curriculum',
        'curriculum.academicTerm',
        'subtopics',
      ],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }

    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, school: { id: schoolId } },
      relations: ['subjectCatalog', 'teacher', 'classLevels'],
    });
    if (!subject) throw new NotFoundException('Subject not found');
    if (subject.subjectCatalog.id !== topic.subjectCatalog.id) {
      throw new BadRequestException(
        'Subject does not belong to the same subject catalog as the topic',
      );
    }

    const resolvedTermId = academicTermId ?? topic.curriculum?.academicTerm?.id;
    if (!resolvedTermId) {
      throw new BadRequestException(
        'academicTermId is required when the topic has no curriculum academic term',
      );
    }
    const academicTermEntity = await this.assertAcademicTermInSchool(
      resolvedTermId,
      schoolId,
    );

    const totalSubtopics = topic.subtopics?.length ?? 0;
    const completions = await this.subtopicCompletionRepository.find({
      where: {
        subject: { id: subjectId },
        subtopic: { topic: { id: topicId } },
        academicTerm: { id: resolvedTermId },
      },
      relations: ['subtopic'],
    });
    const completedCount = completions.length;
    const progressPercent =
      totalSubtopics === 0
        ? 0
        : Math.round((completedCount / totalSubtopics) * 100);
    // Default status is pending; only completed when 100%
    const status: 'pending' | 'completed' =
      progressPercent < 100 ? 'pending' : 'completed';

    let dateCompleted: string | null = null;
    if (completions.length > 0) {
      const latest = completions.reduce((a, b) =>
        a.completedAt > b.completedAt ? a : b,
      );
      dateCompleted = latest.completedAt.toISOString().split('T')[0];
    }

    const subtopicsWithCompletion = (topic.subtopics || []).map((st) => {
      const comp = completions.find((c) => c.subtopic.id === st.id);
      return {
        id: st.id,
        name: st.name,
        description: st.description,
        completed: !!comp,
        completedAt: comp ? comp.completedAt.toISOString().split('T')[0] : null,
      };
    });

    // Derive week duration and week label from planned dates
    let weekDuration: number | null = null;
    let weekNumber: number | null = null;
    let weekLabel: string | null = null;
    if (topic.plannedStartDate && topic.plannedEndDate) {
      const start = new Date(topic.plannedStartDate);
      const end = new Date(topic.plannedEndDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      weekDuration = Math.max(1, Math.ceil(diffDays / 7));
      const termForWeek = academicTermEntity;
      if (termForWeek?.startDate) {
        const termStart = new Date(termForWeek.startDate);
        const daysFromTermStart = Math.floor(
          (start.getTime() - termStart.getTime()) / (1000 * 60 * 60 * 24),
        );
        weekNumber = Math.max(1, Math.floor(daysFromTermStart / 7) + 1);
        weekLabel = `Week ${weekNumber}`;
      }
    }

    const teacher = subject.teacher;
    const teacherDisplay =
      teacher != null
        ? {
            id: teacher.id,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            name:
              [teacher.firstName, teacher.lastName]
                .filter(Boolean)
                .join(' ')
                .trim() || teacher.email,
          }
        : null;

    return {
      topic: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        plannedStartDate: topic.plannedStartDate
          ? topic.plannedStartDate.toISOString().split('T')[0]
          : null,
        plannedEndDate: topic.plannedEndDate
          ? topic.plannedEndDate.toISOString().split('T')[0]
          : null,
        progressPercent,
        status,
        dateCompleted,
        weekDuration,
        weekNumber,
        weekLabel,
      },
      subject: {
        id: subject.id,
        subjectCatalog: {
          id: subject.subjectCatalog.id,
          name: subject.subjectCatalog.name,
        },
        teacher: teacherDisplay,
        classLevels: (subject.classLevels || []).map((cl) => ({
          id: cl.id,
          name: cl.name,
        })),
      },
      academicTerm: {
        id: academicTermEntity.id,
        termName: academicTermEntity.termName,
      },
      subtopics: subtopicsWithCompletion,
    };
  }

  // Notes
  async createNote(
    dto: CreateCurriculumTopicNoteDto,
    admin: SchoolAdmin,
  ): Promise<CurriculumTopicNote> {
    const topic = await this.topicRepository.findOne({
      where: { id: dto.topicId },
      relations: [
        'subjectCatalog',
        'subjectCatalog.school',
        'curriculum',
        'curriculum.academicTerm',
      ],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    let subject: Subject | null = null;
    if (dto.subjectId) {
      const sub = await this.subjectRepository.findOne({
        where: { id: dto.subjectId, school: { id: admin.school.id } },
      });
      if (!sub) throw new NotFoundException('Subject not found');
      subject = sub;
    }
    let parent: CurriculumTopicNote | null = null;
    if (dto.parentId) {
      parent = await this.curriculumTopicNoteRepository.findOne({
        where: { id: dto.parentId },
        relations: ['topic'],
      });
      if (!parent) throw new NotFoundException('Parent note not found');
      if (parent.topic.id !== dto.topicId) {
        throw new BadRequestException(
          'Parent note does not belong to this topic',
        );
      }
    }
    let noteAcademicTerm: AcademicTerm | null = null;
    if (dto.academicTermId) {
      noteAcademicTerm = await this.assertAcademicTermInSchool(
        dto.academicTermId,
        admin.school.id,
      );
    } else if (topic.curriculum?.academicTerm) {
      noteAcademicTerm = topic.curriculum.academicTerm;
    }
    const note = this.curriculumTopicNoteRepository.create({
      topic,
      subject: subject ?? undefined,
      academicTerm: noteAcademicTerm ?? undefined,
      authorId: admin.id,
      authorRole: 'school_admin',
      content: dto.content,
      parent: parent ?? undefined,
    });
    return await this.curriculumTopicNoteRepository.save(note);
  }

  async getNotesForTopic(
    topicId: string,
    schoolId: string,
    subjectId?: string,
    academicTermId?: string,
  ): Promise<CurriculumTopicNote[]> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    const qb = this.curriculumTopicNoteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.replies', 'replies')
      .leftJoinAndSelect('note.subject', 'subject')
      .leftJoinAndSelect('note.academicTerm', 'academicTerm')
      .where('note.topic.id = :topicId', { topicId })
      .andWhere('note.parent IS NULL');
    if (subjectId) {
      qb.andWhere('(note.subject.id = :subjectId OR note.subject.id IS NULL)', {
        subjectId,
      });
    }
    if (academicTermId) {
      qb.andWhere(
        '(note.academicTerm.id = :academicTermId OR note.academicTerm.id IS NULL)',
        { academicTermId },
      );
    }
    qb.orderBy('note.createdAt', 'ASC').addOrderBy('replies.createdAt', 'ASC');
    return qb.getMany();
  }

  async deleteNote(noteId: string, admin: SchoolAdmin) {
    const note = await this.curriculumTopicNoteRepository.findOne({
      where: { id: noteId },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'topic.subjectCatalog.school',
      ],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.topic.subjectCatalog.school.id !== admin.school.id) {
      throw new ForbiddenException('Note does not belong to your school');
    }
    await this.curriculumTopicNoteRepository.remove(note);
    return { message: 'Note deleted successfully' };
  }

  // ---- Teacher-scoped methods (called from TeacherController) ----
  async findSubtopicsByTopicAsTeacher(
    topicId: string,
    teacherId: string,
    schoolId: string,
  ): Promise<Subtopic[]> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    const teacherSubject = await this.subjectRepository.findOne({
      where: {
        teacher: { id: teacherId },
        subjectCatalog: { id: topic.subjectCatalog.id },
      },
    });
    if (!teacherSubject) {
      throw new ForbiddenException('You do not teach this subject');
    }
    return this.subtopicRepository.find({
      where: { topic: { id: topicId } },
      order: { createdAt: 'ASC' },
    });
  }

  async createSubtopicAsTeacher(
    topicId: string,
    dto: CreateSubtopicDto,
    _teacherId: string,
    teacherIdentifier: string,
    schoolId: string,
  ): Promise<Subtopic> {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    const subtopic = this.subtopicRepository.create({
      name: dto.name,
      description: dto.description,
      topic,
      createdBy: teacherIdentifier,
    });
    return await this.subtopicRepository.save(subtopic);
  }

  async updateSubtopicAsTeacher(
    subtopicId: string,
    dto: UpdateSubtopicDto,
    teacherIdentifier: string,
    schoolId: string,
  ): Promise<Subtopic> {
    const subtopic = await this.subtopicRepository.findOne({
      where: { id: subtopicId },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'topic.subjectCatalog.school',
      ],
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    if (subtopic.topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Subtopic does not belong to your school');
    }
    if (subtopic.createdBy !== teacherIdentifier) {
      throw new ForbiddenException('You can only edit subtopics you created');
    }
    if (dto.name !== undefined) subtopic.name = dto.name;
    if (dto.description !== undefined) subtopic.description = dto.description;
    return await this.subtopicRepository.save(subtopic);
  }

  async removeSubtopicAsTeacher(
    subtopicId: string,
    teacherIdentifier: string,
    schoolId: string,
  ) {
    const subtopic = await this.subtopicRepository.findOne({
      where: { id: subtopicId },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'topic.subjectCatalog.school',
      ],
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    if (subtopic.topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Subtopic does not belong to your school');
    }
    if (subtopic.createdBy !== teacherIdentifier) {
      throw new ForbiddenException('You can only delete subtopics you created');
    }
    await this.subtopicRepository.remove(subtopic);
    return { message: 'Subtopic deleted successfully' };
  }

  async markSubtopicComplete(
    subtopicId: string,
    subjectId: string,
    teacherId: string,
    schoolId: string,
    academicTermId?: string,
  ) {
    const subtopic = await this.subtopicRepository.findOne({
      where: { id: subtopicId },
      relations: [
        'topic',
        'topic.subjectCatalog',
        'topic.subjectCatalog.school',
        'topic.curriculum',
        'topic.curriculum.academicTerm',
      ],
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    if (subtopic.topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Subtopic does not belong to your school');
    }
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, school: { id: schoolId } },
      relations: ['teacher', 'subjectCatalog'],
    });
    if (!subject) throw new NotFoundException('Subject not found');
    if (subject.teacher?.id !== teacherId) {
      throw new ForbiddenException(
        'You can only mark complete for your own subjects',
      );
    }
    if (subject.subjectCatalog.id !== subtopic.topic.subjectCatalog.id) {
      throw new BadRequestException(
        'Subject does not match topic subject catalog',
      );
    }
    const resolvedTermId =
      academicTermId ?? subtopic.topic.curriculum?.academicTerm?.id;
    if (!resolvedTermId) {
      throw new BadRequestException(
        'academicTermId is required when the topic has no curriculum academic term',
      );
    }
    const academicTerm = await this.assertAcademicTermInSchool(
      resolvedTermId,
      schoolId,
    );
    const existing = await this.subtopicCompletionRepository.findOne({
      where: {
        subtopic: { id: subtopicId },
        subject: { id: subjectId },
        academicTerm: { id: academicTerm.id },
      },
    });
    if (existing) return existing;
    const completion = this.subtopicCompletionRepository.create({
      subtopic,
      subject,
      academicTerm,
      completedBy: teacherId,
    });
    return await this.subtopicCompletionRepository.save(completion);
  }

  async unmarkSubtopicComplete(
    subtopicId: string,
    subjectId: string,
    teacherId: string,
    schoolId: string,
    academicTermId?: string,
  ) {
    const subject = await this.subjectRepository.findOne({
      where: { id: subjectId, school: { id: schoolId } },
      relations: ['teacher'],
    });
    if (!subject) throw new NotFoundException('Subject not found');
    if (subject.teacher?.id !== teacherId) {
      throw new ForbiddenException('You can only unmark for your own subjects');
    }
    const subtopic = await this.subtopicRepository.findOne({
      where: { id: subtopicId },
      relations: ['topic', 'topic.curriculum', 'topic.curriculum.academicTerm'],
    });
    if (!subtopic) throw new NotFoundException('Subtopic not found');
    const resolvedTermId =
      academicTermId ?? subtopic.topic.curriculum?.academicTerm?.id;
    if (!resolvedTermId) {
      throw new BadRequestException(
        'academicTermId is required when the topic has no curriculum academic term',
      );
    }
    await this.assertAcademicTermInSchool(resolvedTermId, schoolId);
    const completion = await this.subtopicCompletionRepository.findOne({
      where: {
        subtopic: { id: subtopicId },
        subject: { id: subjectId },
        academicTerm: { id: resolvedTermId },
      },
    });
    if (!completion) throw new NotFoundException('Completion record not found');
    await this.subtopicCompletionRepository.remove(completion);
    return { message: 'Subtopic marked incomplete' };
  }

  async createNoteReplyAsTeacher(
    dto: CreateCurriculumTopicNoteDto,
    teacherId: string,
    schoolId: string,
  ): Promise<CurriculumTopicNote> {
    if (!dto.parentId) {
      throw new BadRequestException('Reply must have a parent note');
    }
    const topic = await this.topicRepository.findOne({
      where: { id: dto.topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    if (topic.subjectCatalog.school.id !== schoolId) {
      throw new ForbiddenException('Topic does not belong to your school');
    }
    const parent = await this.curriculumTopicNoteRepository.findOne({
      where: { id: dto.parentId },
      relations: ['topic', 'subject', 'academicTerm'],
    });
    if (!parent) throw new NotFoundException('Parent note not found');
    if (parent.topic.id !== dto.topicId) {
      throw new BadRequestException(
        'Parent note does not belong to this topic',
      );
    }
    const note = this.curriculumTopicNoteRepository.create({
      topic,
      subject: parent.subject ?? undefined,
      academicTerm: parent.academicTerm ?? undefined,
      authorId: teacherId,
      authorRole: 'teacher',
      content: dto.content,
      parent,
    });
    return await this.curriculumTopicNoteRepository.save(note);
  }
}

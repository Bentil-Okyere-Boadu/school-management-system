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
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
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
    @InjectRepository(SubjectCatalog)
    private subjectCatalogRepository: Repository<SubjectCatalog>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
  ) {}

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

    // Validate academic term exists
    const academicTerm = await this.academicTermRepository.findOne({
      where: { id: academicTermId },
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

    // Check if curriculum already exists for these subject catalogs and term
    // Using In operator to check if any of the subject catalogs already have a curriculum
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

    return {
      data: curricula,
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

    // If academic term is being updated, validate it
    if (updateCurriculumDto.academicTermId) {
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

      // Check if another curriculum exists for the new subject catalogs and term combination
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
    const { name, description, order, subjectCatalogId, curriculumId } =
      createTopicDto;

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
      subjectCatalog,
    });

    return await this.topicRepository.save(topic);
  }

  async findAllTopics(schoolId: string, query?: QueryString) {
    // Get all topics for all subject catalogs in the school
    const queryBuilder = this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.subjectCatalog', 'subjectCatalog')
      .leftJoin('subjectCatalog.school', 'school')
      .where('school.id = :schoolId', { schoolId });

    if (query) {
      const apiFeatures = new APIFeatures(queryBuilder, query)
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
      relations: ['subjectCatalog'],
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
      relations: ['subjectCatalog'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return topics;
  }

  async findOneTopic(topicId: string, schoolId: string) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['subjectCatalog', 'subjectCatalog.school'],
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
      relations: ['subjectCatalog', 'subjectCatalog.school'],
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

      // If curriculumId is provided, validate subject catalog belongs to it
      if (updateTopicDto.curriculumId) {
        const curriculum = await this.curriculumRepository.findOne({
          where: { id: updateTopicDto.curriculumId },
          relations: ['subjectCatalogs'],
        });

        if (!curriculum) {
          throw new NotFoundException('Curriculum not found');
        }

        const isInCurriculum = curriculum.subjectCatalogs.some(
          (sc) => sc.id === updateTopicDto.subjectCatalogId,
        );

        if (!isInCurriculum) {
          throw new BadRequestException(
            'Subject catalog does not belong to the specified curriculum',
          );
        }
      }

      topic.subjectCatalog = subjectCatalog;
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
}

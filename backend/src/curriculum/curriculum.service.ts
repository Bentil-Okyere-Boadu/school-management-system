import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const { name, description, isActive, subjectCatalogId, academicTermId } =
      createCurriculumDto;

    // Validate school admin has a school
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    // Validate subject catalog exists and belongs to the school
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

    // Check if curriculum already exists for this subject catalog and term
    const existingCurriculum = await this.curriculumRepository.findOne({
      where: {
        subjectCatalog: { id: subjectCatalogId },
        academicTerm: { id: academicTermId },
        school: { id: admin.school.id },
      },
    });

    if (existingCurriculum) {
      throw new BadRequestException(
        'Curriculum already exists for this subject catalog and academic term',
      );
    }

    // Create curriculum
    const curriculum = this.curriculumRepository.create({
      name,
      description,
      isActive: isActive ?? true,
      subjectCatalog,
      school: admin.school,
      academicTerm,
    });

    return await this.curriculumRepository.save(curriculum);
  }

  async findAll(schoolId: string, query: QueryString) {
    const queryBuilder = this.curriculumRepository
      .createQueryBuilder('curriculum')
      .leftJoinAndSelect('curriculum.subjectCatalog', 'subjectCatalog')
      .leftJoinAndSelect('curriculum.academicTerm', 'academicTerm')
      .leftJoinAndSelect('academicTerm.academicCalendar', 'academicCalendar')
      .leftJoinAndSelect('curriculum.topics', 'topics')
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
        'subjectCatalog',
        'academicTerm',
        'academicTerm.academicCalendar',
        'topics',
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
      relations: ['subjectCatalog', 'academicTerm'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    // If subject catalog is being updated, validate it
    if (updateCurriculumDto.subjectCatalogId) {
      const subjectCatalog = await this.subjectCatalogRepository.findOne({
        where: { id: updateCurriculumDto.subjectCatalogId },
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

      curriculum.subjectCatalog = subjectCatalog;
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

      // Check if another curriculum exists for the new subject catalog and term combination
      const existingCurriculum = await this.curriculumRepository.findOne({
        where: {
          subjectCatalog: { id: curriculum.subjectCatalog.id },
          academicTerm: { id: updateCurriculumDto.academicTermId },
          school: { id: admin.school.id },
        },
      });

      if (existingCurriculum && existingCurriculum.id !== id) {
        throw new BadRequestException(
          'Another curriculum already exists for this subject catalog and academic term',
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
      relations: ['topics'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    // Delete associated topics first (cascade should handle this, but being explicit)
    if (curriculum.topics && curriculum.topics.length > 0) {
      await this.topicRepository.remove(curriculum.topics);
    }

    await this.curriculumRepository.remove(curriculum);
    return { message: 'Curriculum deleted successfully' };
  }

  // Topic CRUD operations
  async createTopic(createTopicDto: CreateTopicDto, admin: SchoolAdmin) {
    const { name, description, order, curriculumId } = createTopicDto;

    // Validate curriculum exists and belongs to the school
    const curriculum = await this.curriculumRepository.findOne({
      where: { id: curriculumId },
      relations: ['school'],
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    if (curriculum.school.id !== admin.school.id) {
      throw new ForbiddenException('Curriculum does not belong to your school');
    }

    // Create topic
    const topic = this.topicRepository.create({
      name,
      description,
      order: order ?? 0,
      curriculum,
    });

    return await this.topicRepository.save(topic);
  }

  async findAllTopics(curriculumId: string, schoolId: string) {
    // Verify curriculum belongs to school
    const curriculum = await this.curriculumRepository.findOne({
      where: { id: curriculumId, school: { id: schoolId } },
    });

    if (!curriculum) {
      throw new NotFoundException('Curriculum not found');
    }

    const topics = await this.topicRepository.find({
      where: { curriculum: { id: curriculumId } },
      relations: ['curriculum'],
      order: { order: 'ASC', createdAt: 'ASC' },
    });

    return topics;
  }

  async findOneTopic(topicId: string, schoolId: string) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: [
        'curriculum',
        'curriculum.school',
        'curriculum.subjectCatalog',
      ],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.curriculum.school.id !== schoolId) {
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
      relations: ['curriculum', 'curriculum.school'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.curriculum.school.id !== admin.school.id) {
      throw new ForbiddenException('Topic does not belong to your school');
    }

    // If curriculum is being updated, validate it
    if (updateTopicDto.curriculumId) {
      const curriculum = await this.curriculumRepository.findOne({
        where: { id: updateTopicDto.curriculumId },
        relations: ['school'],
      });

      if (!curriculum) {
        throw new NotFoundException('Curriculum not found');
      }

      if (curriculum.school.id !== admin.school.id) {
        throw new ForbiddenException(
          'Curriculum does not belong to your school',
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

    return await this.topicRepository.save(topic);
  }

  async removeTopic(topicId: string, admin: SchoolAdmin) {
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
      relations: ['curriculum', 'curriculum.school'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    if (topic.curriculum.school.id !== admin.school.id) {
      throw new ForbiddenException('Topic does not belong to your school');
    }

    await this.topicRepository.remove(topic);
    return { message: 'Topic deleted successfully' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Teacher } from '../teacher/teacher.entity';
import { ClassLevel } from '../class-level/class-level.entity';
import { SubjectCatalog } from './subject-catalog.entity';
import { School } from '../school/school.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(SubjectCatalog)
    private subjectCatalogRepository: Repository<SubjectCatalog>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
  ) {}

  async create(createSubjectDto: CreateSubjectDto, admin: SchoolAdmin) {
    const { subjectCatalogId, classLevelIds, teacherId } = createSubjectDto;

    // Validate subject catalog
    const subjectCatalog = await this.subjectCatalogRepository.findOne({
      where: { id: subjectCatalogId },
    });
    if (!subjectCatalog) {
      throw new NotFoundException('Subject catalog entry not found');
    }

    // Validate teacher
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Validate admin and school
    if (!admin.school) {
      throw new NotFoundException('Admin is not associated with a school');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: admin.school.id },
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Check if subject already exists for (catalog + teacher + school)
    let subject = await this.subjectRepository.findOne({
      where: {
        subjectCatalog: { id: subjectCatalog.id },
        teacher: { id: teacher.id },
        school: { id: school.id },
      },
      relations: ['classLevels'],
    });

    if (!subject) {
      subject = this.subjectRepository.create({
        subjectCatalog,
        teacher,
        school,
        classLevels: [],
      });
    }

    // Fetch class levels
    const classLevels = await Promise.all(
      classLevelIds.map(async (id) => {
        const level = await this.classLevelRepository.findOne({
          where: { id },
        });
        if (!level) {
          throw new NotFoundException(`Class level not found: ${id}`);
        }
        return level;
      }),
    );

    subject.classLevels = classLevels;
    const saved = await this.subjectRepository.save(subject);

    return {
      id: saved.id,
      subjectCatalog: {
        id: subjectCatalog.id,
        name: subjectCatalog.name,
      },
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
      },
      classLevels: classLevels.map((level) => ({
        id: level.id,
        name: level.name,
      })),
    };
  }

  async update(
    id: string,
    updateSubjectDto: UpdateSubjectDto,
    admin: SchoolAdmin,
  ) {
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['classLevels', 'subjectCatalog', 'teacher'],
    });

    if (!subject) throw new NotFoundException('Subject not found');

    if (updateSubjectDto.subjectCatalogId) {
      const subjectCatalog = await this.subjectCatalogRepository.findOne({
        where: { id: updateSubjectDto.subjectCatalogId },
      });
      if (!subjectCatalog)
        throw new NotFoundException('Subject catalog not found');
      subject.subjectCatalog = subjectCatalog;
    }

    if (updateSubjectDto.teacherId) {
      const foundTeacher = await this.teacherRepository.findOne({
        where: { id: updateSubjectDto.teacherId },
      });
      if (!foundTeacher) throw new NotFoundException('Teacher not found');
      subject.teacher = foundTeacher;
    }

    if (
      updateSubjectDto.classLevelIds &&
      updateSubjectDto.classLevelIds.length > 0
    ) {
      const classLevels: ClassLevel[] = [];
      for (const classLevelId of updateSubjectDto.classLevelIds) {
        const classLevel = await this.classLevelRepository.findOne({
          where: { id: classLevelId },
        });
        if (!classLevel)
          throw new NotFoundException(`Class level not found: ${classLevelId}`);
        classLevels.push(classLevel);
      }
      subject.classLevels = classLevels;
    }

    const saved = await this.subjectRepository.save(subject);

    return {
      id: saved.id,
      subjectCatalog: {
        id: saved.subjectCatalog.id,
        name: saved.subjectCatalog.name,
      },
      teacher: {
        id: saved.teacher.id,
        firstName: saved.teacher.firstName,
        lastName: saved.teacher.lastName,
        fullName: `${saved.teacher.firstName} ${saved.teacher.lastName}`,
        email: saved.teacher.email,
      },
      classLevels: saved.classLevels.map((level) => ({
        id: level.id,
        name: level.name,
      })),
    };
  }

  async remove(id: string, admin: SchoolAdmin): Promise<void> {
    const subject = await this.subjectRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    await this.subjectRepository.delete(subject.id);
  }
}

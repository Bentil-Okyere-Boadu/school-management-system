import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClassLevel } from './class-level.entity';
import { UpdateClassLevelDto } from './dto/update-class-level.dto';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';

@Injectable()
export class ClassLevelService {
  constructor(
    @InjectRepository(ClassLevel)
    private readonly classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(
    createClassLevelDto: CreateClassLevelDto,
    admin: SchoolAdmin,
  ): Promise<ClassLevel> {
    const { name, description, teacherIds, studentIds } = createClassLevelDto;

    const classLevel = this.classLevelRepository.create({
      name,
      description,
      school: { id: admin.school.id },
    });

    if (teacherIds) {
      classLevel.teachers = await this.teacherRepository.findBy({
        id: In(teacherIds),
      });
    }
    if (studentIds) {
      classLevel.students = await this.studentRepository.findBy({
        id: In(studentIds),
      });
    }

    return this.classLevelRepository.save(classLevel);
  }

  async update(
    id: string,
    updateClassLevelDto: UpdateClassLevelDto,
    admin: SchoolAdmin,
  ): Promise<ClassLevel> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['teachers', 'students'],
    });

    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }

    // Update basic properties
    if (updateClassLevelDto.name) {
      classLevel.name = updateClassLevelDto.name;
    }
    if (updateClassLevelDto.description) {
      classLevel.description = updateClassLevelDto.description;
    }

    // Update teacher associations
    if (updateClassLevelDto.teacherIds) {
      classLevel.teachers = await this.teacherRepository.findBy({
        id: In(updateClassLevelDto.teacherIds),
      });
    }

    // Update student associations
    if (updateClassLevelDto.studentIds) {
      classLevel.students = await this.studentRepository.findBy({
        id: In(updateClassLevelDto.studentIds),
      });
    }

    return this.classLevelRepository.save(classLevel);
  }
  async getClassLevelNameById(
    id: string,
  ): Promise<{ id: string; name: string }> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id },
      select: ['id', 'name'],
    });
    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }
    return classLevel;
  }
  async findOne(id: string, admin: SchoolAdmin): Promise<ClassLevel> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id, school: { id: admin.school.id } },
      relations: ['teachers', 'students'],
    });

    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }

    return classLevel;
  }
  async remove(id: string, admin: SchoolAdmin): Promise<{ message: string }> {
    const classLevel = await this.classLevelRepository.findOne({
      where: { id, school: { id: admin.school.id } },
    });

    if (!classLevel) {
      throw new NotFoundException(`Class level with ID ${id} not found`);
    }

    await this.classLevelRepository.remove(classLevel);
    return { message: 'Class level deleted successfully' };
  }
  async findAll(admin: SchoolAdmin): Promise<ClassLevel[]> {
    return this.classLevelRepository.find({
      where: { school: { id: admin.school.id } },
      relations: ['teachers', 'students'],
    });
  }

  async getClassesForTeacher(teacherId: string, query?: QueryString) {
    const queryBuilder = this.classLevelRepository
      .createQueryBuilder('classLevel')
      .leftJoinAndSelect('classLevel.teachers', 'teacher')
      .where('teacher.id = :teacherId', { teacherId })
      .loadRelationCountAndMap(
        'classLevel.studentCount',
        'classLevel.students',
      );

    if (query) {
      const features = new APIFeatures(queryBuilder, query).search(['name']);
      return features.getQuery().getMany();
    }
    return queryBuilder.getMany();
  }
}

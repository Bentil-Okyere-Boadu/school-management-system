import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from './school-admin.entity';
import { Student } from 'src/student/student.entity';
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';
import { School } from 'src/school/school.entity';
import { ProfileService } from 'src/profile/profile.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { Teacher } from 'src/teacher/teacher.entity';
@Injectable()
export class SchoolAdminService {
  private readonly logger = new Logger(SchoolAdminService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private readonly profileService: ProfileService,
  ) {}

  async findAll(): Promise<SchoolAdmin[]> {
    return this.schoolAdminRepository.find();
  }

  async findOne(id: string): Promise<SchoolAdmin> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { id },
    });

    if (!schoolAdmin) {
      throw new NotFoundException(`School admin with ID ${id} not found`);
    }

    return schoolAdmin;
  }

  async update(
    id: string,
    updateSchoolAdminDto: Partial<SchoolAdmin>,
  ): Promise<SchoolAdmin> {
    const schoolAdmin = await this.findOne(id);
    Object.assign(schoolAdmin, updateSchoolAdminDto);
    return this.schoolAdminRepository.save(schoolAdmin);
  }

  async remove(id: string): Promise<void> {
    const schoolAdmin = await this.findOne(id);
    await this.schoolAdminRepository.remove(schoolAdmin);
  }

  async findAllStudents(schoolId: string, queryString: QueryString) {
    const baseQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived: false });

    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      queryString,
    )
      .filter()
      .sort()
      .search()
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    const featuresWithPagination = featuresWithoutPagination.paginate();
    const data = await featuresWithPagination.getQuery().getMany();

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAllUsers(schoolId: string, queryString: QueryString) {
    let isArchived = false;
    if (queryString.status === 'archived') {
      isArchived = true;
    } else if (queryString.status === 'active' || !queryString.status) {
      isArchived = false;
    } else {
      isArchived = false;
    }

    // Get students
    const studentsQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived });

    const studentsFeatures = new APIFeatures(studentsQuery, queryString)
      .filter()
      .sort()
      .search()
      .limitFields()
      .paginate();

    const students = await studentsFeatures.getQuery().getMany();

    // Get teachers
    const teachersQuery = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.role', 'role')
      .leftJoinAndSelect('teacher.school', 'school')
      .where('teacher.school.id = :schoolId', { schoolId })
      .andWhere('teacher.isArchived = :isArchived', { isArchived });

    const teachersFeatures = new APIFeatures(teachersQuery, queryString)
      .filter()
      .sort()
      .search()
      .limitFields()
      .paginate();

    const teachers = await teachersFeatures.getQuery().getMany();

    // Count total records for pagination
    const studentsCount = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.school', 'school')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived })
      .getCount();

    const teachersCount = await this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.role', 'role')
      .leftJoinAndSelect('teacher.school', 'school')
      .where('teacher.school.id = :schoolId', { schoolId })
      .andWhere('teacher.isArchived = :isArchived', { isArchived })
      .getCount();

    // Add userType to each entity
    const studentsWithType = students.map((student) => ({
      ...student,
      userType: 'student',
    }));

    const teachersWithType = teachers.map((teacher) => ({
      ...teacher,
      userType: 'teacher',
    }));

    // Combine data
    const combinedData = [...studentsWithType, ...teachersWithType];

    // Pagination metadata
    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const total = studentsCount + teachersCount;
    const totalPages = Math.ceil(total / limit);

    return {
      data: combinedData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        studentsCount,
        teachersCount,
      },
    };
  }
  async getMySchoolWithRelations(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: user.school.id },
      relations: [
        'admissionPolicies',
        'gradingSystems',
        'feeStructures',
        'profile',
        'academicCalendars',
        'classLevels',
      ],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${user.school.id} not found`);
    }

    return school;
  }
  getMySchool(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }
    return user.school;
  }
  async getMyProfile(user: SchoolAdmin) {
    if (!user) {
      throw new NotFoundException('no admin found');
    }

    const adminInfo = await this.schoolAdminRepository.findOne({
      where: { id: user.id },
      relations: ['profile'],
    });

    return adminInfo;
  }
  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<SchoolAdmin> {
    return this.profileService.handleUpdateProfile(
      adminId,
      updateDto,
      this.schoolAdminRepository,
      ['role', 'school', 'profile'],
    );
  }
  async archiveUser(id: string, archive: boolean): Promise<Student | Teacher> {
    const user = await this.studentRepository.findOne({ where: { id } });
    if (user) {
      user.isArchived = archive;
      user.status = archive ? 'archived' : 'active';
      return this.studentRepository.save(user);
    }

    const teacher = await this.teacherRepository.findOne({ where: { id } });
    if (teacher) {
      teacher.isArchived = archive;
      teacher.status = archive ? 'archived' : 'active';
      return this.teacherRepository.save(teacher);
    }
    throw new NotFoundException(`User with ID ${id} not found`);
  }
}

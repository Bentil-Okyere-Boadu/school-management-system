import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from './school-admin.entity';
import { Student } from 'src/student/student.entity';
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';
import { School } from 'src/school/school.entity';
import { ProfileService } from 'src/profile/profile.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { Teacher } from 'src/teacher/teacher.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
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
    private readonly objectStorageService: ObjectStorageServiceService,
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
      .search(['firstName', 'lastName', 'email'])
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
    const isArchived = queryString.status === 'archived' ? true : false;

    // --- Students Query ---
    const studentsQuery = this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.role', 'role')
      .leftJoinAndSelect('student.school', 'school')
      .leftJoinAndSelect('student.profile', 'profile')
      .where('student.school.id = :schoolId', { schoolId })
      .andWhere('student.isArchived = :isArchived', { isArchived });

    const studentsFeatures = new APIFeatures(studentsQuery, queryString)
      .filter()
      .sort()
      .search(['firstName', 'lastName', 'email'])
      .limitFields();

    const students = await studentsFeatures.getQuery().getMany();

    // --- Teachers Query ---
    const teachersQuery = this.teacherRepository
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.role', 'role')
      .leftJoinAndSelect('teacher.school', 'school')
      .leftJoinAndSelect('teacher.profile', 'profile')
      .where('teacher.school.id = :schoolId', { schoolId })
      .andWhere('teacher.isArchived = :isArchived', { isArchived });

    const teachersFeatures = new APIFeatures(teachersQuery, queryString)
      .filter()
      .sort()
      .search(['firstName', 'lastName', 'email'])
      .limitFields();

    const teachers = await teachersFeatures.getQuery().getMany();

    // --- Sign Profile URLs ---
    const signedStudents = await Promise.all(
      students.map(async (student) => {
        if (student.profile?.id) {
          student.profile = await this.profileService.getProfileWithImageUrl(
            student.profile.id,
          );
        }
        return {
          ...student,
          userType: 'student',
        };
      }),
    );

    const signedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        if (teacher.profile?.id) {
          teacher.profile = await this.profileService.getProfileWithImageUrl(
            teacher.profile.id,
          );
        }
        return {
          ...teacher,
          userType: 'teacher',
        };
      }),
    );

    // --- Merge, Sort, and Paginate ---
    let combined = [...signedStudents, ...signedTeachers];

    // Optional: sort combined array if needed (e.g., by createdAt desc)
    combined = combined.sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    // Pagination
    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const total = combined.length;
    const totalPages = Math.ceil(total / limit);
    const paginated = combined.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages,
        studentsCount: signedStudents.length,
        teachersCount: signedTeachers.length,
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
        'academicCalendars.terms.holidays',
        'classLevels',
        'classLevels.teachers',
        'classLevels.students',
        'students',
        'teachers',
      ],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${user.school.id} not found`);
    }

    const signedAdmissionPolicies = await Promise.all(
      school.admissionPolicies.map(async (policy) => {
        const result = { ...policy } as typeof policy & {
          documentUrl?: string;
        };
        if (policy.documentPath) {
          try {
            result.documentUrl = await this.objectStorageService.getSignedUrl(
              policy.documentPath,
              86400, // 24 hours
            );
          } catch {
            // If there's an error getting the signed URL, we just continue without it
            this.logger.warn(
              `Failed to get signed URL for admission policy document: ${policy.id}`,
            );
          }
        }
        return result;
      }),
    );

    const signedProfile = school.profile
      ? {
          ...school.profile,
          avatarUrl: school.profile.avatarPath
            ? await this.objectStorageService.getSignedUrl(
                school.profile.avatarPath,
              )
            : undefined,
        }
      : undefined;

    return {
      ...school,
      admissionPolicies: signedAdmissionPolicies,
      profile: signedProfile,
    };
  }

  async getMySchool(user: SchoolAdmin) {
    if (!user.school) {
      throw new NotFoundException('School not found for this admin');
    }

    const school = await this.schoolRepository.findOne({
      where: { id: user.school.id },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (school.logoPath) {
      try {
        school.logoUrl = await this.objectStorageService.getSignedUrl(
          school.logoPath,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to get signed URL for school logo: ${school.id}${error}`,
        );
      }
    }

    return school;
  }
  async getUserById(userId: string, schoolId: string) {
    // Try finding a student first
    const student = await this.studentRepository.findOne({
      where: {
        id: userId,
        school: { id: schoolId },
      },
      relations: ['profile'],
    });

    if (student) {
      const profileWithUrl = student.profile?.id
        ? await this.profileService.getProfileWithImageUrl(student.profile.id)
        : null;

      return {
        ...student,
        userType: 'student',
        profile: profileWithUrl,
      };
    }

    // If not a student, try finding a teacher
    const teacher = await this.teacherRepository.findOne({
      where: {
        id: userId,
        school: { id: schoolId },
      },
      relations: ['role', 'profile', 'school'],
    });

    if (teacher) {
      const profileWithUrl = teacher.profile?.id
        ? await this.profileService.getProfileWithImageUrl(teacher.profile.id)
        : null;

      return {
        ...teacher,
        userType: 'teacher',
        profile: profileWithUrl,
      };
    }

    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  async getMyProfile(user: SchoolAdmin) {
    if (!user) {
      throw new NotFoundException('no admin found');
    }

    const adminInfo = await this.schoolAdminRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'profile'],
    });
    if (adminInfo?.profile?.id) {
      const profileWithUrl = await this.profileService.getProfileWithImageUrl(
        adminInfo.profile.id,
      );
      adminInfo.profile = profileWithUrl;
    }

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
  async findStudentById(id: string, schoolId: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: { id, school: { id: schoolId } },
    });
  }

  async archiveUser(id: string, archive: boolean) {
    const student = await this.studentRepository.findOne({ where: { id } });
    if (student) {
      student.isArchived = archive;
      student.status = archive ? 'archived' : 'active';
      return this.studentRepository.save(student);
    }

    const teacher = await this.teacherRepository.findOne({ where: { id } });
    if (teacher) {
      teacher.isArchived = archive;
      teacher.status = archive ? 'archived' : 'active';
      return this.teacherRepository.save(teacher);
    }

    throw new NotFoundException(`User with ID ${id} not found`);
  }

  getRepository(): Repository<SchoolAdmin> {
    return this.schoolAdminRepository;
  }

  /**
   * Delete a user record (student or teacher)
   */
  async deleteUser(
    userId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: userId, school: { id: schoolId } },
    });

    if (student) {
      return this.deleteStudent(userId, schoolId);
    }

    const teacher = await this.teacherRepository.findOne({
      where: { id: userId, school: { id: schoolId } },
    });

    if (teacher) {
      return this.deleteTeacher(userId, schoolId);
    }

    throw new NotFoundException(
      `User with ID ${userId} not found in school ${schoolId}`,
    );
  }

  async deleteTeacher(
    teacherId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, school: { id: schoolId } },
      relations: ['profile'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found or not authorized');
    }

    try {
      if (teacher.profile?.avatarPath) {
        await this.objectStorageService.deleteFile(teacher.profile.avatarPath);
      }

      await this.teacherRepository.remove(teacher);

      this.logger.log(
        `Teacher ${teacherId} deleted successfully from school ${schoolId}`,
      );
      return { message: 'Teacher record deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete teacher: ${teacherId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        `Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete a student record completely
   */
  async deleteStudent(
    studentId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId, school: { id: schoolId } },
      relations: ['profile', 'parents'],
    });

    if (!student) {
      throw new NotFoundException('Student not found or not authorized');
    }

    try {
      if (student.profile?.avatarPath) {
        await this.objectStorageService.deleteFile(student.profile.avatarPath);
      }

      // Delete parent profile images if they exist
      // if (student.parents && Array.isArray(student.parents)) {
      //   for (const parent of student.parents) {
      //     if (parent.profile?.avatarPath) {
      //       await this.objectStorageService.deleteFile(
      //         parent.profile.avatarPath,
      //       );
      //     }
      //   }
      // }

      // Delete the student record and its related entities
      await this.studentRepository.remove(student);

      this.logger.log(
        `Student ${studentId} deleted successfully from school ${schoolId}`,
      );
      return { message: 'Student record deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete student: ${studentId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        `Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

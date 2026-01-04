import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { CreateSchoolDto } from './dto/create-school.dto';
import { InvitationService } from 'src/invitation/invitation.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { StudentGrade } from 'src/subject/student-grade.entity';
import { AcademicTerm } from 'src/academic-calendar/entitites/academic-term.entity';
import { AttendanceService } from 'src/attendance/attendance.service';
import { EventCategory } from 'src/planner/entities/event-category.entity';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    private objectStorageService: ObjectStorageServiceService,
    private invitationService: InvitationService,
    @InjectRepository(StudentGrade)
    private studentGradeRepository: Repository<StudentGrade>,
    @InjectRepository(AcademicTerm)
    private academicTermRepository: Repository<AcademicTerm>,
    @InjectRepository(EventCategory)
    private eventCategoryRepository: Repository<EventCategory>,
    private attendanceService: AttendanceService,
  ) {}

  async create(
    createSchoolDto: CreateSchoolDto,
    adminUser: SchoolAdmin,
  ): Promise<School> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException('Only school admins can create schools');
    }

    if (adminUser.school) {
      throw new UnauthorizedException('Admin already associated with a school');
    }

    const school = this.schoolRepository.create(createSchoolDto);

    const savedSchool = await this.schoolRepository.save(school);
    if (!savedSchool.schoolCode) {
      savedSchool.schoolCode = savedSchool.id
        .toString()
        .padStart(5, '0')
        .substring(0, 5);
      await this.schoolRepository.save(savedSchool); // Update schoolCode
    }

    adminUser.school = savedSchool;

    if (!adminUser.adminId) {
      const adminId = await this.invitationService.generateAdminId(
        savedSchool,
        adminUser,
      );
      adminUser.adminId = adminId;
    }

    await this.adminRepository.save(adminUser);

    // Create default event categories for the new school
    await this.createDefaultEventCategories(savedSchool);

    return savedSchool;
  }

  private async createDefaultEventCategories(school: School): Promise<void> {
    const defaultCategories = [
      { name: 'General', color: '#6366f1', description: 'General events' },
      {
        name: 'Uncategorized',
        color: '#94a3b8',
        description: 'Uncategorized events',
      },
      {
        name: 'School Event',
        color: '#10b981',
        description: 'School-wide events and activities',
      },
    ];

    for (const categoryData of defaultCategories) {
      const exists = await this.eventCategoryRepository.findOne({
        where: {
          name: categoryData.name,
          school: { id: school.id },
        },
      });

      if (!exists) {
        const category = this.eventCategoryRepository.create({
          ...categoryData,
          school,
        });
        await this.eventCategoryRepository.save(category);
        this.logger.log(
          `Created default event category "${categoryData.name}" for school: ${school.name}`,
        );
      }
    }
  }

  async findOneWithDetails(id: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { id },
      relations: [
        'admissionPolicies',
        'gradingSystems',
        'feeStructures',
        'feeStructures.classLevels',
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
      throw new NotFoundException(`School with ID ${id} not found`);
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

    // Sign admission policy document URLs
    const signedAdmissionPolicies = await Promise.all(
      school.admissionPolicies.map(async (policy) => {
        const result = { ...policy } as typeof policy & {
          documentUrl?: string;
        };
        if (policy.documentPath) {
          try {
            result.documentUrl = await this.objectStorageService.getSignedUrl(
              policy.documentPath,
              86400,
            );
          } catch {
            // skip silently
          }
        }
        return result;
      }),
    );

    // Sign school profile avatar
    const signedSchoolProfile = school.profile
      ? {
          ...school.profile,
          avatarUrl: school.profile.avatarPath
            ? await this.objectStorageService.getSignedUrl(
                school.profile.avatarPath,
                86400,
              )
            : undefined,
        }
      : undefined;

    // Combine students and teachers
    const users = [...(school.students || []), ...(school.teachers || [])];

    // Sign avatarUrls for users (if they have profile with avatarPath)
    const signedUsers = await Promise.all(
      users.map(async (user) => {
        if (user.profile?.avatarPath) {
          try {
            const avatarUrl = await this.objectStorageService.getSignedUrl(
              user.profile.avatarPath,
              86400,
            );
            return {
              ...user,
              profile: {
                ...user.profile,
                avatarUrl,
              },
            };
          } catch {
            return user;
          }
        }
        return user;
      }),
    );

    const { students, teachers, ...rest } = school;

    return {
      ...rest,
      admissionPolicies: signedAdmissionPolicies,
      profile: signedSchoolProfile,
      users: signedUsers,
    };
  }

  // ... existing code ...
  async findAll(): Promise<School[]> {
    const schools = await this.schoolRepository.find();

    // Sign logo URLs for all schools
    await Promise.all(
      schools.map(async (school) => {
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
      }),
    );

    return schools;
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    return school;
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

  async remove(id: string): Promise<void> {
    // Check if school exists
    await this.findOne(id);

    // Only super_admin can remove schools
    // This check will be in the controller

    await this.schoolRepository.delete(id);
  }

  // In school.service.ts
  async deleteLogo(schoolId: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    if (school.logoPath) {
      try {
        // Delete the file from storage
        await this.objectStorageService.deleteFile(school.logoPath);

        // Clear the logo fields in the database
        school.logoPath = null;
        school.mediaType = null;
        return this.schoolRepository.save(school);
      } catch (error) {
        this.logger.warn(
          `Failed to delete school logo: ${schoolId} - ${error}`,
        );
        throw error;
      }
    }

    return school;
  }

  async updateCalendlyUrl(
    schoolId: string,
    calendlyUrl: string,
  ): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    school.calendlyUrl = calendlyUrl;
    return this.schoolRepository.save(school);
  }

  async getSuperAdminDashboardStats() {
    const schools = await this.schoolRepository.find({
      relations: ['academicCalendars.terms', 'classLevels.students'],
    });

    const performanceData: Array<{
      schoolName: string;
      averageGrade: number;
      averageAttendanceRate: number;
      totalStudents: number;
      totalTeachers: number;
    }> = [];

    let totalOverallAttendance = 0;
    let schoolsWithAttendanceData = 0;
    let totalOverallTeachers = 0;
    let totalOverallStudents = 0;

    for (const school of schools) {
      let schoolTotalGrades = 0;
      let numGrades = 0;
      let schoolAttendanceRate = 0;
      let numClassesWithAttendance = 0;

      const latestTerm = school.academicCalendars
        .flatMap((calendar) => calendar.terms)
        .sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )[0];

      if (latestTerm) {
        // Calculate average grade
        const grades = await this.studentGradeRepository.find({
          where: { academicTerm: { id: latestTerm.id } },
          relations: ['student.classLevels'],
        });

        grades.forEach((grade) => {
          schoolTotalGrades += grade.totalScore;
          numGrades++;
        });

        // Calculate attendance rate per school
        const classLevelsInSchool = await this.schoolRepository.manager
          .getRepository('ClassLevel')
          .find({
            where: { school: { id: school.id } },
            relations: ['students'],
          });

        for (const classLevel of classLevelsInSchool) {
          if (classLevel.students.length > 0) {
            const attendanceSummary =
              await this.attendanceService.getClassAttendance({
                classLevelId: classLevel.id,
                filterType: 'month',
              });
            if (
              attendanceSummary?.summary?.averageAttendanceRate !== undefined
            ) {
              schoolAttendanceRate +=
                attendanceSummary.summary.averageAttendanceRate;
              numClassesWithAttendance++;
            }
          }
        }
      }

      const averageGrade = numGrades > 0 ? schoolTotalGrades / numGrades : 0;
      const finalSchoolAttendanceRate =
        numClassesWithAttendance > 0
          ? schoolAttendanceRate / numClassesWithAttendance
          : 0;

      const totalStudentsInSchool = await this.schoolRepository.manager
        .getRepository('Student')
        .count({ where: { school: { id: school.id } } });
      const totalTeachersInSchool = await this.schoolRepository.manager
        .getRepository('Teacher')
        .count({ where: { school: { id: school.id } } });

      totalOverallStudents += totalStudentsInSchool;
      totalOverallTeachers += totalTeachersInSchool;

      performanceData.push({
        schoolName: school.name,
        averageGrade,
        averageAttendanceRate: finalSchoolAttendanceRate,
        totalStudents: totalStudentsInSchool,
        totalTeachers: totalTeachersInSchool,
      });

      if (finalSchoolAttendanceRate > 0) {
        totalOverallAttendance += finalSchoolAttendanceRate;
        schoolsWithAttendanceData++;
      }
    }

    performanceData.sort((a, b) => b.averageGrade - a.averageGrade);

    const bestPerformingSchools = performanceData.slice(0, 3);
    const worstPerformingSchools = performanceData.slice(-3).reverse();

    const overallAverageAttendanceRate =
      schoolsWithAttendanceData > 0
        ? totalOverallAttendance / schoolsWithAttendanceData
        : 0;

    return {
      totalSchools: schools.length,
      totalTeachers: totalOverallTeachers,
      totalStudents: totalOverallStudents,
      averageAttendanceRate: overallAverageAttendanceRate,
      bestPerformingSchools: bestPerformingSchools.map((s) => ({
        schoolName: s.schoolName,
        averageGrade: s.averageGrade,
        averageAttendanceRate: s.averageAttendanceRate,
      })),
      worstPerformingSchools: worstPerformingSchools.map((s) => ({
        schoolName: s.schoolName,
        averageGrade: s.averageGrade,
        averageAttendanceRate: s.averageAttendanceRate,
      })),
    };
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission, AdmissionStatus } from './admission.entity';
import { Guardian } from './guardian.entity';
import { CreateAdmissionDto } from './dto/create-admission.dto';
import { ObjectStorageServiceService } from '../object-storage-service/object-storage-service.service';
import { School } from 'src/school/school.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { EmailService } from 'src/common/services/email.service';
import { SmsService } from 'src/common/services/sms.service';
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';
import { format } from 'date-fns';
import { PreviousSchoolResult } from './previous-school-result.entity';
import { Student } from 'src/student/student.entity';
import { Role } from 'src/role/role.entity';
import { Profile } from 'src/profile/profile.entity';
import { Parent } from 'src/parent/parent.entity';

import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { InvitationService } from 'src/invitation/invitation.service';

@Injectable()
export class AdmissionService {
  private readonly logger = new Logger(AdmissionService.name);

  constructor(
    @InjectRepository(Admission)
    private admissionRepository: Repository<Admission>,
    @InjectRepository(Guardian)
    private guardianRepository: Repository<Guardian>,
    @InjectRepository(PreviousSchoolResult)
    private previousSchoolResultRepository: Repository<PreviousSchoolResult>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(ClassLevel)
    private classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private objectStorageService: ObjectStorageServiceService,
    private emailService: EmailService,
    private smsService: SmsService,
    private invitationService: InvitationService,
  ) {}

  async createAdmission(
    createAdmissionDto: CreateAdmissionDto,
    files: Array<Express.Multer.File>,
  ) {
    // Helper to find a file by fieldname
    const findFile = (field: string) =>
      files.find((f) => f.fieldname === field);

    // 1. Handle student headshot
    const studentHeadshotFile = findFile('studentHeadshot');
    if (studentHeadshotFile) {
      const { path, url } = await this.objectStorageService.uploadProfileImage(
        studentHeadshotFile,
        createAdmissionDto.studentEmail || createAdmissionDto.studentFirstName,
      );
      createAdmissionDto.studentHeadshotPath = path;
      createAdmissionDto.studentHeadshotMediaType =
        studentHeadshotFile.mimetype;
    }

    // 2. Handle student birth cert
    const studentBirthCertFile = findFile('studentBirthCert');
    if (studentBirthCertFile) {
      const { path } = await this.objectStorageService.uploadAdmissionDocument(
        studentBirthCertFile,
        createAdmissionDto.schoolId,
        createAdmissionDto.studentEmail || createAdmissionDto.studentFirstName,
        'birth-cert',
      );
      createAdmissionDto.studentBirthCertPath = path;
      createAdmissionDto.studentBirthCertMediaType =
        studentBirthCertFile.mimetype;
    }

    // 4. Handle guardian headshots
    if (Array.isArray(createAdmissionDto.guardians)) {
      for (let i = 0; i < createAdmissionDto.guardians.length; i++) {
        const guardian = createAdmissionDto.guardians[i];
        const field = `guardianHeadshot${i}`;
        const guardianHeadshotFile = findFile(field);
        if (guardianHeadshotFile) {
          const { path } = await this.objectStorageService.uploadProfileImage(
            guardianHeadshotFile,
            guardian.email ?? guardian.firstName,
          );
          guardian.headshotPath = path;
          guardian.headshotMediaType = guardianHeadshotFile.mimetype;
        }
      }
    }

    // Find all previous school result files (e.g., fieldname: previousSchoolResult0, previousSchoolResult1, ...)
    const previousSchoolResultFiles = files.filter((f) =>
      f.fieldname.startsWith('previousSchoolResult'),
    );

    // Only validate if the student has previous school experience
    if (
      createAdmissionDto.hasPreviousSchool &&
      previousSchoolResultFiles.length === 0
    ) {
      throw new BadRequestException(
        'Previous school result files are required when student has previous school experience.',
      );
    }

    // Save admission first (without previousSchoolResults)
    const { guardians, forClassId, schoolId, ...admissionData } =
      createAdmissionDto;
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) throw new NotFoundException('School not found');

    const admission = this.admissionRepository.create({
      ...admissionData,
      school,
      hasPreviousSchool: previousSchoolResultFiles.length > 0,
      forClass: forClassId ? { id: forClassId } : undefined,
    });
    await this.admissionRepository.save(admission);

    // Save previous school results if any exist
    if (previousSchoolResultFiles.length > 0) {
      try {
        for (const file of previousSchoolResultFiles) {
          const { path } =
            await this.objectStorageService.uploadAdmissionDocument(
              file,
              createAdmissionDto.schoolId,
              createAdmissionDto.studentEmail ??
                createAdmissionDto.studentFirstName,
              'prev-result',
            );
          const result = this.previousSchoolResultRepository.create({
            filePath: path,
            mediaType: file.mimetype,
            admission,
          });
          await this.previousSchoolResultRepository.save(result);
        }
      } catch (error) {
        // If file upload fails, we should clean up the admission record
        await this.admissionRepository.remove(admission);
        throw new BadRequestException(
          `Failed to upload previous school result files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // 6. Create Guardian entities
    if (Array.isArray(guardians)) {
      for (const guardianDto of guardians) {
        const guardian = this.guardianRepository.create({
          ...guardianDto,
          admission,
        });
        await this.guardianRepository.save(guardian);
      }
    }
    if (admission.studentEmail) {
      await this.emailService.sendAdmissionApplicationConfirmation(
        admission.studentEmail,
        `${admission.studentFirstName} ${admission.studentLastName}`,
        school.name,
        admission.applicationId,
        school.email,
      );
    }

    // Send SMS notification if phone number is available
    if (admission.studentPhone) {
      try {
        await this.smsService.sendAdmissionApplicationConfirmationSms(
          admission.studentPhone,
          `${admission.studentFirstName} ${admission.studentLastName}`,
          school.name,
          admission.applicationId,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send admission confirmation SMS to ${admission.studentPhone}`,
          error,
        );
      }
    }
    return this.admissionRepository.findOne({
      where: { applicationId: admission.applicationId },
      relations: ['guardians', 'forClass'],
    });
  }

  async findAllNamesBySchool(
    schoolId: string,
  ): Promise<{ id: string; name: string }[]> {
    const classLevels = await this.classLevelRepository.find({
      where: { school: { id: schoolId } },
      select: ['id', 'name'],
    });
    return classLevels;
  }

  async findAllBySchool(
    schoolId: string,
    queryString: QueryString,
  ): Promise<any> {
    const baseQuery = this.admissionRepository
      .createQueryBuilder('admission')
      .leftJoinAndSelect('admission.school', 'school')
      .where('admission.school.id = :schoolId', { schoolId });

    const isArchived = queryString.status === 'archived' ? true : false;
    baseQuery.andWhere('admission.isArchived = :isArchived', { isArchived });

    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      queryString,
    )
      .filter()
      .sort()
      .search(['studentFirstName', 'studentLastName', 'studentEmail'])
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    const featuresWithPagination = featuresWithoutPagination.paginate();
    const admissions = await featuresWithPagination.getQuery().getMany();

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit);

    // Format the result
    const data = admissions.map((admission) => ({
      id: admission.applicationId,
      fullName:
        `${admission.studentFirstName ?? ''} ${admission.studentLastName ?? ''}`.trim(),
      email: admission.studentEmail,
      submittedAt: admission.createdAt
        ? format(admission.createdAt, "MMM dd, yyyy 'at' hh:mm a")
        : null,
      enrollmentStatus: admission.status,
      isArchived: admission.isArchived,
    }));

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

  async getAdmissionById(applicationId: string): Promise<any> {
    const admission = await this.admissionRepository.findOne({
      where: { applicationId },
      relations: ['guardians', 'forClass', 'school', 'previousSchoolResults'],
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    // Sign student file URLs
    admission.studentHeadshotUrl = admission.studentHeadshotPath
      ? await this.objectStorageService.getSignedUrl(
          admission.studentHeadshotPath,
        )
      : undefined;
    admission.studentBirthCertUrl = admission.studentBirthCertPath
      ? await this.objectStorageService.getSignedUrl(
          admission.studentBirthCertPath,
        )
      : undefined;
    if (
      admission.previousSchoolResults &&
      Array.isArray(admission.previousSchoolResults)
    ) {
      for (const result of admission.previousSchoolResults) {
        result.fileUrl = result.filePath
          ? await this.objectStorageService.getSignedUrl(result.filePath)
          : undefined;
      }
    }
    // Sign guardian headshot URLs
    if (admission.guardians && Array.isArray(admission.guardians)) {
      for (const guardian of admission.guardians) {
        guardian.headshotUrl = guardian.headshotPath
          ? await this.objectStorageService.getSignedUrl(guardian.headshotPath)
          : undefined;
      }
    }
    return admission;
  }
  async sendInterviewInvitation(
    applicationId: string,
    interviewDate: string,
    interviewTime: string,
  ) {
    const admission = await this.admissionRepository.findOne({
      where: { applicationId },
      relations: ['school'],
    });
    if (!admission) {
      throw new NotFoundException('Admission not found');
    }
    if (!admission.studentEmail) {
      throw new BadRequestException('applicant email not found');
    }
    await this.emailService.sendInterviewInvitation(
      admission.studentEmail,
      `${admission.studentFirstName} ${admission.studentLastName}`,
      admission.school.name,
      applicationId,
      interviewDate,
      interviewTime,
      admission.school.email,
    );

    // Send SMS notification if phone number is available
    if (admission.studentPhone) {
      try {
        await this.smsService.sendInterviewInvitationSms(
          admission.studentPhone,
          `${admission.studentFirstName} ${admission.studentLastName}`,
          admission.school.name,
          applicationId,
          interviewDate,
          interviewTime,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send interview invitation SMS to ${admission.studentPhone}`,
          error,
        );
      }
    }

    admission.status = AdmissionStatus.INTERVIEW_PENDING;
    await this.admissionRepository.save(admission);

    return { message: 'Interview invitation sent successfully' };
  }

  async updateAdmissionStatus(
    applicationId: string,
    status: AdmissionStatus,
  ): Promise<{ message: string }> {
    const admission = await this.admissionRepository.findOne({
      where: { applicationId },
      relations: ['school', 'forClass'],
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    admission.status = status;
    await this.admissionRepository.save(admission);

    if (admission.studentEmail) {
      const studentName = `${admission.studentFirstName} ${admission.studentLastName}`;
      const schoolName = admission.school?.name || 'School';
      const schoolEmail = admission.school?.email;

      setImmediate(() => {
        void (async () => {
          try {
            switch (status) {
              case AdmissionStatus.ACCEPTED:
                await this.emailService.sendAdmissionAcceptedEmail(
                  admission.studentEmail,
                  studentName,
                  schoolName,
                  applicationId,
                  schoolEmail,
                );
                await this.createStudentFromAdmission(admission);
                break;

              case AdmissionStatus.REJECTED:
                await this.emailService.sendAdmissionRejectedEmail(
                  admission.studentEmail,
                  studentName,
                  schoolName,
                  applicationId,
                  schoolEmail,
                );
                break;

              case AdmissionStatus.WAITLISTED:
                await this.emailService.sendAdmissionWaitlistedEmail(
                  admission.studentEmail,
                  studentName,
                  schoolName,
                  applicationId,
                  schoolEmail,
                );
                break;

              case AdmissionStatus.INTERVIEW_COMPLETED:
                await this.emailService.sendInterviewCompletedEmail(
                  admission.studentEmail,
                  studentName,
                  schoolName,
                  applicationId,
                  schoolEmail,
                );
                break;
            }
          } catch (error) {
            this.logger.error(
              `Failed to send status update email to ${admission.studentEmail}`,
              error,
            );
          }
        })();
      });
    }

    // Send SMS notifications if phone number is available
    if (admission.studentPhone) {
      const studentName = `${admission.studentFirstName} ${admission.studentLastName}`;
      const schoolName = admission.school?.name || 'School';

      setImmediate(() => {
        void (async () => {
          try {
            switch (status) {
              case AdmissionStatus.ACCEPTED:
                await this.smsService.sendAdmissionAcceptedSms(
                  admission.studentPhone,
                  studentName,
                  schoolName,
                  applicationId,
                );
                break;

              case AdmissionStatus.REJECTED:
                await this.smsService.sendAdmissionRejectedSms(
                  admission.studentPhone,
                  studentName,
                  schoolName,
                  applicationId,
                );
                break;

              case AdmissionStatus.WAITLISTED:
                await this.smsService.sendAdmissionWaitlistedSms(
                  admission.studentPhone,
                  studentName,
                  schoolName,
                  applicationId,
                );
                break;

              case AdmissionStatus.INTERVIEW_COMPLETED:
                await this.smsService.sendInterviewCompletedSms(
                  admission.studentPhone,
                  studentName,
                  schoolName,
                  applicationId,
                );
                break;
            }
          } catch (error) {
            this.logger.error(
              `Failed to send status update SMS to ${admission.studentPhone}`,
              error,
            );
          }
        })();
      });
    }

    return { message: `Admission status updated to ${status}` };
  }

  /**
   * Create a student account from an accepted admission application
   * @param admission The admission application data
   * @returns The created student
   */
  private async createStudentFromAdmission(
    admission: Admission,
  ): Promise<Student> {
    try {
      // Get student role
      const studentRole = await this.roleRepository.findOne({
        where: { name: 'student' },
      });

      if (!studentRole) {
        throw new NotFoundException('Student role not found');
      }

      // Check if student with this email already exists
      const existingStudent = await this.studentRepository.findOne({
        where: { email: admission.studentEmail },
      });

      if (existingStudent) {
        this.logger.warn(
          `Student with email ${admission.studentEmail} already exists. Skipping student creation.`,
        );
        return existingStudent;
      }

      // Generate PIN and student ID
      const pin = this.invitationService.generatePin();
      const studentId = await this.invitationService.generateStudentId(
        admission.school,
      );

      // Set invitation expiration
      const invitationExpires = new Date();
      invitationExpires.setHours(invitationExpires.getHours() + 24);

      // Create student record
      const student = this.studentRepository.create({
        firstName: admission.studentFirstName,
        lastName: admission.studentLastName,
        email: admission.studentEmail,
        password: await bcrypt.hash(pin, 10),
        role: studentRole,
        school: admission.school,
        invitationToken: uuidv4(),
        invitationExpires,
        isInvitationAccepted: false,
        studentId,
      });

      // Save student first
      const savedStudent = await this.studentRepository.save(student);

      // Create profile with student information
      const profile = this.profileRepository.create({
        // Set headshot if available
        avatarPath: admission.studentHeadshotPath,
        mediaType: admission.studentHeadshotMediaType,
        DateOfBirth: admission.studentDOB,
        PlaceOfBirth: admission.studentPlaceOfBirth,
        address: admission.studentStreetAddress,
        BoxAddress: admission.studentBoxAddress,
        phoneContact: admission.studentPhone,
        optionalPhoneContact: admission.studentOtherPhone,
        optionalPhoneContactTwo: admission.studentOtherPhoneOptional,
        student: savedStudent,
      });

      await this.profileRepository.save(profile);

      // If a class level is specified, add the student to that class
      if (admission.forClass) {
        const classLevel = await this.classLevelRepository.findOne({
          where: { id: admission.forClass.id },
          relations: ['students'],
        });

        if (classLevel) {
          // Initialize students array if it doesn't exist
          if (!classLevel.students) {
            classLevel.students = [];
          }

          // Add student to class
          classLevel.students.push(savedStudent);
          await this.classLevelRepository.save(classLevel);
        }
      }

      // Create parents from guardians
      if (admission.guardians && Array.isArray(admission.guardians)) {
        for (const guardian of admission.guardians) {
          const parent = this.parentRepository.create({
            firstName: guardian.firstName,
            lastName: guardian.lastName,
            email: guardian.email,
            phone: guardian.guardianPhone,
            relationship: guardian.relationship,
            student: savedStudent,
          });
          await this.parentRepository.save(parent);
          // Create parent profile with headshot if available
          if (guardian.headshotPath) {
            const parentProfile = this.profileRepository.create({
              avatarPath: guardian.headshotPath,
              mediaType: guardian.headshotMediaType,
              parent,
            });
            await this.parentRepository.save(parent);
            parent.profile = parentProfile;
          }
        }
      }

      // Send invitation email
      await this.emailService.sendStudentInvitation(
        savedStudent,
        studentId,
        pin,
      );

      // Send SMS invitation if phone number is available
      if (admission.studentPhone) {
        try {
          await this.smsService.sendStudentInvitationSms(
            admission.studentPhone,
            `${admission.studentFirstName} ${admission.studentLastName}`,
            studentId,
            pin,
            admission.school?.name || 'School',
          );
        } catch (error) {
          this.logger.error(
            `Failed to send student invitation SMS to ${admission.studentPhone}`,
            error,
          );
        }
      }

      this.logger.log(
        `Student account created from admission application ${admission.applicationId}`,
      );

      return savedStudent;
    } catch (error) {
      this.logger.error(
        `Failed to create student from admission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(`Failed to create student account`);
    }
  }

  async getAdmissionAnalytics(schoolId: string) {
    // Get all admissions for the school
    const admissions = await this.admissionRepository.find({
      where: { school: { id: schoolId } },
    });

    // Calculate summary metrics
    const totalApplications = admissions.length;
    const acceptedApplications = admissions.filter(
      (a) => a.status === AdmissionStatus.ACCEPTED,
    ).length;
    const rejectedApplications = admissions.filter(
      (a) => a.status === AdmissionStatus.REJECTED,
    ).length;
    const pendingApplications = admissions.filter(
      (a) =>
        a.status === AdmissionStatus.INTERVIEW_PENDING ||
        a.status === AdmissionStatus.WAITLISTED ||
        a.status === AdmissionStatus.INTERVIEW_COMPLETED,
    ).length;

    // Calculate monthly trends
    const currentYear = new Date().getFullYear();
    const monthlyTrends = Array(12)
      .fill(0)
      .map((_, index) => {
        const month = index + 1;
        const applicationsInMonth = admissions.filter((admission) => {
          const createdAt = new Date(admission.createdAt);
          return (
            createdAt.getMonth() + 1 === month &&
            createdAt.getFullYear() === currentYear
          );
        }).length;
        return {
          month: new Date(currentYear, index).toLocaleString('default', {
            month: 'short',
          }),
          value: applicationsInMonth,
        };
      });

    // Calculate weekly trends (last 7 days)
    const weeklyTrends = Array(7)
      .fill(0)
      .map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const applicationsOnDay = admissions.filter((admission) => {
          const createdAt = new Date(admission.createdAt);
          return (
            createdAt.getDate() === date.getDate() &&
            createdAt.getMonth() === date.getMonth() &&
            createdAt.getFullYear() === date.getFullYear()
          );
        }).length;
        return {
          date: date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
          }),
          value: applicationsOnDay,
        };
      });

    // Calculate status breakdown for donut chart
    const statusBreakdown = [
      {
        name: 'Applications Received',
        value: totalApplications,
        rate: '100%',
      },
      {
        name: 'Applications Accepted',
        value: acceptedApplications,
        rate: totalApplications
          ? `${Math.round((acceptedApplications / totalApplications) * 100)}%`
          : '0%',
      },
      {
        name: 'Applications Rejected',
        value: rejectedApplications,
        rate: totalApplications
          ? `${Math.round((rejectedApplications / totalApplications) * 100)}%`
          : '0%',
      },
      {
        name: 'Applications Pending',
        value: pendingApplications,
        rate: totalApplications
          ? `${Math.round((pendingApplications / totalApplications) * 100)}%`
          : '0%',
      },
    ];

    // Calculate applications this year
    const applicationsThisYear = admissions.filter((admission) => {
      const createdAt = new Date(admission.createdAt);
      return createdAt.getFullYear() === currentYear;
    }).length;

    return {
      summary: {
        totalApplications,
        acceptedApplications,
        rejectedApplications,
        pendingApplications,
      },
      monthlyTrends,
      weeklyTrends,
      statusBreakdown,
      applicationsThisYear,
    };
  }
  async archiveAdmission(
    applicationId: string,
    schoolId: string,
    archive: boolean,
  ): Promise<{ message: string }> {
    const admission = await this.admissionRepository.findOne({
      where: { applicationId, school: { id: schoolId } },
    });

    if (!admission) {
      throw new NotFoundException('Admission not found or not authorized');
    }

    try {
      admission.isArchived = archive;
      admission.status = archive
        ? AdmissionStatus.ARCHIVED
        : AdmissionStatus.SUBMITTED;

      await this.admissionRepository.save(admission);

      return {
        message: `Admission application ${archive ? 'archived' : 'unarchived'} successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to ${archive ? 'archive' : 'unarchive'} admission application: ${applicationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        `Failed to ${archive ? 'archive' : 'unarchive'} admission application: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
  async deleteAdmission(
    applicationId: string,
    schoolId: string,
  ): Promise<{ message: string }> {
    const admission = await this.admissionRepository.findOne({
      where: { applicationId, school: { id: schoolId } },
      relations: ['guardians', 'previousSchoolResults'],
    });

    if (!admission) {
      throw new NotFoundException('Admission not found or not authorized');
    }

    try {
      if (admission.studentHeadshotPath) {
        await this.objectStorageService.deleteFile(
          admission.studentHeadshotPath,
        );
      }

      if (admission.studentBirthCertPath) {
        await this.objectStorageService.deleteFile(
          admission.studentBirthCertPath,
        );
      }

      if (admission.guardians && Array.isArray(admission.guardians)) {
        for (const guardian of admission.guardians) {
          if (guardian.headshotPath) {
            await this.objectStorageService.deleteFile(guardian.headshotPath);
          }
        }
      }

      if (
        admission.previousSchoolResults &&
        Array.isArray(admission.previousSchoolResults)
      ) {
        for (const result of admission.previousSchoolResults) {
          if (result.filePath) {
            await this.objectStorageService.deleteFile(result.filePath);
          }
        }
      }

      await this.admissionRepository.remove(admission);

      return { message: 'Admission application deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to delete admission application: ${applicationId}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException(
        `Failed to delete admission application: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

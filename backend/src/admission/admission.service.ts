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
import { APIFeatures, QueryString } from 'src/common/api-features/api-features';
import { format } from 'date-fns';
import { PreviousSchoolResult } from './previous-school-result.entity';
@Injectable()
export class AdmissionService {
  private readonly logger = new Logger(AdmissionService.name);
  constructor(
    @InjectRepository(Admission)
    private readonly admissionRepository: Repository<Admission>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(Guardian)
    private readonly guardianRepository: Repository<Guardian>,

    @InjectRepository(ClassLevel)
    private readonly classLevelRepository: Repository<ClassLevel>,
    @InjectRepository(PreviousSchoolResult)
    private readonly previousSchoolResultRepository: Repository<PreviousSchoolResult>,
    private readonly objectStorageService: ObjectStorageServiceService,

    private readonly emailService: EmailService,
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
      );
    }
    return this.admissionRepository.findOne({
      where: { applicationId: admission.applicationId },
      relations: ['guardians', 'forClass'],
    });
  }
  getAdmissionUrlForAdmin(admin: SchoolAdmin): { admissionUrl: string } {
    if (!admin.school?.id) {
      throw new NotFoundException('School not found for this admin');
    }
    const baseUrl =
      process.env.ADMISSION_BASE_URL ?? 'https://your-frontend.com/admissions';
    return {
      admissionUrl: `${baseUrl}?schoolId=${admin.school.id}`,
    };
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
    );
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
      relations: ['school'],
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    admission.status = status;
    await this.admissionRepository.save(admission);

    // Send appropriate email based on the new status
    if (admission.studentEmail) {
      const studentName = `${admission.studentFirstName} ${admission.studentLastName}`;
      const schoolName = admission.school?.name || 'School';

      try {
        switch (status) {
          case AdmissionStatus.ACCEPTED:
            await this.emailService.sendAdmissionAcceptedEmail(
              admission.studentEmail,
              studentName,
              schoolName,
              applicationId,
            );
            break;

          case AdmissionStatus.REJECTED:
            await this.emailService.sendAdmissionRejectedEmail(
              admission.studentEmail,
              studentName,
              schoolName,
              applicationId,
            );
            break;

          case AdmissionStatus.WAITLISTED:
            await this.emailService.sendAdmissionWaitlistedEmail(
              admission.studentEmail,
              studentName,
              schoolName,
              applicationId,
            );
            break;

          case AdmissionStatus.INTERVIEW_COMPLETED:
            await this.emailService.sendInterviewCompletedEmail(
              admission.studentEmail,
              studentName,
              schoolName,
              applicationId,
            );
            break;
        }
      } catch (error) {
        this.logger.error(
          `Failed to send status update email to ${admission.studentEmail}`,
          error,
        );
      }
    }

    return { message: `Admission status updated to ${status}` };
  }
}

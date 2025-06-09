import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admission } from './admission.entity';
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

    // 3. Handle previous school result
    const previousSchoolResultFile = findFile('previousSchoolResult');
    if (previousSchoolResultFile) {
      const { path } = await this.objectStorageService.uploadAdmissionDocument(
        previousSchoolResultFile,
        createAdmissionDto.schoolId,
        createAdmissionDto.studentEmail || createAdmissionDto.studentFirstName,
        'prev-result',
      );
      createAdmissionDto.previousSchoolResultPath = path;
      createAdmissionDto.previousSchoolResultMediaType =
        previousSchoolResultFile.mimetype;
    }

    // 4. Handle guardian headshots
    if (Array.isArray(createAdmissionDto.guardians)) {
      for (let i = 0; i < createAdmissionDto.guardians.length; i++) {
        const guardian = createAdmissionDto.guardians[i];
        const field = `guardianHeadshot${i}`;
        const guardianHeadshotFile = findFile(field);
        if (guardianHeadshotFile) {
          console.log('hellp');
          const { path } = await this.objectStorageService.uploadProfileImage(
            guardianHeadshotFile,
            guardian.email || guardian.firstName,
          );
          guardian.headshotPath = path;
          guardian.headshotMediaType = guardianHeadshotFile.mimetype;
        } else {
          console.log('jude');
        }
      }
    }

    // Find all previous school result files (e.g., fieldname: previousSchoolResult0, previousSchoolResult1, ...)
    const previousSchoolResultFiles = files.filter((f) =>
      f.fieldname.startsWith('previousSchoolResult'),
    );

    if (previousSchoolResultFiles.length < 3) {
      throw new BadRequestException(
        'At least 3 previous school result files are required.',
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
      forClass: forClassId ? { id: forClassId } : undefined,
    });
    await this.admissionRepository.save(admission);

    // Save previous school results
    for (const file of previousSchoolResultFiles) {
      const { path } = await this.objectStorageService.uploadAdmissionDocument(
        file,
        createAdmissionDto.schoolId,
        createAdmissionDto.studentEmail || createAdmissionDto.studentFirstName,
        'prev-result',
      );
      const result = this.previousSchoolResultRepository.create({
        filePath: path,
        mediaType: file.mimetype,
        admission,
      });
      await this.previousSchoolResultRepository.save(result);
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
    if (!admin.school || !admin.school.id) {
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
      relations: ['guardians', 'forClass', 'school'],
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
}

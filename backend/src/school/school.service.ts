import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { EncryptionService } from 'src/common/utils/encryption.util';
import { UpdateHubtelMerchantDto } from './dto/update-hubtel-merchant.dto';
import { buildReceiveMoneyPrimaryCallbackUrl } from 'src/integrations/hubtel/hubtel-callback-url.util';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { SchoolProvisioningStatus } from 'src/tenant/school-provisioning-status';

export type HubtelMerchantPublicView = {
  clientId: string | null;
  collectionAccountNumber: string | null;
  active: boolean;
  configured: boolean;
  /** Full Receive Money callback URL for this school; null if HUBTEL_PRIMARY_CALLBACK_BASE_URL is unset. */
  primaryCallbackUrl: string | null;
};

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);
  constructor(
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    private objectStorageService: ObjectStorageServiceService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    private readonly tenantConnection: TenantConnectionService,
  ) {}

  /**
   * Look up the school by id and assert it exists. Used by SuperAdmin merchant ops.
   */
  private async findOrThrow(schoolId: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }
    return school;
  }

  /**
   * Persist (or rotate) the Hubtel merchant credentials for a school.
   * The clientSecret is encrypted with AES-256-GCM before being stored;
   * `active` defaults to true when not provided.
   */
  async setHubtelMerchant(
    schoolId: string,
    dto: UpdateHubtelMerchantDto,
  ): Promise<HubtelMerchantPublicView> {
    const school = await this.findOrThrow(schoolId);
    if (!this.encryptionService.isConfigured()) {
      throw new BadRequestException(
        'Server encryption key (APP_ENCRYPTION_KEY) is not configured; cannot store Hubtel merchant secret',
      );
    }
    school.hubtelClientId = dto.clientId.trim();
    school.hubtelClientSecretEnc = this.encryptionService.encrypt(
      dto.clientSecret,
    );
    school.hubtelCollectionAccountNumber = dto.collectionAccountNumber.trim();
    school.hubtelMerchantActive = dto.active ?? true;
    const saved = await this.schoolRepository.save(school);
    return this.toMerchantPublicView(saved);
  }

  /**
   * Clear the Hubtel merchant credentials for a school and deactivate.
   */
  async clearHubtelMerchant(
    schoolId: string,
  ): Promise<HubtelMerchantPublicView> {
    const school = await this.findOrThrow(schoolId);
    school.hubtelClientId = null;
    school.hubtelClientSecretEnc = null;
    school.hubtelCollectionAccountNumber = null;
    school.hubtelMerchantActive = false;
    const saved = await this.schoolRepository.save(school);
    return this.toMerchantPublicView(saved);
  }

  /**
   * Return a masked view of the school's Hubtel merchant configuration.
   * The clientSecret is NEVER exposed.
   */
  async getHubtelMerchant(schoolId: string): Promise<HubtelMerchantPublicView> {
    const school = await this.findOrThrow(schoolId);
    return this.toMerchantPublicView(school);
  }

  private toMerchantPublicView(school: School): HubtelMerchantPublicView {
    const base = this.configService
      .get<string>('HUBTEL_PRIMARY_CALLBACK_BASE_URL', '')
      .trim();
    return {
      clientId: school.hubtelClientId,
      collectionAccountNumber: school.hubtelCollectionAccountNumber,
      active: school.hubtelMerchantActive,
      configured: Boolean(
        school.hubtelClientId &&
          school.hubtelClientSecretEnc &&
          school.hubtelCollectionAccountNumber,
      ),
      primaryCallbackUrl: buildReceiveMoneyPrimaryCallbackUrl(base, school.id),
    };
  }

  async findOneWithDetails(id: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { id },
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

    return {
      ...school,
      admissionPolicies: [],
      profile: undefined,
      users: [],
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

  async updateParentResultVisibility(
    schoolId: string,
    payload: {
      parentShowScores: boolean;
      parentShowGrades: boolean;
      parentShowLabels: boolean;
      parentShowFeedback: boolean;
    },
  ): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }
    school.parentShowScores = payload.parentShowScores;
    school.parentShowGrades = payload.parentShowGrades;
    school.parentShowLabels = payload.parentShowLabels;
    school.parentShowFeedback = payload.parentShowFeedback;
    return this.schoolRepository.save(school);
  }

  async updateGradingPercentages(
    schoolId: string,
    classScorePercentage: number,
    examScorePercentage: number,
  ) {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    // Validate that percentages sum to 100
    if (Math.abs(classScorePercentage + examScorePercentage - 100) > 0.01) {
      throw new BadRequestException(
        'Class score and exam score percentages must sum to 100',
      );
    }

    school.classScorePercentage = classScorePercentage;
    school.examScorePercentage = examScorePercentage;
    return this.schoolRepository.save(school);
  }

  /**
   * Students and teachers live in the school's own schema, so counts can only be
   * read inside that tenant. Schools that are not provisioned (or are disabled)
   * have no schema yet and count as empty.
   */
  private async countTenantMembers(
    school: School,
  ): Promise<{ students: number; teachers: number }> {
    if (
      !school.schemaName ||
      school.isDisabled ||
      school.provisioningStatus !== SchoolProvisioningStatus.Active
    ) {
      return { students: 0, teachers: 0 };
    }

    try {
      return await this.tenantConnection.runForSchoolId(
        school.id,
        async (manager) => ({
          students: await manager.getRepository(Student).count(),
          teachers: await manager.getRepository(Teacher).count(),
        }),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to read tenant counts for school ${school.id}: ${error}`,
      );
      return { students: 0, teachers: 0 };
    }
  }

  async getSuperAdminDashboardStats() {
    const schools = await this.schoolRepository.find();

    const performanceData: Array<{
      schoolName: string;
      averageGrade: number;
      averageAttendanceRate: number;
      totalStudents: number;
      totalTeachers: number;
    }> = [];

    let totalOverallTeachers = 0;
    let totalOverallStudents = 0;

    for (const school of schools) {
      const { students, teachers } = await this.countTenantMembers(school);

      totalOverallStudents += students;
      totalOverallTeachers += teachers;

      // Grade and attendance aggregation across tenants is not implemented yet.
      performanceData.push({
        schoolName: school.name,
        averageGrade: 0,
        averageAttendanceRate: 0,
        totalStudents: students,
        totalTeachers: teachers,
      });
    }

    performanceData.sort((a, b) => b.averageGrade - a.averageGrade);

    const bestPerformingSchools = performanceData.slice(0, 3);
    const worstPerformingSchools = performanceData.slice(-3).reverse();

    return {
      totalSchools: schools.length,
      totalTeachers: totalOverallTeachers,
      totalStudents: totalOverallStudents,
      averageAttendanceRate: 0,
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

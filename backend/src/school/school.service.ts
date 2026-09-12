import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
import { FeeStructure } from 'src/fee-structure/fee-structure.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';
import { AcademicCalendar } from 'src/academic-calendar/entitites/academic-calendar.entity';
import { AdmissionPolicy } from 'src/admission-policy/admission-policy.entity';
import { GradingScheme } from 'src/grading-scheme/grading-scheme.entity';
import { mapGradingSchemeToResponse } from 'src/grading-scheme/grading-scheme.mapper';
import { GradingSystem } from 'src/grading-system/grading-system.entity';
import { Profile } from 'src/profile/profile.entity';
import { Role } from 'src/role/role.entity';

const SUPER_ADMIN_PEOPLE_LIMIT = 100;

type SuperAdminPeopleCounts = {
  students: number;
  teachers: number;
  admins: number;
  total: number;
  truncated: boolean;
};

type SuperAdminTenantDetails = {
  feeStructures: Array<{
    id: string;
    feeTitle: string;
    feeType: string;
    amount: number;
    allowUssdPayment: boolean;
    dueDate?: string;
    classLevels: Array<{ id: string; name: string }>;
  }>;
  classLevels: Array<{ id: string; name: string; description: string | null }>;
  academicCalendars: AcademicCalendar[];
  admissionPolicies: Array<AdmissionPolicy & { documentUrl?: string }>;
  gradingSystems: Array<{
    id: string;
    grade: string;
    minRange: number;
    maxRange: number;
  }>;
  gradingSchemes: ReturnType<typeof mapGradingSchemeToResponse>[];
  users: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    role: Role;
    profile?: Profile & { avatarUrl?: string };
  }>;
  peopleCounts: SuperAdminPeopleCounts;
};

type TenantPersonEntity = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  isArchived: boolean;
  role: Role;
  profile?: Profile | null;
};

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

    const tenantDetails = await this.loadTenantDetailsForSuperAdmin(school);
    const { hubtelClientSecretEnc: _secret, ...safeSchool } = school;

    return {
      ...safeSchool,
      ...tenantDetails,
      profile: undefined,
    };
  }

  private emptyTenantDetails(): SuperAdminTenantDetails {
    return {
      feeStructures: [],
      classLevels: [],
      academicCalendars: [],
      admissionPolicies: [],
      gradingSystems: [],
      gradingSchemes: [],
      users: [],
      peopleCounts: {
        students: 0,
        teachers: 0,
        admins: 0,
        total: 0,
        truncated: false,
      },
    };
  }

  private isTenantReadable(school: School): boolean {
    return Boolean(
      school.schemaName &&
        !school.isDisabled &&
        school.provisioningStatus === SchoolProvisioningStatus.Active,
    );
  }

  private async loadTenantDetailsForSuperAdmin(
    school: School,
  ): Promise<SuperAdminTenantDetails> {
    if (!this.isTenantReadable(school)) {
      return this.emptyTenantDetails();
    }

    try {
      const raw = await this.tenantConnection.runForSchoolId(
        school.id,
        async (manager) => this.fetchTenantDetailsInScope(manager, school.id),
      );

      const admissionPolicies = await this.signAdmissionPolicies(
        raw.admissionPolicies,
      );

      return {
        feeStructures: raw.feeStructures,
        classLevels: raw.classLevels,
        academicCalendars: raw.academicCalendars,
        admissionPolicies,
        gradingSystems: raw.gradingSystems,
        gradingSchemes: raw.gradingSchemes,
        users: this.mapTenantPeopleToUsersOverview(raw.people),
        peopleCounts: raw.peopleCounts,
      };
    } catch (error) {
      this.logger.warn(
        `Failed to read tenant details for school ${school.id}: ${error}`,
      );
      return this.emptyTenantDetails();
    }
  }

  private async fetchTenantDetailsInScope(
    manager: EntityManager,
    schoolId: string,
  ): Promise<{
    feeStructures: SuperAdminTenantDetails['feeStructures'];
    classLevels: SuperAdminTenantDetails['classLevels'];
    academicCalendars: AcademicCalendar[];
    admissionPolicies: AdmissionPolicy[];
    gradingSystems: SuperAdminTenantDetails['gradingSystems'];
    gradingSchemes: SuperAdminTenantDetails['gradingSchemes'];
    people: TenantPersonEntity[];
    peopleCounts: SuperAdminPeopleCounts;
  }> {
    const studentRepo = manager.getRepository(Student);
    const teacherRepo = manager.getRepository(Teacher);
    const adminRepo = manager.getRepository(SchoolAdmin);
    const activeWhere = { isArchived: false };
    const peopleOrder = { lastName: 'ASC' as const, firstName: 'ASC' as const };
    const peopleRelations = ['role', 'profile'] as const;

    const [
      feeRows,
      classLevelRows,
      academicCalendars,
      admissionPolicies,
      gradingSystems,
      gradingSchemeRows,
      studentCount,
      teacherCount,
      adminCount,
      students,
      teachers,
      admins,
    ] = await Promise.all([
      manager
        .getRepository(FeeStructure)
        .createQueryBuilder('fee')
        .leftJoinAndSelect('fee.classLevels', 'classLevel')
        .where('fee.schoolId = :schoolId', { schoolId })
        .getMany(),
      manager.getRepository(ClassLevel).find({
        select: ['id', 'name', 'description'],
        order: { name: 'ASC' },
      }),
      manager.getRepository(AcademicCalendar).find({
        relations: ['terms', 'terms.holidays'],
        order: { name: 'ASC' },
      }),
      manager.getRepository(AdmissionPolicy).find({
        where: { school: { id: schoolId } },
        order: { name: 'ASC' },
      }),
      this.loadGradingSystemsForSuperAdmin(manager, schoolId),
      manager.getRepository(GradingScheme).find({
        where: { school: { id: schoolId } },
        relations: ['bands', 'classLevels'],
        order: { updatedAt: 'DESC' },
      }),
      studentRepo.count({ where: activeWhere }),
      teacherRepo.count({ where: activeWhere }),
      adminRepo.count({ where: activeWhere }),
      studentRepo.find({
        where: activeWhere,
        relations: [...peopleRelations],
        order: peopleOrder,
        take: SUPER_ADMIN_PEOPLE_LIMIT,
      }),
      teacherRepo.find({
        where: activeWhere,
        relations: [...peopleRelations],
        order: peopleOrder,
        take: SUPER_ADMIN_PEOPLE_LIMIT,
      }),
      adminRepo.find({
        where: activeWhere,
        relations: [...peopleRelations],
        order: peopleOrder,
        take: SUPER_ADMIN_PEOPLE_LIMIT,
      }),
    ]);

    const feeStructures = feeRows.map((fee) => ({
      id: fee.id,
      feeTitle: fee.feeTitle,
      feeType: fee.feeType,
      amount: fee.amount,
      allowUssdPayment: fee.allowUssdPayment !== false,
      dueDate: fee.dueDate,
      classLevels: (fee.classLevels ?? []).map((cl) => ({
        id: cl.id,
        name: cl.name,
      })),
    }));

    const classLevels = classLevelRows.map((cl) => ({
      id: cl.id,
      name: cl.name,
      description: cl.description ?? null,
    }));

    const people: TenantPersonEntity[] = [
      ...students,
      ...teachers,
      ...admins,
    ];
    const peopleCounts: SuperAdminPeopleCounts = {
      students: studentCount,
      teachers: teacherCount,
      admins: adminCount,
      total: studentCount + teacherCount + adminCount,
      truncated:
        studentCount > SUPER_ADMIN_PEOPLE_LIMIT ||
        teacherCount > SUPER_ADMIN_PEOPLE_LIMIT ||
        adminCount > SUPER_ADMIN_PEOPLE_LIMIT,
    };

    const gradingSchemes = gradingSchemeRows.map((scheme) => {
      scheme.bands = (scheme.bands ?? []).sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
      );
      return mapGradingSchemeToResponse(scheme);
    });

    return {
      feeStructures,
      classLevels,
      academicCalendars,
      admissionPolicies,
      gradingSystems,
      gradingSchemes,
      people,
      peopleCounts,
    };
  }

  private async loadGradingSystemsForSuperAdmin(
    manager: EntityManager,
    schoolId: string,
  ): Promise<SuperAdminTenantDetails['gradingSystems']> {
    const schemes = await manager.getRepository(GradingScheme).find({
      where: { school: { id: schoolId }, status: 'active' },
      relations: ['bands'],
      order: { updatedAt: 'DESC' },
    });

    const preferred =
      schemes.find((scheme) => scheme.scopeType === 'school') ?? schemes[0];

    if (preferred?.bands?.length) {
      return [...preferred.bands]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((band) => ({
          id: band.id,
          grade: band.label || band.code,
          minRange: band.minScore,
          maxRange: band.maxScore,
        }));
    }

    const legacy = await manager.getRepository(GradingSystem).find({
      order: { minRange: 'DESC' },
    });

    return legacy.map((row) => ({
      id: row.id,
      grade: row.grade,
      minRange: row.minRange,
      maxRange: row.maxRange,
    }));
  }

  private async signAdmissionPolicies(
    policies: AdmissionPolicy[],
  ): Promise<Array<AdmissionPolicy & { documentUrl?: string }>> {
    return Promise.all(
      policies.map(async (policy) => {
        const result = { ...policy } as AdmissionPolicy & {
          documentUrl?: string;
        };
        if (!policy.documentPath) {
          return result;
        }
        try {
          result.documentUrl = await this.objectStorageService.getSignedUrl(
            policy.documentPath,
          );
        } catch {
          this.logger.warn(
            `Failed to sign admission policy document for policy ${policy.id}`,
          );
        }
        return result;
      }),
    );
  }

  private mapTenantPeopleToUsersOverview(
    people: TenantPersonEntity[],
  ): SuperAdminTenantDetails['users'] {
    return [...people]
      .map((person) => ({
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        status: person.isArchived ? 'archived' : person.status,
        role: person.role,
        profile: person.profile ?? undefined,
      }))
      .sort((a, b) => {
        const aName = `${a.lastName ?? ''} ${a.firstName ?? ''}`.trim();
        const bName = `${b.lastName ?? ''} ${b.firstName ?? ''}`.trim();
        return aName.localeCompare(bName);
      });
  }

  private async mapTenantPeopleToUsers(
    people: TenantPersonEntity[],
  ): Promise<SuperAdminTenantDetails['users']> {
    const mapped = await Promise.all(
      people.map(async (person) => {
        const profile = person.profile?.id
          ? await this.signProfileAvatar(person.profile)
          : undefined;

        return {
          id: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.email,
          status: person.isArchived ? 'archived' : person.status,
          role: person.role,
          profile,
        };
      }),
    );

    return mapped.sort((a, b) => {
      const aName = `${a.lastName ?? ''} ${a.firstName ?? ''}`.trim();
      const bName = `${b.lastName ?? ''} ${b.firstName ?? ''}`.trim();
      return aName.localeCompare(bName);
    });
  }

  private async signProfileAvatar(
    profile: Profile,
  ): Promise<Profile & { avatarUrl?: string }> {
    const result = { ...profile } as Profile & { avatarUrl?: string };
    if (!profile.avatarPath) {
      return result;
    }
    try {
      result.avatarUrl = await this.objectStorageService.getSignedUrl(
        profile.avatarPath,
      );
    } catch {
      this.logger.warn(`Failed to sign profile avatar for profile ${profile.id}`);
    }
    return result;
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

  async updatePerformanceAnalyticsEnabled(
    schoolId: string,
    performanceAnalyticsEnabled: boolean,
  ): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }
    school.performanceAnalyticsEnabled = performanceAnalyticsEnabled;
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

import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperAdmin } from './super-admin.entity';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { Role } from '../role/role.entity';
import { TenantDirectoryService } from 'src/tenant/tenant-directory.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolProvisioningStatus } from 'src/tenant/school-provisioning-status';
import { APIFeatures, QueryString } from '../common/api-features/api-features';
import { School } from 'src/school/school.entity';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { ProfileService } from 'src/profile/profile.service';
import { ObjectStorageServiceService } from 'src/object-storage-service/object-storage-service.service';
import { StudentGrade } from 'src/subject/student-grade.entity';
import { SuperAdminProfile } from './super-admin-profile.entity';

@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);
  constructor(
    @InjectRepository(SuperAdmin)
    private superAdminRepository: Repository<SuperAdmin>,
    @InjectRepository(SchoolAdmin)
    private adminRepository: Repository<SchoolAdmin>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(StudentGrade)
    private studentGradeRepository: Repository<StudentGrade>,
    private readonly profileService: ProfileService,
    private readonly objectStorageService: ObjectStorageServiceService,
    private readonly tenantDirectory: TenantDirectoryService,
    private readonly tenantConnection: TenantConnectionService,
    @InjectRepository(SuperAdminProfile)
    private superAdminProfileRepository: Repository<SuperAdminProfile>,
  ) {}

  async findAllUsers(queryString: QueryString) {
    let isArchived = false;
    if (queryString.status === 'archived') {
      isArchived = true;
    }

    const listings = await this.tenantDirectory.findAllByUserType(
      'school_admin',
    );

    const data: SchoolAdmin[] = [];
    for (const dir of listings) {
      const admin = await this.tenantConnection.runForSchoolId(
        dir.schoolId,
        () =>
          this.adminRepository.findOne({
            where: { id: dir.tenantUserId },
            relations: ['role', 'school', 'profile'],
          }),
      );
      if (admin && admin.isArchived === isArchived) {
        data.push(admin);
      }
    }

    const search = (queryString.search ?? '').toLowerCase();
    const filtered = search
      ? data.filter(
          (admin) =>
            admin.firstName?.toLowerCase().includes(search) ||
            admin.lastName?.toLowerCase().includes(search) ||
            admin.email?.toLowerCase().includes(search),
        )
      : data;

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const start = (page - 1) * limit;
    const pageData = filtered.slice(start, start + limit);

    return {
      data: pageData,
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    };
  }
  async findAllSchools(queryString: QueryString) {
    const baseQuery = this.schoolRepository.createQueryBuilder('school');

    // Build features without pagination to compute total count
    const featuresWithoutPagination = new APIFeatures(
      baseQuery.clone(),
      queryString,
    )
      .filter()
      .sort()
      .search(['name', 'address', 'email'])
      .limitFields();

    const total = await featuresWithoutPagination.getQuery().getCount();

    // Apply pagination and fetch data
    const featuresWithPagination = featuresWithoutPagination.paginate();
    const schools = await featuresWithPagination.getQuery().getMany();

    // Enrich logo urls
    await Promise.all(
      schools.map(async (school) => {
        if (school.logoPath) {
          try {
            school.logoUrl = await this.objectStorageService.getSignedUrl(
              school.logoPath,
            );
          } catch (error) {
            this.logger.warn(
              `Failed to get signed URL for school ${school.id}: ${error}`,
            );
          }
        }
      }),
    );

    const page = parseInt(queryString.page ?? '1', 10);
    const limit = parseInt(queryString.limit ?? '20', 10);
    const totalPages = Math.ceil(total / limit || 1);

    return {
      data: schools,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
  async getSchoolsPerformance(options?: {
    topThreshold?: number;
    lowThreshold?: number;
    scope?: 'range' | 'overall';
    from?: string; // ISO date
    to?: string; // ISO date
  }) {
    const topThreshold = options?.topThreshold ?? 70;
    const lowThreshold = options?.lowThreshold ?? 40;
    const scope =
      options?.scope ?? (options?.from || options?.to ? 'range' : 'overall');

    const schools = await this.schoolRepository.find();

    const results: Array<{
      schoolId: string;
      schoolName: string;
      topPerforming: number;
      lowPerforming: number;
    }> = [];

    for (const school of schools) {
      let grades: StudentGrade[] = [];
      if (
        school.provisioningStatus !== SchoolProvisioningStatus.Active ||
        school.isDisabled
      ) {
        results.push({
          schoolId: school.id,
          schoolName: school.name,
          topPerforming: 0,
          lowPerforming: 0,
        });
        continue;
      }

      await this.tenantConnection.runForSchoolId(school.id, async () => {
        if (scope === 'overall') {
          grades = await this.studentGradeRepository.find({
            relations: ['student', 'student.school'],
          });
        } else {
          const fromDate = options?.from ? new Date(options.from) : undefined;
          const toDate = options?.to ? new Date(options.to) : undefined;
          const qb = this.studentGradeRepository
            .createQueryBuilder('grade')
            .leftJoinAndSelect('grade.student', 'student')
            .leftJoinAndSelect('student.school', 'school');
          if (fromDate) qb.andWhere('grade.createdAt >= :fromDate', { fromDate });
          if (toDate) qb.andWhere('grade.createdAt <= :toDate', { toDate });
          grades = await qb.getMany();
        }
      });

      const perStudentTotals = new Map<
        string,
        { sum: number; count: number }
      >();
      for (const g of grades) {
        if (g.student?.school?.id !== school.id || g.totalScore == null) continue;
        const key = g.student.id;
        const current = perStudentTotals.get(key) || { sum: 0, count: 0 };
        current.sum += g.totalScore;
        current.count += 1;
        perStudentTotals.set(key, current);
      }

      let topPerforming = 0;
      let lowPerforming = 0;
      for (const [, agg] of perStudentTotals) {
        if (agg.count === 0) continue;
        const avg = agg.sum / agg.count;
        if (avg >= topThreshold) topPerforming += 1;
        if (avg <= lowThreshold) lowPerforming += 1;
      }

      results.push({
        schoolId: school.id,
        schoolName: school.name,
        topPerforming,
        lowPerforming,
      });
    }

    return results;
  }
  async getMe(user: SuperAdmin): Promise<SuperAdmin> {
    const superAdmin = await this.superAdminRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'profile'],
    });

    if (!superAdmin) {
      throw new NotFoundException(
        `Super Admin with ID ${superAdmin} not found`,
      );
    }
    if (superAdmin?.profile?.id) {
      // SuperAdminProfile is not tenant Profile; skip signed URL enrichment here.
    }

    return superAdmin;
  }

  async findOne(id: string) {
    const dir = await this.tenantDirectory.findByTenantUser(id, 'school_admin');
    if (!dir) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    const admin = await this.tenantConnection.runForSchoolId(
      dir.schoolId,
      () =>
        this.adminRepository.findOne({
          where: { id },
          relations: ['role', 'school'],
        }),
    );

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async findByEmail(email: string): Promise<SuperAdmin | null> {
    return this.superAdminRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async createWithRole(
    data: CreateSuperAdminDto & { role: Role },
  ): Promise<SuperAdmin> {
    // Check if super admin with email already exists
    const existingAdmin = await this.findByEmail(data.email);
    if (existingAdmin) {
      throw new ConflictException('Super Admin with this email already exists');
    }

    // Create super admin with provided role
    const superAdmin = this.superAdminRepository.create(data);
    return this.superAdminRepository.save(superAdmin);
  }

  async archive(id: string, archive: boolean) {
    const dir = await this.tenantDirectory.findByTenantUser(id, 'school_admin');
    if (!dir) {
      throw new NotFoundException('School admin not found');
    }
    return this.tenantConnection.runForSchoolId(dir.schoolId, async () => {
      const admin = await this.adminRepository.findOne({ where: { id } });
      if (!admin) {
        throw new NotFoundException('School admin not found');
      }
      admin.isArchived = archive;
      admin.status = archive ? 'archived' : 'active';
      return this.adminRepository.save(admin);
    });
  }

  async suspendSchoolAdmin(id: string, suspend: boolean) {
    const dir = await this.tenantDirectory.findByTenantUser(id, 'school_admin');
    if (!dir) {
      throw new NotFoundException('School admin not found');
    }
    return this.tenantConnection.runForSchoolId(dir.schoolId, async () => {
      const admin = await this.adminRepository.findOne({ where: { id } });
      if (!admin) {
        throw new NotFoundException('School admin not found');
      }
      admin.isSuspended = suspend;
      admin.status = suspend ? 'suspended' : 'active';
      return this.adminRepository.save(admin);
    });
  }
  async findAllArchivedUsers(queryString: QueryString) {
    return this.findAllUsers({ ...queryString, status: 'archived' });
  }

  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<SuperAdmin> {
    const superAdmin = await this.superAdminRepository.findOne({
      where: { id: adminId },
      relations: ['role', 'profile'],
    });
    if (!superAdmin) {
      throw new NotFoundException('Super admin not found');
    }
    if (!superAdmin.profile) {
      superAdmin.profile = this.superAdminProfileRepository.create({
        firstName: updateDto.firstName,
        lastName: updateDto.lastName,
        email: updateDto.email,
        superAdmin,
      });
    } else {
      Object.assign(superAdmin.profile, {
        firstName: updateDto.firstName ?? superAdmin.profile.firstName,
        lastName: updateDto.lastName ?? superAdmin.profile.lastName,
        email: updateDto.email ?? superAdmin.profile.email,
      });
    }
    Object.assign(superAdmin, {
      firstName: updateDto.firstName ?? superAdmin.firstName,
      lastName: updateDto.lastName ?? superAdmin.lastName,
    });
    return this.superAdminRepository.save(superAdmin);
  }

  getRepository(): Repository<SuperAdmin> {
    return this.superAdminRepository;
  }
}

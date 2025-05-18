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
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { APIFeatures, QueryString } from '../common/api-features/api-features';
import { School } from 'src/school/school.entity';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { ProfileService } from 'src/profile/profile.service';

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
    private readonly profileService: ProfileService,
  ) {}

  async findAllUsers(queryString: QueryString) {
    const baseQuery = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.role', 'role')
      .leftJoinAndSelect('admin.school', 'school')
      .where('admin.isArchived = :isArchived', { isArchived: false });

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

  async findAllSchools(queryString: QueryString) {
    const query = this.schoolRepository.createQueryBuilder('school');

    const features = new APIFeatures(query, queryString)
      .filter()
      .sort()
      .search()
      .limitFields()
      .paginate();

    return await features.getQuery().getMany();
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

    return superAdmin;
  }

  async findOne(id: string) {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['role', 'school'],
    });

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
    const admin = await this.findOne(id);
    admin.isArchived = archive;
    admin.status = archive ? 'archived' : 'active';
    return this.adminRepository.save(admin);
  }
  async findAllArchivedUsers(queryString: QueryString) {
    const query = this.adminRepository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('admin.role', 'role')
      .leftJoinAndSelect('admin.school', 'school')
      .where('admin.isArchived = :isArchived', { isArchived: true });

    const features = new APIFeatures(query, queryString)
      .filter()
      .sort()
      .search()
      .limitFields()
      .paginate();

    return await features.getQuery().getMany();
  }

  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<SuperAdmin> {
    return this.profileService.handleUpdateProfile(
      adminId,
      updateDto,
      this.superAdminRepository,
      ['role', 'profile'],
    );
  }
}

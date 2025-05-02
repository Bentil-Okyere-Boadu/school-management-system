import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperAdmin } from './super-admin.entity';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { UpdateSuperAdminDto } from './dto/update-super-admin.dto';
import { AuthService } from '../auth/services/auth.service';
import { Role } from '../role/role.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(SuperAdmin)
    private superAdminRepository: Repository<SuperAdmin>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private authService: AuthService,
  ) {}

  async findAll(): Promise<SuperAdmin[]> {
    return this.superAdminRepository.find({
      relations: ['role'],
    });
  }

  async findOne(id: string): Promise<SuperAdmin> {
    const superAdmin = await this.superAdminRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!superAdmin) {
      throw new NotFoundException(`SuperAdmin with ID ${id} not found`);
    }

    return superAdmin;
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

  async update(
    id: string,
    updateSuperAdminDto: UpdateSuperAdminDto,
  ): Promise<SuperAdmin> {
    const superAdmin = await this.findOne(id);

    // If updating email, check if it already exists
    if (
      updateSuperAdminDto.email &&
      updateSuperAdminDto.email !== superAdmin.email
    ) {
      const existingAdmin = await this.findByEmail(updateSuperAdminDto.email);
      if (existingAdmin) {
        throw new ConflictException(
          'Super Admin with this email already exists',
        );
      }
    }

    // If updating password, hash it
    if (updateSuperAdminDto.password) {
      updateSuperAdminDto.password = await this.authService.hashPassword(
        updateSuperAdminDto.password,
      );
    }

    // If updating role, find the new role
    let role: Role | null = superAdmin.role;
    if (updateSuperAdminDto.roleId) {
      role = await this.roleRepository.findOne({
        where: { id: updateSuperAdminDto.roleId },
      });

      if (!role) {
        throw new NotFoundException(
          `Role with ID ${updateSuperAdminDto.roleId} not found`,
        );
      }
    }

    const { roleId, ...superAdminData } = updateSuperAdminDto;

    // Update super admin
    const updatedSuperAdmin = this.superAdminRepository.merge(
      superAdmin,
      superAdminData,
    );
    updatedSuperAdmin.role = role;

    return this.superAdminRepository.save(updatedSuperAdmin);
  }

  async remove(id: string): Promise<void> {
    const superAdmin = await this.findOne(id);
    await this.superAdminRepository.remove(superAdmin);
  }
}

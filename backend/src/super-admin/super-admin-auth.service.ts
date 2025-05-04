import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { SuperAdmin } from './super-admin.entity';
import { RoleService } from 'src/role/role.service';
import { AuthService } from 'src/auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SuperAdminAuthService {
  constructor(
    @InjectRepository(SuperAdmin)
    private superAdminRepository: Repository<SuperAdmin>,
    private superAdminService: SuperAdminService,
    private authService: AuthService,
    private roleService: RoleService,
  ) {}

  async validateSuperAdmin(email: string, password: string) {
    const superAdmin = await this.superAdminService.findByEmail(email);

    if (!superAdmin) {
      return null;
    }

    const isPasswordValid = await this.authService.validatePassword(
      password,
      superAdmin.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    return superAdmin;
  }

  login(superAdmin: SuperAdmin) {
    return this.authService.createAuthResponse(superAdmin);
  }

  async signupSuperAdmin(createSuperAdminDto: CreateSuperAdminDto) {
    // Check if user with email already exists
    const existingSuperAdmin = await this.superAdminService.findByEmail(
      createSuperAdminDto.email,
    );

    if (existingSuperAdmin) {
      throw new ConflictException('Super Admin with this email already exists');
    }

    // Find the super_admin role
    const superAdminRole = await this.roleService.findByName('super_admin');

    if (!superAdminRole) {
      throw new NotFoundException("Required 'super_admin' role not found");
    }

    // Hash the password
    const hashedPassword = await this.authService.hashPassword(
      createSuperAdminDto.password,
    );

    // Create the super admin with hashed password and super_admin role
    const superAdmin = await this.superAdminService.createWithRole({
      ...createSuperAdminDto,
      password: hashedPassword,
      role: superAdminRole,
    });

    return this.login(superAdmin);
  }
  async forgotAdminPassword(email: string) {
    return this.authService.handleForgotPassword(
      email,
      this.superAdminRepository,
    );
  }
  async resetAdminPassword(token: string, newPassword: string) {
    return this.authService.handleResetPassword(
      token,
      newPassword,
      this.superAdminRepository,
    );
  }
}

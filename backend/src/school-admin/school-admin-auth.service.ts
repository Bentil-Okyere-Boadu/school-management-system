import { Injectable, NotFoundException } from '@nestjs/common';
import { SchoolAdmin } from './school-admin.entity';
import { TenantOnboardingService } from 'src/tenant/tenant-onboarding.service';
import { AuthService } from 'src/auth/auth.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantDirectory } from 'src/tenant/entities/tenant-directory.entity';

@Injectable()
export class SchoolAdminAuthService {
  constructor(
    private readonly tenantOnboarding: TenantOnboardingService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly authService: AuthService,
    @InjectRepository(TenantDirectory)
    private readonly directoryRepository: Repository<TenantDirectory>,
  ) {}

  async validateSchoolAdmin(
    email: string,
    password: string,
  ): Promise<SchoolAdmin | null> {
    return this.tenantOnboarding.validateSchoolAdminLogin(email, password);
  }

  async findByEmail(email: string): Promise<SchoolAdmin | null> {
    const directory = await this.directoryRepository.findOne({
      where: {
        loginKey: email.toLowerCase(),
        userType: 'school_admin',
      },
    });
    if (!directory) {
      return null;
    }
    return this.tenantConnection.runForSchoolId(
      directory.schoolId,
      async (manager) =>
        manager.findOne(SchoolAdmin, {
          where: { id: directory.tenantUserId },
        }),
    );
  }

  login(schoolAdmin: SchoolAdmin) {
    return this.authService.createAuthResponse(schoolAdmin);
  }

  async forgotPassword(email: string) {
    const admin = await this.findByEmail(email);
    if (!admin) {
      throw new NotFoundException('No user found with the provided credentials');
    }
    const directory = await this.directoryRepository.findOne({
      where: { loginKey: email.toLowerCase(), userType: 'school_admin' },
    });
    if (!directory) {
      throw new NotFoundException('No user found with the provided credentials');
    }
    return this.tenantConnection.runForSchoolId(
      directory.schoolId,
      async (manager) => {
        const repo = manager.getRepository(SchoolAdmin);
        return this.authService.handleForgotPassword(email, repo);
      },
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const directories = await this.directoryRepository.find({
      where: { userType: 'school_admin' },
    });
    for (const directory of directories) {
      try {
        return await this.tenantConnection.runForSchoolId(
          directory.schoolId,
          async (manager) => {
            const repo = manager.getRepository(SchoolAdmin);
            return this.authService.handleResetPassword(
              token,
              newPassword,
              repo,
            );
          },
        );
      } catch {
        continue;
      }
    }
    throw new NotFoundException('Invalid or expired token');
  }
}

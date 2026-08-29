import { Injectable, NotFoundException } from '@nestjs/common';
import { SchoolAdmin } from './school-admin.entity';
import { TenantOnboardingService } from 'src/tenant/tenant-onboarding.service';
import { AuthService } from 'src/auth/auth.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { PlatformPreloginTokenService } from 'src/tenant/platform-prelogin-token.service';

@Injectable()
export class SchoolAdminAuthService {
  constructor(
    private readonly tenantOnboarding: TenantOnboardingService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly preloginTokens: PlatformPreloginTokenService,
    private readonly authService: AuthService,
  ) {}

  async validateSchoolAdmin(
    email: string,
    password: string,
  ): Promise<SchoolAdmin | null> {
    return this.tenantOnboarding.validateSchoolAdminLogin(email, password);
  }

  async findByEmail(email: string): Promise<SchoolAdmin | null> {
    const directory = await this.tenantOnboarding.resolveSchoolAdminDirectory(
      email,
    );
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
    const directory = await this.tenantOnboarding.resolveSchoolAdminDirectory(
      email,
    );
    if (!directory) {
      throw new NotFoundException('No user found with the provided credentials');
    }

    const admin = await this.tenantConnection.runForSchoolId(
      directory.schoolId,
      async (manager) =>
        manager.findOne(SchoolAdmin, {
          where: { id: directory.tenantUserId },
        }),
    );
    if (!admin) {
      throw new NotFoundException('No user found with the provided credentials');
    }

    const result = await this.tenantConnection.runForSchoolId(
      directory.schoolId,
      async (manager) => {
        const repo = manager.getRepository(SchoolAdmin);
        return this.authService.issuePasswordReset(admin, repo);
      },
    );

    if (result.resetToken && result.resetTokenExpires) {
      await this.preloginTokens.register({
        token: result.resetToken,
        schoolId: directory.schoolId,
        userType: 'school_admin',
        purpose: 'password_reset',
        subjectId: admin.id,
        expiresAt: result.resetTokenExpires,
      });
    }

    return {
      success: result.success,
      message: result.message,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resolved = await this.preloginTokens.resolve(token, 'password_reset');
    if (resolved.userType !== 'school_admin') {
      throw new NotFoundException('Invalid or expired token');
    }

    const result = await this.tenantConnection.runForSchoolId(
      resolved.schoolId,
      async (manager) =>
        this.authService.handleResetPassword(
          token,
          newPassword,
          manager.getRepository(SchoolAdmin),
        ),
    );

    await this.preloginTokens.consume(token, 'password_reset');
    return result;
  }
}

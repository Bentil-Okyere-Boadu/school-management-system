import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Parent } from './parent.entity';
import { AuthService } from 'src/auth/auth.service';
import { ParentAccountStatus } from './parent.enums';
import { normalizeEmail } from './parent.helpers';
import { TenantUserLookupService } from 'src/tenant/tenant-user-lookup.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { PlatformPreloginTokenService } from 'src/tenant/platform-prelogin-token.service';

@Injectable()
export class ParentAuthService {
  constructor(
    private readonly tenantUserLookup: TenantUserLookupService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly preloginTokens: PlatformPreloginTokenService,
    private readonly authService: AuthService,
  ) {}

  async validateParent(email: string, password: string): Promise<Parent | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }

    const parent = await this.tenantUserLookup.findParentByEmail(normalized);
    if (
      !parent ||
      parent.isSuspended ||
      parent.isArchived ||
      !parent.password
    ) {
      return null;
    }

    const ok = await bcrypt.compare(password, parent.password);
    return ok ? parent : null;
  }

  async findByEmail(email: string): Promise<Parent | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }
    return this.tenantUserLookup.findParentByEmail(normalized);
  }

  login(parent: Parent) {
    return this.authService.createAuthResponse(parent);
  }

  async forgotPassword(email: string) {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
    }
    const parent = await this.findByEmail(normalized);
    if (!parent?.school?.id) {
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
    }
    const result = await this.tenantConnection.runForSchoolId(
      parent.school.id,
      (manager) =>
        this.authService.issuePasswordReset(
          parent,
          manager.getRepository(Parent),
          '/auth/parent/forgotPassword/resetPassword',
        ),
    );
    if (result.resetToken && result.resetTokenExpires) {
      await this.preloginTokens.register({
        token: result.resetToken,
        schoolId: parent.school.id,
        userType: 'parent',
        purpose: 'password_reset',
        subjectId: parent.id,
        expiresAt: result.resetTokenExpires,
      });
    }
    return {
      success: result.success,
      message: result.message,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resolved = await this.preloginTokens.claimForUse(
      token,
      'password_reset',
    );
    if (resolved.userType !== 'parent') {
      throw new NotFoundException('Invalid or expired token');
    }

    await this.tenantConnection.runForSchoolId(resolved.schoolId, async (manager) => {
      const parent = await manager.findOne(Parent, {
        where: { id: resolved.subjectId },
      });
      await this.authService.handleResetPassword(
        token,
        newPassword,
        manager.getRepository(Parent),
      );
      if (
        parent &&
        parent.status !== ParentAccountStatus.Suspended &&
        parent.status !== ParentAccountStatus.Archived
      ) {
        await manager.update(Parent, parent.id, {
          status: ParentAccountStatus.Active,
          isInvitationAccepted: true,
        });
      }
    });

    return { success: true };
  }

  async assertNotSuspended(email: string) {
    const parent = await this.findByEmail(email);
    if (parent?.isSuspended) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact the school administrator.',
      );
    }
  }
}

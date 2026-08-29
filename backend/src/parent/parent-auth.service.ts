import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Parent } from './parent.entity';
import { AuthService } from 'src/auth/auth.service';
import { ParentAccountStatus } from './parent.enums';
import { normalizeEmail, pickCanonicalParent } from './parent.helpers';
import { TenantUserLookupService } from 'src/tenant/tenant-user-lookup.service';
import { TenantConnectionService } from 'src/tenant/tenant-connection.service';
import { TenantIterationService } from 'src/tenant/tenant-iteration.service';

@Injectable()
export class ParentAuthService {
  constructor(
    private readonly tenantUserLookup: TenantUserLookupService,
    private readonly tenantConnection: TenantConnectionService,
    private readonly tenantIteration: TenantIterationService,
    private readonly authService: AuthService,
  ) {}

  async validateParent(email: string, password: string): Promise<Parent | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }

    const candidates = await this.findCandidatesByEmail(normalized);

    const unlocked: Parent[] = [];
    for (const candidate of candidates) {
      if (candidate.isSuspended || candidate.isArchived || !candidate.password) {
        continue;
      }
      if (await bcrypt.compare(password, candidate.password)) {
        unlocked.push(candidate);
      }
    }
    if (unlocked.length === 0) {
      return null;
    }

    const parent = pickCanonicalParent(unlocked);
    return parent ?? unlocked[0];
  }

  async findByEmail(email: string): Promise<Parent | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }
    return pickCanonicalParent(await this.findCandidatesByEmail(normalized));
  }

  private async findCandidatesByEmail(email: string): Promise<Parent[]> {
    return this.tenantUserLookup.findParentsByEmail(email);
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
    return this.tenantConnection.runForSchoolId(parent.school.id, (manager) =>
      this.authService.issuePasswordReset(
        parent,
        manager.getRepository(Parent),
        '/auth/parent/forgotPassword/resetPassword',
      ),
    );
  }

  async resetPassword(token: string, newPassword: string) {
    let lastError: unknown;
    await this.tenantIteration.forEachActiveSchool(async () => {
      if (lastError === 'done') {
        return;
      }
      try {
        const parent = await this.tenantConnection.manager.findOne(Parent, {
          where: { resetPasswordToken: token },
        });
        await this.authService.handleResetPassword(
          token,
          newPassword,
          this.tenantConnection.manager.getRepository(Parent),
        );
        if (
          parent &&
          parent.status !== ParentAccountStatus.Suspended &&
          parent.status !== ParentAccountStatus.Archived
        ) {
          await this.tenantConnection.manager.update(Parent, parent.id, {
            status: ParentAccountStatus.Active,
            isInvitationAccepted: true,
          });
        }
        lastError = 'done';
      } catch (error) {
        lastError = error;
      }
    });
    if (lastError === 'done') {
      return { success: true };
    }
    throw new NotFoundException('Invalid or expired token');
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

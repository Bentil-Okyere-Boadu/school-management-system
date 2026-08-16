import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Parent } from './parent.entity';
import { AuthService } from 'src/auth/auth.service';
import { ParentAccountStatus } from './parent.enums';
import { normalizeEmail, pickCanonicalParent } from './parent.helpers';

@Injectable()
export class ParentAuthService {
  constructor(
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
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

    const parent = pickCanonicalParent(candidates);

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
    return this.parentRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.role', 'role')
      .leftJoinAndSelect('parent.school', 'school')
      .where('LOWER(parent.email) = :email', { email })
      .getMany();
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
    if (!parent) {
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
    }
    return this.authService.issuePasswordReset(
      parent,
      this.parentRepository,
      '/auth/parent/forgotPassword/resetPassword',
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const parent = await this.parentRepository.findOne({
      where: { resetPasswordToken: token },
    });
    const result = await this.authService.handleResetPassword(
      token,
      newPassword,
      this.parentRepository,
    );
    if (
      parent &&
      parent.status !== ParentAccountStatus.Suspended &&
      parent.status !== ParentAccountStatus.Archived
    ) {
      await this.parentRepository.update(parent.id, {
        status: ParentAccountStatus.Active,
        isInvitationAccepted: true,
      });
    }
    return result;
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

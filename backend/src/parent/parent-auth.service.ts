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
import { normalizeEmail } from './parent.helpers';

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

    const parent = await this.parentRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.role', 'role')
      .leftJoinAndSelect('parent.school', 'school')
      .where('LOWER(parent.email) = :email', { email: normalized })
      .getOne();

    if (!parent?.password) {
      return null;
    }

    const valid = await bcrypt.compare(password, parent.password);
    if (!valid) {
      return null;
    }

    if (parent.isSuspended || parent.isArchived) {
      return null;
    }

    return parent;
  }

  async findByEmail(email: string): Promise<Parent | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }
    return this.parentRepository
      .createQueryBuilder('parent')
      .leftJoinAndSelect('parent.role', 'role')
      .leftJoinAndSelect('parent.school', 'school')
      .where('LOWER(parent.email) = :email', { email: normalized })
      .getOne();
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
    return this.authService.handleForgotPassword(
      normalized,
      this.parentRepository,
      '/auth/parent/forgotPassword/resetPassword',
    );
  }

  async resetPassword(token: string, newPassword: string) {
    return this.authService.handleResetPassword(
      token,
      newPassword,
      this.parentRepository,
    );
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

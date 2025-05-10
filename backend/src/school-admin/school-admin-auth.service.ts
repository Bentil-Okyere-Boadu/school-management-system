import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SchoolAdmin } from './school-admin.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SchoolAdminAuthService {
  //private readonly logger = new Logger(SchoolAdminAuthService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
    private readonly authService: AuthService,
  ) {}

  async validateSchoolAdmin(
    email: string,
    password: string,
  ): Promise<SchoolAdmin | null> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { email },
    });

    if (!schoolAdmin) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      schoolAdmin.password,
    );

    if (!isPasswordValid) {
      return null;
    }
    return schoolAdmin;
  }

  login(schoolAdmin: SchoolAdmin) {
    return this.authService.createAuthResponse(schoolAdmin);
  }

  async forgotPassword(email: string) {
    return this.authService.handleForgotPassword(
      email,
      this.schoolAdminRepository,
    );
  }

  async resetPassword(token: string, newPassword: string) {
    return this.authService.handleResetPassword(
      token,
      newPassword,
      this.schoolAdminRepository,
    );
  }
}

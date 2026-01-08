import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SchoolAdminAuthService } from '../school-admin-auth.service';

@Injectable()
export class SchoolAdminLocalStrategy extends PassportStrategy(
  Strategy,
  'school-admin-local',
) {
  constructor(private schoolAdminAuthService: SchoolAdminAuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const schoolAdmin = await this.schoolAdminAuthService.validateSchoolAdmin(
      email,
      password,
    );

    if (!schoolAdmin) {
      // Check if the admin exists and is suspended
      const admin = await this.schoolAdminAuthService.findByEmail(email);
      if (admin?.isSuspended) {
        throw new UnauthorizedException(
          'Your account has been suspended. Please contact the super administrator for assistance.',
        );
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    return schoolAdmin;
  }
}

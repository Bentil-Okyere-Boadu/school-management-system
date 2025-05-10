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
      throw new UnauthorizedException('Invalid credentials');
    }

    return schoolAdmin;
  }
}

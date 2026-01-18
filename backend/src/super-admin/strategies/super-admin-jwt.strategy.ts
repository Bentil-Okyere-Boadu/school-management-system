import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { SuperAdminService } from '../super-admin.service';

@Injectable()
export class SuperAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'super-admin-jwt',
) {
  constructor(
    private configService: ConfigService,
    private superAdminService: SuperAdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    // Check if the token is for a super admin (based on role name)
    if (payload.role !== 'super_admin') {
      return null;
    }

    const superAdmin = await this.superAdminService.findByEmail(payload.email);
    if (!superAdmin) {
      return null;
    }

    // Return only necessary fields
    return {
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      status: superAdmin.status,
      role: superAdmin.role,
    };
  }
}

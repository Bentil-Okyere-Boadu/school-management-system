import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from '../school-admin.entity';

@Injectable()
export class SchoolAdminJwtStrategy extends PassportStrategy(
  Strategy,
  'school-admin-jwt',
) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: any) {
    // Check if the token is for a school admin (based on role name)
    if (payload.role !== 'school_admin') {
      return null;
    }

    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { id: payload.sub },
    });

    if (!schoolAdmin) {
      return null;
    }

    // Return only necessary fields
    return {
      id: schoolAdmin.id,
      email: schoolAdmin.email,
      name: schoolAdmin.name,
      status: schoolAdmin.status,
      role: schoolAdmin.role,
      schoolId: schoolAdmin.school?.id,
    };
  }
}

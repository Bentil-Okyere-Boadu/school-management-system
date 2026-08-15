import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parent } from '../parent.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@Injectable()
export class ParentJwtStrategy extends PassportStrategy(Strategy, 'parent-jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
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
    if (payload.role !== 'parent') {
      return null;
    }

    const parent = await this.parentRepository.findOne({
      where: { id: payload.sub },
      relations: ['role', 'school'],
    });

    if (!parent || parent.isSuspended || parent.isArchived) {
      return null;
    }

    if (parent.school?.id) {
      const hasSuspendedAdmin = await this.schoolAdminRepository.findOne({
        where: { school: { id: parent.school.id }, isSuspended: true },
      });
      if (hasSuspendedAdmin) {
        return null;
      }
    }

    return {
      id: parent.id,
      email: parent.email,
      firstName: parent.firstName,
      lastName: parent.lastName,
      status: parent.status,
      role: parent.role,
      school: parent.school,
      schoolId: parent.school?.id,
    };
  }
}

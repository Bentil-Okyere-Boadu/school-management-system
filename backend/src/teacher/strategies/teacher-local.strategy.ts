import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TeacherAuthService } from '../teacher.auth.service';
import { Teacher } from '../teacher.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';

@Injectable()
export class TeacherLocalStrategy extends PassportStrategy(
  Strategy,
  'teacher-local',
) {
  constructor(
    private readonly teacherAuthService: TeacherAuthService,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
  ) {
    super({ usernameField: 'identifier', passwordField: 'pin' });
  }

  async validate(identifier: string, pin: string): Promise<Teacher> {
    const teacher = await this.teacherAuthService.validateTeacher(
      identifier,
      pin,
    );
    if (!teacher) {
      // Check if the teacher exists and is suspended
      const foundTeacher =
        await this.teacherAuthService.findByEmailOrTeacherId(identifier);
      if (foundTeacher) {
        if (foundTeacher.isSuspended) {
          throw new UnauthorizedException(
            'Access denied. This account cannot be accessed at the moment. Please contact your school for further assistance.',
          );
        }
        // Check if their school admin is suspended
        if (foundTeacher.school?.id) {
          const hasSuspendedAdmin = await this.schoolAdminRepository.findOne({
            where: {
              school: { id: foundTeacher.school.id },
              isSuspended: true,
            },
          });
          if (hasSuspendedAdmin) {
            throw new UnauthorizedException(
              'Access denied. This account cannot be accessed at the moment. Please contact your school for further assistance.',
            );
          }
        }
      }
      throw new UnauthorizedException('Invalid credentials');
    }
    return teacher;
  }
}

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TeacherAuthService } from '../teacher.auth.service';
import { Teacher } from '../teacher.entity';

@Injectable()
export class TeacherLocalStrategy extends PassportStrategy(
  Strategy,
  'teacher-local',
) {
  constructor(private readonly teacherAuthService: TeacherAuthService) {
    super({ usernameField: 'identifier', passwordField: 'pin' });
  }

  async validate(
    identifier: string,
    pin: string,
  ): Promise<Teacher> {
    const teacher = await this.teacherAuthService.validateTeacher(identifier, pin);
    if (!teacher) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return teacher;
  }
} 
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Student } from '../student.entity';
import { StudentAuthService } from '../student.auth.service';

@Injectable()
export class StudentLocalStrategy extends PassportStrategy(
  Strategy,
  'student-local',
) {
  constructor(private readonly studentAuthService: StudentAuthService) {
    // By default, passport-local expects 'username' and 'password'.
    // We'll use 'identifier' (studentId or email) and 'pin'.
    super({ usernameField: 'identifier', passwordField: 'pin' });
  }

  async validate(identifier: string, pin: string): Promise<Student> {
    const student = await this.studentAuthService.validateStudent(
      identifier,
      pin,
    );
    if (!student) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return student;
  }
}

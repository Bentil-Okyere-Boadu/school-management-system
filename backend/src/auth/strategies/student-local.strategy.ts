import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { StudentAuthService } from 'src/student/student.auth.service';

@Injectable()
export class StudentLocalStrategy extends PassportStrategy(
  Strategy,
  'student-local',
) {
  constructor(private studentAuthService: StudentAuthService) {
    super({
      usernameField: 'identifier', // Can be email or studentId
      passwordField: 'pin',
    });
  }

  async validate(identifier: string, pin: string) {
    const student = await this.studentAuthService.validateStudent(
      identifier,
      pin,
    );
    if (!student) {
      throw new UnauthorizedException(
        'Invalid credentials or inactive account',
      );
    }

    return student;
  }
}

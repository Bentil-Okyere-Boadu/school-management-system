import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { AuthService } from 'src/auth/auth.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TeacherAuthService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(SchoolAdmin)
    private readonly schoolAdminRepository: Repository<SchoolAdmin>,
    private readonly authService: AuthService,
  ) {}

  async validateTeacher(
    identifier: string,
    pin: string,
  ): Promise<Teacher | null> {
    const teacher = await this.findByEmailOrTeacherId(identifier);
    if (!teacher) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pin, teacher.password);
    if (!isPasswordValid || teacher.isSuspended) {
      return null;
    }

    // Check if any school admin for this school is suspended
    // If yes, prevent login
    if (teacher.school?.id) {
      const hasSuspendedAdmin = await this.schoolAdminRepository.findOne({
        where: { school: { id: teacher.school.id }, isSuspended: true },
      });
      if (hasSuspendedAdmin) {
        return null; // Prevent login
      }
    }

    if (teacher.status === 'pending') {
      teacher.status = 'active';
      teacher.isInvitationAccepted = true;
      await this.teacherRepository.save(teacher);
    }

    return teacher;
  }

  async findByEmailOrTeacherId(identifier: string): Promise<Teacher | null> {
    return this.teacherRepository.findOne({
      where: [{ email: identifier }, { teacherId: identifier }],
      relations: ['role', 'school'],
    });
  }

  login(teacher: Teacher) {
    return this.authService.createAuthResponse(teacher);
  }
}

import { AuthService } from 'src/auth/auth.service';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Student } from './student.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentAuthService {
  //private readonly logger = new Logger(StudentAuthService.name);

  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly authService: AuthService,
  ) {}

  /**
   * Validate student credentials (email/studentId and PIN)
   */
  async validateStudent(
    identifier: string,
    pin: string,
  ): Promise<Student | null> {
    const student = await this.findByEmailOrStudentId(identifier);

    if (!student) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pin, student.password);
    if (!isPasswordValid) {
      return null;
    }

    if (student.status === 'pending') {
      student.status = 'active';
      student.isInvitationAccepted = true;
      await this.studentRepository.save(student);
    }

    return student;
  }
  /**
   * Find a student by email or student ID
   */
  async findByEmailOrStudentId(identifier: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      where: [{ email: identifier }, { studentId: identifier }],
      relations: ['role', 'school'],
    });
  }
  login(student: Student) {
    return this.authService.createAuthResponse(student);
  }
}

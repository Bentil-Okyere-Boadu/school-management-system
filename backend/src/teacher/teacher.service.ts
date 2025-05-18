import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { Role } from '../role/role.entity';
import { School } from '../school/school.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { InvitationService } from 'src/invitation/invitation.service';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    private emailService: EmailService,
    private invitationService: InvitationService,
  ) {}

  async resendTeacherInvitation(
    userId: string,
    adminUser: SchoolAdmin,
  ): Promise<Teacher> {
    if (adminUser.role.name !== 'school_admin') {
      throw new UnauthorizedException(
        'Only school admins can resend invitations',
      );
    }
    if (!adminUser.school) {
      throw new BadRequestException('Admin not associated with any school');
    }
    const teacher = await this.teacherRepository.findOne({
      where: {
        id: userId,
        status: 'pending',
        school: { id: adminUser.school.id },
      },
      relations: ['role', 'school'],
    });
    if (!teacher) {
      throw new NotFoundException('Pending teacher not found in your school');
    }
    const pin = this.invitationService.generatePin();
    teacher.invitationToken = uuidv4();
    teacher.invitationExpires =
      this.invitationService.calculateTokenExpiration();
    teacher.password = await bcrypt.hash(pin, 10);
    const updatedTeacher = await this.teacherRepository.save(teacher);
    try {
      await this.emailService.sendTeacherInvitation(
        updatedTeacher,
        updatedTeacher.teacherId,
        pin,
      );
    } catch (error) {}
    return updatedTeacher;
  }

  async forgotPin(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const teacher = await this.teacherRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!teacher) {
      return {
        success: true,
        message: 'If your email is registered, you will receive a PIN reset',
      };
    }
    const pin = this.invitationService.generatePin();
    teacher.password = await bcrypt.hash(pin, 10);
    await this.teacherRepository.save(teacher);
    try {
      await this.emailService.sendTeacherPinReset(teacher, pin);
      return {
        success: true,
        message: 'PIN reset instructions sent to your email',
      };
    } catch (error) {
      throw new BadRequestException('Failed to send PIN reset email');
    }
  }
}

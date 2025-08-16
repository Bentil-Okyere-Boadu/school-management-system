import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from './teacher.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { EmailService } from '../common/services/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { InvitationService } from 'src/invitation/invitation.service';
import { ProfileService } from 'src/profile/profile.service';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { Student } from 'src/student/student.entity';
import { ClassLevel } from 'src/class-level/class-level.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    private emailService: EmailService,
    private invitationService: InvitationService,
    private readonly profileService: ProfileService,
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
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
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
  async updateProfile(
    adminId: string,
    updateDto: UpdateProfileDto,
  ): Promise<Teacher> {
    return this.profileService.handleUpdateProfile(
      adminId,
      updateDto,
      this.teacherRepository,
      ['role', 'school', 'profile'],
    );
  }

  getRepository(): Repository<Teacher> {
    return this.teacherRepository;
  }

  async getMyProfile(user: Teacher) {
    if (!user) {
      throw new NotFoundException('no Teacher found');
    }

    const teacherInfo = await this.teacherRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'profile'],
    });
    if (teacherInfo?.profile?.id) {
      const profileWithUrl = await this.profileService.getProfileWithImageUrl(
        teacherInfo.profile.id,
      );
      teacherInfo.profile = profileWithUrl;
    }

    return teacherInfo;
  }

  async checkIfClassTeacher(
    userId: string,
    classLevelId?: string,
    studentId?: string,
  ): Promise<{ isClassTeacher: boolean }> {
    if (classLevelId) {
      const classLevel = await this.teacherRepository.manager
        .getRepository(ClassLevel)
        .createQueryBuilder('classLevel')
        .leftJoin('classLevel.classTeacher', 'classTeacher')
        .where('classLevel.id = :id', { id: classLevelId })
        .select(['classLevel.id', 'classTeacher.id'])
        .getOne();

      if (!classLevel) {
        return { isClassTeacher: false };
      }

      return { isClassTeacher: classLevel?.classTeacher?.id === userId };
    }

    if (studentId) {
      const student = await this.teacherRepository.manager
        .getRepository(Student)
        .findOne({
          where: { id: studentId },
          relations: ['classLevels', 'classLevels.classTeacher'],
        });

      if (!student) {
        return { isClassTeacher: false };
      }

      const isClassTeacher = student.classLevels.some(
        (classLevel) => classLevel?.classTeacher?.id === userId,
      );

      return { isClassTeacher };
    }

    return { isClassTeacher: false };
  }
}

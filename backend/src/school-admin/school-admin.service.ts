import {
  Injectable,
  Logger,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { SchoolAdmin } from './school-admin.entity';

@Injectable()
export class SchoolAdminAuthService {
  private readonly logger = new Logger(SchoolAdminAuthService.name);

  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    private jwtService: JwtService,
  ) {}

  async validateSchoolAdmin(email: string, pin: string): Promise<SchoolAdmin> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { email },
    });

    if (!schoolAdmin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPinValid = await bcrypt.compare(pin, schoolAdmin.password);

    if (!isPinValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (schoolAdmin.status === 'pending') {
      schoolAdmin.status = 'active';
      schoolAdmin.isInvitationAccepted = true;
      await this.schoolAdminRepository.save(schoolAdmin);
      this.logger.log(
        `School Admin ${schoolAdmin.name} activated their account on first login`,
      );
    }

    return schoolAdmin;
  }

  createAuthResponse(schoolAdmin: SchoolAdmin) {
    const payload = {
      email: schoolAdmin.email,
      sub: schoolAdmin.id,
      role: schoolAdmin.role?.name,
      schoolId: schoolAdmin.school?.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      ...schoolAdmin,
    };
  }

  async login(email: string, pin: string) {
    const schoolAdmin = await this.validateSchoolAdmin(email, pin);
    return this.createAuthResponse(schoolAdmin);
  }

  // async forgotPin(email: string) {
  //   const successResponse = {
  //     success: true,
  //     message:
  //       'If your details are in our system, you will receive a PIN reset link',
  //   };

  //   const schoolAdmin = await this.schoolAdminRepository.findOne({
  //     where: { email },
  //   });

  //   if (!schoolAdmin) {
  //     // Return success anyway to prevent email enumeration
  //     return successResponse;
  //   }

  //   const resetToken = uuidv4();
  //   const resetTokenExpires = new Date();
  //   resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30);

  //   schoolAdmin.resetPinToken = resetToken;
  //   schoolAdmin.resetPinExpires = resetTokenExpires;
  //   await this.schoolAdminRepository.save(schoolAdmin);

  //   // Send reset email with token
  //   await this.emailService.sendPinResetEmail(
  //     schoolAdmin.email,
  //     schoolAdmin.name,
  //     resetToken,
  //   );

  //   return successResponse;
  // }

  // async resetPin(token: string, newPin: string) {
  //   const now = new Date();
  //   const schoolAdmin = await this.schoolAdminRepository.findOne({
  //     where: {
  //       resetPasswordToken: token,
  //       resetPasswordExpires: { $gt: now }, // Expiry date must be in the future
  //     },
  //   });

  //   if (!schoolAdmin) {
  //     throw new NotFoundException('Invalid or expired reset token');
  //   }

  //   // Hash and update the PIN
  //   const hashedPin = await bcrypt.hash(newPin, 10);
  //   schoolAdmin.password = hashedPin;
  //   schoolAdmin.resetPasswordToken = null;
  //   schoolAdmin.resetPasswordExpires = null;
  //   await this.schoolAdminRepository.save(schoolAdmin);

  //   return {
  //     success: true,
  //     message: 'PIN has been reset successfully',
  //   };
  // }
}

@Injectable()
export class SchoolAdminService {
  constructor(
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
  ) {}

  async findAll(): Promise<SchoolAdmin[]> {
    return this.schoolAdminRepository.find();
  }

  async findOne(id: string): Promise<SchoolAdmin> {
    const schoolAdmin = await this.schoolAdminRepository.findOne({
      where: { id },
    });

    if (!schoolAdmin) {
      throw new NotFoundException(`School admin with ID ${id} not found`);
    }

    return schoolAdmin;
  }

  async update(
    id: string,
    updateSchoolAdminDto: Partial<SchoolAdmin>,
  ): Promise<SchoolAdmin> {
    const schoolAdmin = await this.findOne(id);
    Object.assign(schoolAdmin, updateSchoolAdminDto);
    return this.schoolAdminRepository.save(schoolAdmin);
  }

  async remove(id: string): Promise<void> {
    const schoolAdmin = await this.findOne(id);
    await this.schoolAdminRepository.remove(schoolAdmin);
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { FindOptionsWhere, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from 'src/common/services/email.service';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}
  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  generateToken(payload: { [key: string]: any }): string {
    return this.jwtService.sign(payload);
  }

  createAuthResponse(entity: SuperAdmin | SchoolAdmin | Student | Teacher) {
    const payload = {
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      sub: entity.id,
      role: entity.role?.name,
      //schoolId: entity?.school?.id,
    };

    return {
      access_token: this.generateToken(payload),
      ...entity,
    };
  }

  async handleForgotPassword<
    T extends {
      email: string;
      resetPasswordToken: string;
      resetPasswordExpires: Date;
    },
  >(email: string, repository: Repository<T>) {
    const user = await repository.findOne({
      where: { email } as FindOptionsWhere<T>,
    });

    if (!user) {
      throw new NotFoundException(
        'No user found with the provided credentials',
      );
    }

    const resetToken = uuidv4();
    const resetTokenExpires = new Date();
    resetTokenExpires.setMinutes(resetTokenExpires.getMinutes() + 30);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await repository.save(user);

    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending email:', error);
    }

    return {
      success: true,
      message: 'Password reset link sent to your email',
    };
  }

  async handleResetPassword<
    T extends {
      resetPasswordToken: string | null;
      resetPasswordExpires: Date | null;
      password: string;
    },
  >(
    token: string,
    newPassword: string,
    repository: Repository<T>,
  ): Promise<{ success: boolean; message: string }> {
    const userWithToken = await repository.findOne({
      where: { resetPasswordToken: token } as FindOptionsWhere<T>,
    });

    if (!userWithToken) {
      this.logger.error(
        `Password reset failed: Token not found in database: ${token}`,
      );
      throw new UnauthorizedException('Invalid token - token not found');
    }

    const expiryTimestamp = userWithToken.resetPasswordExpires?.getTime();
    const currentTimestamp = Date.now();

    if (!expiryTimestamp || expiryTimestamp <= currentTimestamp) {
      this.logger.error('Password reset failed: Token expired');
      throw new UnauthorizedException(
        'Expired token - please request a new password reset',
      );
    }

    userWithToken.password = await this.hashPassword(newPassword);
    userWithToken.resetPasswordToken = null;
    userWithToken.resetPasswordExpires = null;

    await repository.save(userWithToken);

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}

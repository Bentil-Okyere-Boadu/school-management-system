import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { FindOptionsWhere, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/common/services/email.service';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { Student } from 'src/student/student.entity';
import { Teacher } from 'src/teacher/teacher.entity';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private emailService: EmailService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private configService: ConfigService,
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

  generateToken(payload: { [key: string]: any }, expiresIn?: string): string {
    const options = expiresIn ? { expiresIn } : {};
    return this.jwtService.sign(payload, options);
  }

  async generateRefreshToken(
    userId: string,
    userType: 'school_admin' | 'teacher' | 'student' | 'super_admin',
  ): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    const refreshTokenExpiryDays = this.configService.get<number>(
      'JWT_REFRESH_TOKEN_EXPIRES_DAYS',
      7,
    );
    expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiryDays);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      userType,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (!refreshToken) {
      return null;
    }

    if (refreshToken.isRevoked) {
      return null;
    }

    if (refreshToken.expiresAt < new Date()) {
      // Token expired, mark as revoked
      refreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(refreshToken);
      return null;
    }

    return refreshToken;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (refreshToken) {
      refreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async revokeAllUserTokens(
    userId: string,
    userType: 'school_admin' | 'teacher' | 'student' | 'super_admin',
  ): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, userType, isRevoked: false },
      { isRevoked: true },
    );
  }

  async createAuthResponse(
    entity: SuperAdmin | SchoolAdmin | Student | Teacher,
  ) {
    const payload = {
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      sub: entity.id,
      role: entity.role?.name,
    };

    let userType: 'school_admin' | 'teacher' | 'student' | 'super_admin';
    if (entity instanceof SchoolAdmin) {
      userType = 'school_admin';
    } else if (entity instanceof Teacher) {
      userType = 'teacher';
    } else if (entity instanceof Student) {
      userType = 'student';
    } else {
      userType = 'super_admin';
    }

    const accessToken = this.generateToken(payload, '15m');
    const refreshToken = await this.generateRefreshToken(entity.id, userType);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
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

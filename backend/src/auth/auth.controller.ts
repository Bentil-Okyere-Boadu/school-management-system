import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Throttle } from '@nestjs/throttler';
import { RefreshToken } from './entities/refresh-token.entity';
import { SchoolAdmin } from '../school-admin/school-admin.entity';
import { Teacher } from '../teacher/teacher.entity';
import { Student } from '../student/student.entity';
import { SuperAdmin } from '../super-admin/super-admin.entity';

export class RefreshTokenDto {
  @IsString()
  @IsOptional()
  refresh_token?: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(SchoolAdmin)
    private schoolAdminRepository: Repository<SchoolAdmin>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(SuperAdmin)
    private superAdminRepository: Repository<SuperAdmin>,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshToken = (await this.authService.validateRefreshToken(
      refresh_token,
    )) as RefreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    let user: SchoolAdmin | Teacher | Student | SuperAdmin | null = null;

    switch (refreshToken.userType) {
      case 'school_admin':
        user = await this.schoolAdminRepository.findOne({
          where: { id: refreshToken.userId },
          relations: ['role', 'school'],
        });
        break;
      case 'teacher':
        user = await this.teacherRepository.findOne({
          where: { id: refreshToken.userId },
          relations: ['role', 'school'],
        });
        break;
      case 'student':
        user = await this.studentRepository.findOne({
          where: { id: refreshToken.userId },
          relations: ['role', 'school'],
        });
        break;
      case 'super_admin':
        user = await this.superAdminRepository.findOne({
          where: { id: refreshToken.userId },
          relations: ['role'],
        });
        break;
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      sub: user.id,
      role: user.role?.name,
    };

    const accessToken = this.authService.generateToken(payload, '15m');

    this.logger.log(`Token refreshed for user ${user.id} (${refreshToken.userType})`);

    return {
      access_token: accessToken,
    };
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    const { refresh_token } = refreshTokenDto;

    if (refresh_token) {
      await this.authService.revokeRefreshToken(refresh_token);
    }

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}

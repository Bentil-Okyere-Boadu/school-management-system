import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { SchoolAdminService } from '../school-admin/school-admin.service';
import { SuperAdminService } from '../super-admin/super-admin.service';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';

export class ProfileImageUploadDto {
  file: Express.Multer.File;
}
@Controller('profiles')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly schoolAdminService: SchoolAdminService,
    private readonly superAdminService: SuperAdminService,
  ) {}

  // Upload profile image for school admin
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('school-admin/:id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSchoolAdminAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.profileService.updateProfileImage(
      id,
      file,
      this.schoolAdminService.getRepository(),
      ['school'],
    );

    return {
      message: 'Profile image uploaded successfully',
      avatarUrl: result.imageUrl,
      profile: result.entity.profile,
    };
  }

  // Upload profile image for super admin
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('super-admin/:id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSuperAdminAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.profileService.updateProfileImage(
      id,
      file,
      this.superAdminService.getRepository(),
    );

    return {
      message: 'Profile image uploaded successfully',
      avatarUrl: result.imageUrl,
      profile: result.entity.profile,
    };
  }

  // Get profile with avatar URL
  @Get(':id')
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    const profile = await this.profileService.getProfileWithImageUrl(id);
    return {
      message: 'Profile retrieved successfully',
      data: profile,
    };
  }

  // Remove profile image for school admin
  @Delete('school-admin/:id/avatar')
  async removeSchoolAdminAvatar(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.profileService.removeProfileImage(
      id,
      this.schoolAdminService.getRepository(),
      ['school'],
    );

    return {
      message: 'Profile image removed successfully',
      data: result,
    };
  }

  // Remove profile image for super admin
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('super-admin/:id/avatar')
  async removeSuperAdminAvatar(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.profileService.removeProfileImage(
      id,
      this.superAdminService.getRepository(),
    );

    return {
      message: 'Profile image removed successfully',
      data: result,
    };
  }
}

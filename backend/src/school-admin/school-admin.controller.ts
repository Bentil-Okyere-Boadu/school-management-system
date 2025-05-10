import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { SchoolAdminAuthService } from './school-admin-auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SchoolAdminLocalAuthGuard } from './guards/school-admin-local-auth.guard';
import { SchoolAdmin } from './school-admin.entity';
import { SchoolAdminService } from './school-admin.service';
import { CurrentUser } from 'src/user/current-user.decorator';
import { SchoolAdminJwtAuthGuard } from './guards/school-admin-jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('school-admin')
export class SchoolAdminController {
  constructor(
    private readonly schoolAdminAuthService: SchoolAdminAuthService,
    private readonly schoolAdminService: SchoolAdminService,
  ) {}

  @UseGuards(SchoolAdminLocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: SchoolAdmin }) {
    return this.schoolAdminAuthService.login(req.user);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.schoolAdminAuthService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.schoolAdminAuthService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  // @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  // @Get('profile')
  // @Roles('school_admin')
  // getProfile(@Request() req) {
  //   // return req.user;
  // }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles('school_admin')
  getMySchool(@CurrentUser() user: SchoolAdmin) {
    return this.schoolAdminService.getMySchool(user);
  }
}

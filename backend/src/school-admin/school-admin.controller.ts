import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Query,
  UseInterceptors,
  Put,
  Param,
} from '@nestjs/common';
import { SchoolAdminAuthService } from './school-admin-auth.service';
import { SchoolAdminService } from './school-admin.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SchoolAdminLocalAuthGuard } from './guards/school-admin-local-auth.guard';
import { SchoolAdmin } from './school-admin.entity';
import { SchoolAdminJwtAuthGuard } from './guards/school-admin-jwt-auth.guard';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryString } from '../common/api-features/api-features';
import { SanitizeResponseInterceptor } from 'src/common/interceptors/sanitize-response.interceptor';
import { DeepSanitizeResponseInterceptor } from 'src/common/interceptors/deep-sanitize-response.interceptor';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdminSchoolGuard } from './guards/school-admin-school.guard';

@Controller('school-admin')
@UseInterceptors(SanitizeResponseInterceptor)
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

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Get('users')
  @Roles('school_admin')
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  findAllUsers(@CurrentUser() admin: SchoolAdmin, @Query() query: QueryString) {
    return this.schoolAdminService.findAllUsers(admin.school.id, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('students')
  @Roles('school_admin')
  async findAllStudents(
    @CurrentUser() admin: SchoolAdmin,
    @Query() query: QueryString,
  ) {
    return this.schoolAdminService.findAllStudents(admin.school.id, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('me')
  @Roles('school_admin')
  getProfile(@CurrentUser() admin: SchoolAdmin) {
    return this.schoolAdminService.getMyProfile(admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles('school_admin')
  async updateProfile(
    @CurrentUser() admin: SchoolAdmin,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.schoolAdminService.updateProfile(admin.id, updateDto);
  }
  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school/details')
  @Roles('school_admin')
  getMySchoolWithDetails(@CurrentUser() user: SchoolAdmin) {
    return this.schoolAdminService.getMySchoolWithRelations(user);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles('school_admin')
  getMySchool(@CurrentUser() user: SchoolAdmin) {
    return this.schoolAdminService.getMySchool(user);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('users/:id')
  @Roles('school_admin')
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() admin: SchoolAdmin,
  ) {
    return this.schoolAdminService.getUserById(id, admin.school.id);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('users/:id/archive')
  @Roles('school_admin')
  async archiveUser(
    @Param('id') id: string,
    @Body() body: { archive: boolean },
  ) {
    return this.schoolAdminService.archiveUser(id, body.archive);
  }
}

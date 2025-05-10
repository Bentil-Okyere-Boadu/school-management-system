import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InvitationService } from './invitation.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { InviteStudentDto } from './dto/invite-student.dto';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { User } from '../user/user.entity';
import { CurrentUser } from '../user/current-user.decorator';
import { SanitizeResponseInterceptor } from '../common/interceptors/sanitize-response.interceptor';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { ForgotPinDto } from './dto/forgot-pin.dto';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';

@Controller('invitations')
@UseInterceptors(SanitizeResponseInterceptor)
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  // Superadmin endpoints
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('admin')
  @Roles('super_admin')
  async inviteAdmin(
    @Body() inviteUserDto: InviteUserDto,
    @CurrentUser() user: SuperAdmin,
  ) {
    return this.invitationService.inviteAdmin(inviteUserDto, user);
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('super_admin')
  @Post('admin/resend/:userId')
  async resendAdminInvitation(
    @Param('userId') userId: string,
    @CurrentUser() user: SuperAdmin,
  ) {
    return this.invitationService.resendAdminInvitation(userId, user);
  }

  // School admin endpoints
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('student')
  inviteStudent(
    @Body() inviteStudentDto: InviteStudentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.inviteStudent(inviteStudentDto, currentUser);
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('teacher')
  inviteTeacher(
    @Body() inviteTeacherDto: InviteTeacherDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.inviteTeacher(inviteTeacherDto, currentUser);
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('student/resend')
  resendStudentInvitation(
    @Body() dto: { email: string },
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.resendStudentInvitation(
      dto.email,
      currentUser,
    );
  }

  @UseGuards(JwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('teacher/resend')
  resendTeacherInvitation(
    @Body() dto: { email: string },
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.resendTeacherInvitation(
      dto.email,
      currentUser,
    );
  }

  // Common endpoints
  @Post('complete-registration')
  async completeRegistration(@Body() completeRegDto: CompleteRegistrationDto) {
    if (!completeRegDto.token || !completeRegDto.password) {
      throw new BadRequestException('Token and password are required');
    }

    await this.invitationService.completeRegistration(
      completeRegDto.token,
      completeRegDto.password,
    );

    return { success: true, message: 'Registration completed successfully' };
  }

  // PIN reset for students and teachers
  @Post('forgot-pin')
  forgotPin(@Body() forgotPinDto: ForgotPinDto) {
    return this.invitationService.forgotPin(forgotPinDto.email);
  }
}

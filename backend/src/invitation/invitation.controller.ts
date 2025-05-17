import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
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
import { StudentService } from 'src/student/student.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminAuthService } from 'src/school-admin/school-admin-auth.service';

@Controller('invitations')
@UseInterceptors(SanitizeResponseInterceptor)
export class InvitationController {
  constructor(
    private invitationService: InvitationService,
    private studentService: StudentService,
    private readonly schoolAdminAuthService: SchoolAdminAuthService,
  ) {}

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
    @CurrentUser() currentUser: SchoolAdmin,
  ) {
    return this.invitationService.inviteStudent(inviteStudentDto, currentUser);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('teacher')
  inviteTeacher(
    @Body() inviteTeacherDto: InviteTeacherDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.invitationService.inviteTeacher(inviteTeacherDto, currentUser);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('school_admin')
  @Post('student/resend/:userId')
  resendStudentInvitation(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: SchoolAdmin,
  ) {
    return this.studentService.resendStudentInvitation(userId, currentUser);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
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

    const schoolAdmin = await this.invitationService.completeRegistration(
      completeRegDto.token,
      completeRegDto.password,
    );

    return this.schoolAdminAuthService.login(schoolAdmin);
  }

  // PIN reset for students and teachers
  @Post('forgot-pin')
  async forgotPin(@Body() forgotPinDto: ForgotPinDto) {
    // Try to find student with this email first
    const result = await this.invitationService.forgotPin(forgotPinDto.email);

    // If the student service didn't throw an error, it either found the student
    // or is returning a generic success response for security
    return result;
  }
}

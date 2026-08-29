import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { InvitationService } from './invitation.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { ResendAdminInvitationDto } from './dto/resend-admin-invitation.dto';
import { InviteStudentDto } from './dto/invite-student.dto';
import { InviteTeacherDto } from './dto/invite-teacher.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { SanitizeResponseInterceptor } from '../common/interceptors/sanitize-response.interceptor';
import { ActiveUserGuard } from '../auth/guards/active-user.guard';
import { ForgotPinDto } from './dto/forgot-pin.dto';
import { SuperAdminJwtAuthGuard } from 'src/super-admin/guards/super-admin-jwt-auth.guard';
import { SuperAdmin } from 'src/super-admin/super-admin.entity';
import { SchoolAdminJwtAuthGuard } from 'src/school-admin/guards/school-admin-jwt-auth.guard';
import { StudentService } from 'src/student/student.service';
import { SchoolAdmin } from 'src/school-admin/school-admin.entity';
import { SchoolAdminAuthService } from 'src/school-admin/school-admin-auth.service';
import { TeacherService } from 'src/teacher/teacher.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ParentLinkService } from 'src/parent/parent-link.service';
import { ParentAuthService } from 'src/parent/parent-auth.service';
import { EmailService } from 'src/common/services/email.service';
import { TenantOnboardingService } from 'src/tenant/tenant-onboarding.service';

@Controller('invitations')
@ApiTags('Invitation')
@UseInterceptors(SanitizeResponseInterceptor)
export class InvitationController {
  constructor(
    private invitationService: InvitationService,
    private studentService: StudentService,
    private teacherService: TeacherService,
    private readonly schoolAdminAuthService: SchoolAdminAuthService,
    private readonly parentLinkService: ParentLinkService,
    private readonly parentAuthService: ParentAuthService,
    private readonly emailService: EmailService,
    private readonly tenantOnboarding: TenantOnboardingService,
  ) {}

  // Superadmin endpoints
  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('admin')
  @Roles(Role.SuperAdmin)
  async inviteAdmin(
    @Body() inviteUserDto: InviteUserDto,
    @CurrentUser() user: SuperAdmin,
  ) {
    return this.tenantOnboarding.inviteSchoolAdmin({
      schoolId: inviteUserDto.schoolId,
      email: inviteUserDto.email,
      firstName: inviteUserDto.firstName,
      lastName: inviteUserDto.lastName,
    });
  }

  @UseGuards(SuperAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  @Post('admin/resend/:invitationId')
  async resendAdminInvitation(
    @Param('invitationId') invitationId: string,
    @Body() resendDto: ResendAdminInvitationDto,
  ) {
    return this.tenantOnboarding.resendSchoolAdminInvitation(
      invitationId,
      resendDto,
    );
  }

  // School admin endpoints
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Post('student')
  inviteStudent(
    @Body() inviteStudentDto: InviteStudentDto,
    @CurrentUser() currentUser: SchoolAdmin,
  ) {
    return this.invitationService.inviteStudent(inviteStudentDto, currentUser);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Post('teacher')
  inviteTeacher(
    @Body() inviteTeacherDto: InviteTeacherDto,
    @CurrentUser() currentUser: SchoolAdmin,
  ) {
    return this.invitationService.inviteTeacher(inviteTeacherDto, currentUser);
  }

  //tod remove
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Post('student/resend/:userId')
  resendStudentInvitation(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: SchoolAdmin,
  ) {
    return this.studentService.resendStudentInvitation(userId, currentUser);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Post('teacher/resend/:userId')
  resendTeacherInvitation(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: SchoolAdmin,
  ) {
    return this.teacherService.resendTeacherInvitation(userId, currentUser);
  }

  // Common endpoints
  @Post('complete-registration')
  @ApiOperation({
    summary:
      'Complete invitation by setting a password (school admin or parent)',
  })
  async completeRegistration(@Body() completeRegDto: CompleteRegistrationDto) {
    if (!completeRegDto.token || !completeRegDto.password) {
      throw new BadRequestException('Token and password are required');
    }

    if (
      await this.tenantOnboarding.hasPendingSchoolAdminInvitation(
        completeRegDto.token,
      )
    ) {
      const schoolAdmin =
        await this.tenantOnboarding.acceptSchoolAdminInvitation(
          completeRegDto.token,
          completeRegDto.password,
        );
      return this.schoolAdminAuthService.login(schoolAdmin);
    }

    const parent = await this.parentLinkService.completeParentInvitation(
      completeRegDto.token,
      completeRegDto.password,
    );
    if (!parent) {
      throw new BadRequestException(
        'Invalid invitation token - token not found',
      );
    }
    await this.emailService.sendRegistrationConfirmationEmail(parent);
    return this.parentAuthService.login(parent);
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

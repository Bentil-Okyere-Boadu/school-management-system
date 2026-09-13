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
  Patch,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
import { Role } from '../auth/enums/role.enum';
import { QueryString } from '../common/api-features/api-features';
import { SanitizeResponseInterceptor } from 'src/common/interceptors/sanitize-response.interceptor';
import { DeepSanitizeResponseInterceptor } from 'src/common/interceptors/deep-sanitize-response.interceptor';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SchoolAdminSchoolGuard } from './guards/school-admin-school.guard';
import { SkipTenantScope } from 'src/common/tenant/skip-tenant-scope.decorator';
import { AdmissionService } from 'src/admission/admission.service';
import { UpdateAdmissionStatusDto } from 'src/admission/dto/create-admission-student-info.dto';
import {
  AttendanceFilter,
  AttendanceService,
} from 'src/attendance/attendance.service';
import { ParentService } from 'src/parent/parent.service';
import { CreateParentDto } from 'src/parent/dto/create-parent-dto';
import { UpdateParentDto } from 'src/parent/dto/update-parent-dto';

@ApiTags('School Admin')
@Controller('school-admin')
@UseInterceptors(SanitizeResponseInterceptor)
export class SchoolAdminController {
  constructor(
    private readonly schoolAdminAuthService: SchoolAdminAuthService,
    private readonly schoolAdminService: SchoolAdminService,
    private readonly admissionService: AdmissionService,
    private readonly attendanceService: AttendanceService,
    private readonly parentService: ParentService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(SchoolAdminLocalAuthGuard)
  @Post('login')
  @SkipTenantScope()
  login(@Request() req: { user: SchoolAdmin }) {
    return this.schoolAdminAuthService.login(req.user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.schoolAdminAuthService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
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
  @Roles(Role.SchoolAdmin)
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  findAllUsers(@Query() query: QueryString) {
    return this.schoolAdminService.findAllUsers(undefined, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('students')
  @Roles(Role.SchoolAdmin)
  async findAllStudents(@Query() query: QueryString) {
    return this.schoolAdminService.findAllStudents(undefined, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('students/for-class-assignment')
  @Roles(Role.SchoolAdmin)
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  findStudentsForClassAssignment(@Query() query: QueryString) {
    return this.schoolAdminService.findStudentsForClassAssignment(
      undefined,
      query,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('me')
  @Roles(Role.SchoolAdmin)
  getProfile(@CurrentUser() admin: SchoolAdmin) {
    return this.schoolAdminService.getMyProfile(admin);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles(Role.SchoolAdmin)
  async updateProfile(
    @CurrentUser() admin: SchoolAdmin,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.schoolAdminService.updateProfile(admin.id, updateDto);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  @Get('admissions/analytics')
  async getAdmissionAnalytics() {
    return this.admissionService.getAdmissionAnalytics();
  }
  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school/details')
  @Roles(Role.SchoolAdmin)
  getMySchoolWithDetails(@CurrentUser() user: SchoolAdmin) {
    return this.schoolAdminService.getMySchoolWithRelations(user);
  }

  @UseGuards(SchoolAdminJwtAuthGuard)
  @Get('my-school')
  @Roles(Role.SchoolAdmin)
  getMySchool(@CurrentUser() user: SchoolAdmin) {
    return this.schoolAdminService.getMySchool(user);
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('users/:id')
  @Roles(Role.SchoolAdmin)
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  async getUserById(@Param('id') id: string) {
    return this.schoolAdminService.getUserById(id);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Post('students/:studentId/parents')
  @Roles(Role.SchoolAdmin)
  async addStudentGuardian(
    @Param('studentId') studentId: string,
    @Body() dto: CreateParentDto,
  ) {
    const student = await this.schoolAdminService.findStudentById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return this.parentService.create(dto, studentId);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Patch('students/:studentId/parents/:parentId')
  @Roles(Role.SchoolAdmin)
  async updateStudentGuardian(
    @Param('studentId') studentId: string,
    @Param('parentId') parentId: string,
    @Body() dto: UpdateParentDto,
  ) {
    const student = await this.schoolAdminService.findStudentById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return this.parentService.update(parentId, dto, studentId);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Delete('students/:studentId/parents/:parentId')
  @Roles(Role.SchoolAdmin)
  async removeStudentGuardian(
    @Param('studentId') studentId: string,
    @Param('parentId') parentId: string,
  ) {
    const student = await this.schoolAdminService.findStudentById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return this.parentService.remove(parentId, studentId);
  }
  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Get('admissions/:applicationId')
  @Roles(Role.SchoolAdmin)
  getAdmissionById(@Param('applicationId') applicationId: string) {
    return this.admissionService.getAdmissionById(applicationId);
  }
  @Get('admissions')
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  getAdmissionsBySchool(@Query() query: QueryString) {
    return this.admissionService.findAllBySchool(query);
  }
  @Patch('admissions/:applicationId/status')
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.SchoolAdmin)
  updateAdmissionStatus(
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateAdmissionStatusDto,
  ) {
    return this.admissionService.updateAdmissionStatus(
      applicationId,
      dto.status,
    );
  }
  @Put('users/:id/archive')
  @Roles(Role.SchoolAdmin)
  async archiveUser(
    @Param('id') id: string,
    @Body() body: { archive: boolean },
  ) {
    return this.schoolAdminService.archiveUser(id, body.archive);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('teachers/:id/assignments')
  @Roles(Role.SchoolAdmin)
  async getTeacherAssignments(@Param('id') teacherId: string) {
    return this.schoolAdminService.getTeacherAssignments(teacherId);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('teachers/:id/suspend')
  @Roles(Role.SchoolAdmin)
  async suspendTeacher(
    @Param('id') teacherId: string,
    @Body() body: { suspend: boolean },
  ) {
    return this.schoolAdminService.suspendTeacher(teacherId, body.suspend);
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Post('admissions/:applicationId/interview')
  @Roles(Role.SchoolAdmin)
  async sendInterviewInvitation(
    @Param('applicationId') applicationId: string,
    @Body() interviewData: { interviewDate: string; interviewTime: string },
  ) {
    return this.admissionService.sendInterviewInvitation(
      applicationId,
      interviewData.interviewDate,
      interviewData.interviewTime,
    );
  }
  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('users/:id')
  @Roles(Role.SchoolAdmin)
  async deleteUser(@Param('id') id: string) {
    return this.schoolAdminService.deleteUser(id);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('dashboard/stats')
  @Roles(Role.SchoolAdmin)
  async getDashboardStats() {
    return this.schoolAdminService.getDashboardStats();
  }
  // @UseGuards(
  //   SchoolAdminJwtAuthGuard,
  //   ActiveUserGuard,
  //   RolesGuard,
  //   SchoolAdminSchoolGuard,
  // )
  // @Delete('admissions/:applicationId')
  // @Roles('school_admin')
  // async deleteAdmission(
  //   @Param('applicationId') applicationId: string,
  //   @CurrentUser() admin: SchoolAdmin,
  // ) {
  //   return this.admissionService.deleteAdmission(
  //     applicationId,
  //     admin.school.id,
  //   );
  // }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/attendance')
  @Roles(Role.SchoolAdmin)
  async getClassAttendance(
    @Param('classLevelId') classLevelId: string,
    @Query()
    {
      filterType,
      date,
      startDate,
      endDate,
      year,
      month,
      week,
      weekOfMonth,
      summaryOnly,
    }: AttendanceFilter,
  ) {
    // Optionally, check if user is assigned to this class
    const filter: AttendanceFilter = {
      classLevelId,
      filterType,
      date,
      startDate,
      endDate,
      year,
      month,
      week,
      weekOfMonth,
      summaryOnly,
    };
    if (weekOfMonth && filterType !== 'week') {
      filter.filterType = 'week';
    }

    if (startDate && endDate && filterType !== 'custom') {
      filter.filterType = 'custom';
    }

    return this.attendanceService.getClassAttendance(filter);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/terms/:termId/attendance')
  @Roles(Role.SchoolAdmin)
  async getClassAttendanceByTerm(
    @Param('classLevelId') classLevelId: string,
    @Param('termId') termId: string,
  ) {
    return this.attendanceService.getClassAttendanceByTerm(
      classLevelId,
      termId,
    );
  }

  @UseGuards(
    SchoolAdminJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    SchoolAdminSchoolGuard,
  )
  @Put('admissions/:applicationId/archive')
  @Roles(Role.SchoolAdmin)
  async archiveAdmission(
    @Param('applicationId') applicationId: string,
    @Body() body: { archive: boolean },
  ) {
    return this.admissionService.archiveAdmission(applicationId, body.archive);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/calendars/:calendarId/attendance')
  @Roles(Role.SchoolAdmin)
  async getClassAttendanceByAcademicYear(
    @Param('classLevelId') classLevelId: string,
    @Param('calendarId') calendarId: string,
  ) {
    return this.attendanceService.getClassAttendanceByAcademicYear(
      classLevelId,
      calendarId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/calendars/:calendarId/attendance/grouped')
  @Roles(Role.SchoolAdmin)
  async getClassAttendanceGroupedByTermAndMonth(
    @Param('classLevelId') classLevelId: string,
    @Param('calendarId') calendarId: string,
  ) {
    return this.attendanceService.getClassAttendanceGroupedByTermAndMonth(
      classLevelId,
      calendarId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(
    'classes/:classLevelId/students/:studentId/calendars/:calendarId/attendance/grouped',
  )
  @Roles(Role.SchoolAdmin)
  async getStudentAttendanceGroupedByTermAndMonth(
    @Param('classLevelId') classLevelId: string,
    @Param('studentId') studentId: string,
    @Param('calendarId') calendarId: string,
  ) {
    return this.attendanceService.getStudentAttendanceGroupedByTermAndMonth(
      classLevelId,
      studentId,
      calendarId,
    );
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('assignments')
  @Roles(Role.SchoolAdmin)
  async getAllAssignments(@Query() query: QueryString) {
    return this.schoolAdminService.findAllAssignments(undefined, query);
  }

  @UseGuards(SchoolAdminJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('assignments/:id/students')
  @Roles(Role.SchoolAdmin)
  async getAssignmentStudents(
    @CurrentUser() admin: SchoolAdmin,
    @Param('id') assignmentId: string,
    @Query('pending') pending?: string,
    @Query('submitted') submitted?: string,
  ) {
    return this.schoolAdminService.getAssignmentStudents(
      admin,
      assignmentId,
      pending,
      submitted,
    );
  }
}

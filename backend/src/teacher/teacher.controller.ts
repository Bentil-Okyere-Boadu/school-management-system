import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Param,
  UseInterceptors,
  Query,
  Put,
} from '@nestjs/common';
import { TeacherAuthService } from './teacher.auth.service';
import { TeacherService } from './teacher.service';
import { TeacherLocalAuthGuard } from './guards/teacher-local-auth.guard';
import { Teacher } from './teacher.entity';
import { ForgotTeacherPasswordDto } from './dto/forgot-teacher-password.dto';
import { TeacherJwtAuthGuard } from './guards/teacher-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { ClassLevelService } from 'src/class-level/class-level.service';
import {
  AttendanceFilter,
  AttendanceService,
} from 'src/attendance/attendance.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { QueryString } from 'src/common/api-features/api-features';
import { SchoolAdminService } from 'src/school-admin/school-admin.service';
import { DeepSanitizeResponseInterceptor } from 'src/common/interceptors/deep-sanitize-response.interceptor';

@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherAuthService: TeacherAuthService,
    private readonly TeacherService: TeacherService,
    private readonly classLevelService: ClassLevelService,
    private readonly attendanceService: AttendanceService,
    private readonly schoolAdminService: SchoolAdminService,
  ) {}

  @UseGuards(TeacherLocalAuthGuard)
  @Post('login')
  @Roles('teacher')
  login(@Request() req: { user: Teacher }) {
    return this.teacherAuthService.login(req.user);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('students')
  @Roles('teacher')
  async findAllStudents(
    @CurrentUser() user: Teacher,
    @Query() query: QueryString,
  ) {
    return this.schoolAdminService.findAllStudents(user.school.id, query);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('users/:id')
  @Roles('teacher')
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  async getUserById(@Param('id') id: string, @CurrentUser() teacher: Teacher) {
    return this.schoolAdminService.getUserById(id, teacher.school.id);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-classes')
  @Roles('teacher')
  async getMyClasses(
    @CurrentUser() user: Teacher,
    @Query() query: QueryString,
  ) {
    return this.classLevelService.getClassesForTeacher(user.id, query);
  }
  @Get('classes/:id/name')
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles('teacher')
  async getClassLevelName(@Param('id') id: string) {
    return this.classLevelService.getClassLevelNameById(id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/attendance')
  @Roles('teacher')
  async getClassAttendance(
    @Param('classLevelId') classLevelId: string,
    @Query('filterType')
    filterType: 'day' | 'week' | 'month' | 'year' | 'custom' = 'day',
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('week') week?: number,
    @Query('weekOfMonth') weekOfMonth?: number,
    @Query('summaryOnly') summaryOnly?: boolean,
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

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('classes/:classLevelId/attendance')
  @Roles('teacher')
  async markAttendance(
    @Param('classLevelId') classLevelId: string,
    @Body()
    body: {
      date: string;
      records: { studentId: string; status: 'present' | 'absent' }[];
    },
    @CurrentUser() user: Teacher,
  ) {
    // Optionally, check if user is assigned to this class
    return this.attendanceService.markAttendance(
      classLevelId,
      body.date,
      body.records,
    );
  }
  @Get(':classLevelId/summary')
  getClassAttendanceSummary(@Param('classLevelId') classLevelId: string) {
    return this.attendanceService.getClassAttendanceSummary(classLevelId);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotTeacherPasswordDto) {
    return this.TeacherService.forgotPin(forgotPasswordDto.email);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles('teacher')
  async updateProfile(
    @CurrentUser() user: Teacher,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.TeacherService.updateProfile(user.id, updateDto);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('me')
  @Roles('teacher')
  getProfile(@CurrentUser() teacher: Teacher) {
    return this.TeacherService.getMyProfile(teacher);
  }
}

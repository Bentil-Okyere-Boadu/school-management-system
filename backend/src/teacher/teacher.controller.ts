import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Get,
  Param,
  Query,
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

@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherAuthService: TeacherAuthService,
    private readonly TeacherService: TeacherService,
    private readonly classLevelService: ClassLevelService,
    private readonly attendanceService: AttendanceService,
  ) {}

  @UseGuards(TeacherLocalAuthGuard)
  @Post('login')
  @Roles('teacher')
  login(@Request() req: { user: Teacher }) {
    return this.teacherAuthService.login(req.user);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-classes')
  async getMyClasses(@CurrentUser() user: Teacher) {
    return this.classLevelService.getClassesForTeacher(user.id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/attendance')
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
    };

    return this.attendanceService.getClassAttendance(filter);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('classes/:classLevelId/attendance')
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

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotTeacherPasswordDto) {
    return this.TeacherService.forgotPin(forgotPasswordDto.email);
  }
}

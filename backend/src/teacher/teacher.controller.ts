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
  Patch,
  Delete,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { Role } from '../auth/enums/role.enum';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { QueryString } from 'src/common/api-features/api-features';
import { SchoolAdminService } from 'src/school-admin/school-admin.service';
import { DeepSanitizeResponseInterceptor } from 'src/common/interceptors/deep-sanitize-response.interceptor';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { IsClassTeacherGuard } from 'src/auth/guards/class-teacher.guard';
import { CreateTeacherTopicDto } from './dto/create-teacher-topic.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateTeacherTopicDto } from './dto/update-teacher-topic.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherAuthService: TeacherAuthService,
    private readonly TeacherService: TeacherService,
    private readonly classLevelService: ClassLevelService,
    private readonly attendanceService: AttendanceService,
    private readonly schoolAdminService: SchoolAdminService,
    private readonly academicCalendarService: AcademicCalendarService,
  ) {}

  @UseGuards(TeacherLocalAuthGuard)
  @Post('login')
  @Roles(Role.Teacher)
  login(@Request() req: { user: Teacher }) {
    return this.teacherAuthService.login(req.user);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('students')
  @Roles(Role.Teacher)
  async findAllStudents(
    @CurrentUser() user: Teacher,
    @Query() query: QueryString,
  ) {
    return this.schoolAdminService.findAllStudents(user.school.id, query);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('users/:id')
  @Roles(Role.Teacher)
  @UseInterceptors(DeepSanitizeResponseInterceptor)
  async getUserById(@Param('id') id: string, @CurrentUser() teacher: Teacher) {
    return this.schoolAdminService.getUserById(id, teacher.school.id);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-classes')
  @Roles(Role.Teacher)
  async getMyClasses(
    @CurrentUser() user: Teacher,
    @Query() query: QueryString,
  ) {
    return this.classLevelService.getClassesForTeacher(user.id, query);
  }
  @Get('classes/:id/name')
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Roles(Role.Teacher)
  async getClassLevelName(@Param('id') id: string) {
    return this.classLevelService.getClassLevelNameById(id);
  }
  //Todo
  @Get('classes/:classLevelId/students/:studentId/attendance')
  getStudentAttendance(
    @Param('classLevelId') classLevelId: string,
    @Param('studentId') studentId: string,
    @Query() query: AttendanceFilter,
  ) {
    return this.attendanceService.getStudentAttendance(
      classLevelId,
      studentId,
      query,
    );
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/attendance')
  @Roles(Role.Teacher)
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

  @UseGuards(
    TeacherJwtAuthGuard,
    ActiveUserGuard,
    RolesGuard,
    IsClassTeacherGuard,
  )
  @Post('classes/:classLevelId/attendance')
  @Roles(Role.Teacher)
  async markAttendance(
    @Param('classLevelId') classLevelId: string,
    @Body()
    body: {
      date: string;
      records: { studentId: string; status: 'present' | 'absent' }[];
    },
    @CurrentUser() _user: Teacher,
  ) {
    // Optionally, check if user is assigned to this class
    return this.attendanceService.markAttendance(
      classLevelId,
      body.date,
      body.records,
    );
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('me/is-class-teacher')
  async checkIsClassTeacher(
    @CurrentUser() teacher: Teacher,
    @Query('classLevelId') classLevelId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return await this.TeacherService.checkIfClassTeacher(
      teacher.id,
      classLevelId,
      studentId,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':classLevelId/summary')
  getClassAttendanceSummary(@Param('classLevelId') classLevelId: string) {
    return this.attendanceService.getClassAttendanceSummary(classLevelId);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('calendars')
  @Roles(Role.Teacher)
  async getAllAcademicCalendars(@CurrentUser() teacher: Teacher) {
    return this.academicCalendarService.findAllCalendars(teacher.school.id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(
    'classes/:classLevelId/students/:studentId/calendars/:calendarId/attendance/grouped',
  )
  @Roles(Role.Teacher)
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
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotTeacherPasswordDto) {
    return this.TeacherService.forgotPin(forgotPasswordDto.email);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles(Role.Teacher)
  async updateProfile(
    @CurrentUser() user: Teacher,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.TeacherService.updateProfile(user.id, updateDto);
  }
  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('me')
  @Roles(Role.Teacher)
  getProfile(@CurrentUser() teacher: Teacher) {
    return this.TeacherService.getMyProfile(teacher);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-subject')
  @Roles(Role.Teacher)
  getMySubject(@CurrentUser() teacher: Teacher) {
    return this.TeacherService.getMySubjectCatalogs(teacher.id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('my-topics')
  @Roles(Role.Teacher)
  getMyTopics(@CurrentUser() teacher: Teacher) {
    return this.TeacherService.getMyTopics(teacher.id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('topics')
  @Roles(Role.Teacher)
  createTopic(
    @CurrentUser() teacher: Teacher,
    @Body() dto: CreateTeacherTopicDto,
  ) {
    return this.TeacherService.createTopic(teacher, dto);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('topics/:id')
  @Roles(Role.Teacher)
  updateTopic(
    @CurrentUser() teacher: Teacher,
    @Param('id') topicId: string,
    @Body() dto: UpdateTeacherTopicDto,
  ) {
    return this.TeacherService.updateTeacherTopic(teacher, topicId, dto);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('topics/:id')
  @Roles(Role.Teacher)
  deleteTopic(@CurrentUser() teacher: Teacher, @Param('id') topicId: string) {
    return this.TeacherService.deleteTeacherTopic(teacher, topicId);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('assignments')
  @Roles(Role.Teacher)
  @UseInterceptors(FileInterceptor('file'))
  createAssignment(
    @CurrentUser() teacher: Teacher,
    @Body() dto: CreateAssignmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.TeacherService.createAssignment(teacher, dto, file);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('assignments')
  @Roles(Role.Teacher)
  getMyAssignments(@CurrentUser() teacher: Teacher) {
    return this.TeacherService.getMyAssignments(teacher.id);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('assignments/:id')
  @Roles(Role.Teacher)
  @UseInterceptors(FileInterceptor('file'))
  updateAssignment(
    @CurrentUser() teacher: Teacher,
    @Param('id') assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.TeacherService.updateAssignment(
      teacher,
      assignmentId,
      dto,
      file,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete('assignments/:id')
  @Roles(Role.Teacher)
  deleteAssignment(
    @CurrentUser() teacher: Teacher,
    @Param('id') assignmentId: string,
  ) {
    return this.TeacherService.deleteAssignment(teacher, assignmentId);
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('assignments/:id/students')
  @Roles(Role.Teacher)
  getAssignmentStudents(
    @CurrentUser() teacher: Teacher,
    @Param('id') assignmentId: string,
    @Query('pending') pending?: string,
    @Query('submitted') submitted?: string,
  ) {
    return this.TeacherService.getAssignmentStudents(
      teacher,
      assignmentId,
      pending,
      submitted,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('assignments/:id/submissions/:studentId')
  @Roles(Role.Teacher)
  getStudentSubmission(
    @CurrentUser() teacher: Teacher,
    @Param('id') assignmentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.TeacherService.getStudentSubmission(
      teacher,
      assignmentId,
      studentId,
    );
  }

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch('assignments/:id/submissions/:studentId/grade')
  @Roles(Role.Teacher)
  gradeSubmission(
    @CurrentUser() teacher: Teacher,
    @Param('id') assignmentId: string,
    @Param('studentId') studentId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.TeacherService.gradeSubmission(
      teacher,
      assignmentId,
      studentId,
      dto,
    );
  }
}

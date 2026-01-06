import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Put,
  Get,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import { StudentAuthService } from './student.auth.service';
import { Student } from './student.entity';
import { StudentLocalAuthGuard } from './guards/student-local-auth.guard';
import { ForgotStudentPasswordDto } from './dto/forgot-student-password.dto';
import { StudentService } from './student.service';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { StudentJwtAuthGuard } from './guards/student-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { ParentService } from 'src/parent/parent.service';
import { CreateParentDto } from 'src/parent/dto/create-parent-dto';
import { UpdateParentDto } from 'src/parent/dto/update-parent-dto';
import { AttendanceService } from 'src/attendance/attendance.service';
import { AcademicCalendarService } from 'src/academic-calendar/academic-calendar.service';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentAuthService: StudentAuthService,
    private readonly studentService: StudentService,
    private readonly parentService: ParentService,
    private readonly attendanceService: AttendanceService,
    private readonly academicCalendarService: AcademicCalendarService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(StudentLocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: Student }) {
    return this.studentAuthService.login(req.user);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotStudentPasswordDto) {
    return this.studentService.forgotPin(forgotPasswordDto.email);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles(Role.Student)
  async updateProfile(
    @CurrentUser() admin: Student,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.studentService.updateProfile(admin.id, updateDto);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id/parents')
  @Roles(Role.Student)
  findOne(@Param('id') id: string) {
    return this.parentService.findOne(id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post(':studentId/parents')
  @Roles(Role.Student)
  createParent(
    @Param('studentId') studentId: string,
    @Body() createParentDto: CreateParentDto,
  ) {
    return this.parentService.create(createParentDto, studentId);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch(':id/parents')
  @Roles(Role.Student)
  updateParent(
    @CurrentUser() student: Student,
    @Param('parentId') parentId: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    return this.parentService.update(parentId, updateParentDto, student.id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Delete(':id/parents')
  remove(@Param('id') id: string) {
    return this.parentService.remove(id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('me')
  @Roles(Role.Student)
  getProfile(@CurrentUser() student: Student) {
    return this.studentService.getMyProfile(student);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('classes/:classLevelId/calendars/:calendarId/attendance/grouped')
  @Roles(Role.Student)
  async getMyAttendanceGroupedByTermAndMonth(
    @CurrentUser() student: Student,
    @Param('classLevelId') classLevelId: string,
    @Param('calendarId') calendarId: string,
  ) {
    return await this.attendanceService.getStudentAttendanceGroupedByTermAndMonth(
      classLevelId,
      student.id,
      calendarId,
    );
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('calendars')
  @Roles(Role.Student)
  async getAllAcademicCalendars(@CurrentUser() student: Student) {
    return this.academicCalendarService.findAllCalendars(student.school.id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('assignments')
  @Roles(Role.Student)
  getMyAssignments(
    @CurrentUser() student: Student,
    @Query('pending') pending?: string,
    @Query('submitted') submitted?: string,
    @Query('graded') graded?: string,
  ) {
    return this.studentService.getMyAssignments(
      student,
      pending,
      submitted,
      graded,
    );
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post('assignments/:id/submit')
  @Roles(Role.Student)
  @UseInterceptors(FileInterceptor('file'))
  async submitAssignment(
    @CurrentUser() student: Student,
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.studentService.submitAssignment(
      student,
      assignmentId,
      dto,
      file,
    );
  }
}

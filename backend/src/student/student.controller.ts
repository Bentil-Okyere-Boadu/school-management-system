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
} from '@nestjs/common';

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
import { UpdateProfileDto } from 'src/profile/dto/update-profile.dto';
import { ParentService } from 'src/parent/parent.service';
import { CreateParentDto } from 'src/parent/dto/create-parent-dto';
import { UpdateParentDto } from 'src/parent/dto/update-parent-dto';

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentAuthService: StudentAuthService,
    private readonly studentService: StudentService,
    private readonly parentService: ParentService,
  ) {}

  @UseGuards(StudentLocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: Student }) {
    return this.studentAuthService.login(req.user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotStudentPasswordDto) {
    return this.studentService.forgotPin(forgotPasswordDto.email);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Put('profile/me')
  @Roles('student')
  async updateProfile(
    @CurrentUser() admin: Student,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.studentService.updateProfile(admin.id, updateDto);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':id/parents')
  @Roles('student')
  findOne(@Param('id') id: string) {
    return this.parentService.findOne(id);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Post(':studentId/parents')
  @Roles('student')
  createParent(
    @Param('studentId') studentId: string,
    @Body() createParentDto: CreateParentDto,
  ) {
    return this.parentService.create(createParentDto, studentId);
  }

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Patch(':id/parents')
  @Roles('student')
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
  @Roles('student')
  getProfile(@CurrentUser() student: Student) {
    return this.studentService.getMyProfile(student);
  }
}

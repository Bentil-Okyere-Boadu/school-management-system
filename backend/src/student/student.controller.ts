import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Put,
  Get,
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

@Controller('student')
export class StudentController {
  constructor(
    private readonly studentAuthService: StudentAuthService,
    private readonly studentService: StudentService,
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
  @Get('me')
  @Roles('student')
  getProfile(@CurrentUser() student: Student) {
    return this.studentService.getMyProfile(student);
  }
}

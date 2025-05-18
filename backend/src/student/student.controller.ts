import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';

import { StudentAuthService } from './student.auth.service';
import { Student } from './student.entity';
import { StudentLocalAuthGuard } from './guards/student-local-auth.guard';
import { ForgotStudentPasswordDto } from './dto/forgot-student-password.dto';
import { StudentService } from './student.service';

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
}

import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common';
import { TeacherAuthService } from './teacher.auth.service';
import { TeacherService } from './teacher.service';
import { TeacherLocalAuthGuard } from './guards/teacher-local-auth.guard';
import { Teacher } from './teacher.entity';
import { ForgotTeacherPasswordDto } from './dto/forgot-teacher-password.dto';

@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacherAuthService: TeacherAuthService,
    private readonly TeacherService: TeacherService,
  ) {}
  @UseGuards(TeacherLocalAuthGuard)
  @Post('login')
  login(@Request() req: { user: Teacher }) {
    return this.teacherAuthService.login(req.user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotTeacherPasswordDto) {
    return this.TeacherService.forgotPin(forgotPasswordDto.email);
  }
}

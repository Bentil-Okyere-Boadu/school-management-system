import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentLocalAuthGuard } from '../auth/guards/student-local-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    // private readonly authService: AuthService,
  ) {}

  @UseGuards(StudentLocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    //  return this.authService.generateToken(req.user);
  }

  @Post('forgot-pin')
  async forgotPin(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    return this.studentService.forgotPin(body.email);
  }
}

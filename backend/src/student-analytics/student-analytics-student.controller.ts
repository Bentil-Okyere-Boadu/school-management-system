import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { StudentJwtAuthGuard } from 'src/student/guards/student-jwt-auth.guard';
import { Student } from 'src/student/student.entity';
import { StudentAnalyticsService } from './student-analytics.service';

@ApiTags('Student — Student analytics')
@Controller('student')
export class StudentAnalyticsStudentController {
  constructor(
    private readonly studentAnalyticsService: StudentAnalyticsService,
  ) {}

  @UseGuards(StudentJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get('performance-analytics')
  @Roles(Role.Student)
  async getPerformanceAnalytics(
    @Query('academicTermId') academicTermId: string,
    @CurrentUser() student: Student,
  ) {
    if (!academicTermId?.trim()) {
      throw new BadRequestException('academicTermId is required');
    }
    return this.studentAnalyticsService.getPerformanceAnalyticsForStudent(
      student,
      academicTermId.trim(),
    );
  }
}

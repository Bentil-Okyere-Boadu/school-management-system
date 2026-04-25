import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeacherJwtAuthGuard } from 'src/teacher/guards/teacher-jwt-auth.guard';
import { ActiveUserGuard } from 'src/auth/guards/active-user.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Teacher } from 'src/teacher/teacher.entity';
import { StudentAnalyticsService } from './student-analytics.service';

@ApiTags('Teacher — Student analytics')
@Controller('teacher/students')
export class StudentAnalyticsTeacherController {
  constructor(
    private readonly studentAnalyticsService: StudentAnalyticsService,
  ) {}

  @UseGuards(TeacherJwtAuthGuard, ActiveUserGuard, RolesGuard)
  @Get(':studentId/performance-analytics')
  @Roles(Role.Teacher)
  async getPerformanceAnalytics(
    @Param('studentId') studentId: string,
    @Query('academicTermId') academicTermId: string,
    @CurrentUser() teacher: Teacher,
  ) {
    if (!academicTermId?.trim()) {
      throw new BadRequestException('academicTermId is required');
    }
    return this.studentAnalyticsService.getPerformanceAnalyticsForTeacher(
      teacher,
      studentId,
      academicTermId.trim(),
    );
  }
}
